import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {CustomAPIParams, ServerLog, SSBSearchResponse, SSBTableMetadata} from "@/app/types";
import {customWrapper} from "@/app/custom/customWrapper";
import {z} from "zod";
import {customChooseTablePrompt} from "@/app/custom/customChooseTablePrompt";
import {keywordsOrIdPrompt} from "@/app/custom/keywordsOrIdPrompt";
import {keywordsPrompt} from "@/app/custom/keywordsPrompt";
import {customTableSelectionPrompt} from "@/app/custom/customTableSelectionPrompt";


// Schema builders
const buildKeywordsOrIdSchema = (numKeywords: number) =>
    z
        .object({
            keywords: z.array(z.string()).max(numKeywords).optional(),
            id: z.string().optional(),
        })
        .describe(`Either up to ${numKeywords} keywords or a specific table ID.`);

const buildDecisionSchema = z
    .object({ decision: z.enum(['ACCEPT', 'NEXT']) })
    .describe("'ACCEPT' to choose table, 'NEXT' for next candidate.");

// Helpers
async function fetchMetadata(id: string, baseURL: string): Promise<SSBTableMetadata> {
    const res = await fetch(`${baseURL}/tables/${id}/metadata?lang=en&outputFormat=json-stat2`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
}

function buildDimensionPrompt(dimensions: SSBTableMetadata['dimension'], limit = 100): string {
    const lines: string[] = [];
    const half = limit / 2;
    const remaining = Object.keys(dimensions).length - limit;
    
    for (const [key, value] of Object.entries(dimensions)) {
        const items = Object.entries(value.category.label);
        lines.push(`${key}: ${value.label} (${items.length} values)`);
        const slice = items.length > limit
            ? [...items.slice(0, half), [`...(${remaining} more)...`,''], ...items.slice(items.length - half)]
            : items;
        slice.forEach(([label, index]) => {
            const unit = value.category.unit?.[label];
            lines.push(`  ${label}: ${index}${unit ? ` (${unit.base}, decimals: ${unit.decimals})` : ''}`);
        });
    }
    return lines.join('\n');
}

async function isTableAcceptable(
    model: BaseChatModel,
    params: CustomAPIParams,
    metadata: SSBTableMetadata,
    sendLog: (log: ServerLog) => void
): Promise<boolean> {
    const prompt = [
        customChooseTablePrompt,
        `Current table: '${metadata.label}'. Variables:`,
        buildDimensionPrompt(metadata.dimension)
    ].join('\n\n');

    sendLog({ content: `Checking table '${metadata.extension.px.tableid}'`, eventType: 'nav' });
    const { decision } = await customWrapper(model, params, prompt, buildDecisionSchema);
    if (decision === 'ACCEPT') {
        sendLog({ content: `Selected table '${metadata.extension.px.tableid}' ('${metadata.label}')`, eventType: 'nav' });
        return true;
    }
    return false;
}

export async function customKeywordSearch(
    model: BaseChatModel,
    params: CustomAPIParams,
    numKeywords: number,
    numTables: number,
    sendLog: (log: ServerLog) => void,
    baseURL = 'https://data.ssb.no/api/pxwebapi/v2-beta/'
): Promise<SSBTableMetadata | undefined> {
    // 1. Ask user for keywords or ID
    const keywordsOrId = await customWrapper(
        model,
        params,
        keywordsOrIdPrompt,
        buildKeywordsOrIdSchema(numKeywords)
    );

    // 2. If ID provided, fetch & prompt
    if (keywordsOrId.id) {
        const metadata = await fetchMetadata(keywordsOrId.id, baseURL);
        if (await isTableAcceptable(model, params, metadata, sendLog)) {
            return metadata;
        }
    }

    // 3. Ensure keywords
    const keywordsArr = keywordsOrId.keywords ?? (
        (await customWrapper(model, params, keywordsPrompt,
            z.object({ keywords: z.array(z.string()).max(numKeywords) })
        )).keywords
    );
    const query = keywordsArr.join(',');
    sendLog({ content: `Fetching tables for '${keywordsArr.join(', ')}`, eventType: 'nav' });

    // 4. Search tables
    const searchRes = await fetch(
        `${baseURL}/tables?lang=en&pageSize=${numTables}&query=${encodeURIComponent(query)}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );
    let tables = (await searchRes.json()) as SSBSearchResponse;
    if (keywordsOrId.id) {
        tables.tables = tables.tables.filter(t => t.id !== keywordsOrId.id);
    }
    sendLog({ content: `Fetched ${tables.tables.length} tables`, eventType: 'nav' });

    // 5. Select candidates
    const entriesPrompt = tables.tables.map(t =>
        `id: "${t.id}", label: "${t.label}", period: ${t.firstPeriod}-${t.lastPeriod}, timeUnit: "${t.timeUnit}${t.variableNames ? `", variables: ${t.variableNames.join(', ')}` : ''}`
    ).join('\n');

    const ids = tables.tables.map(t => t.id);
    const selectionSchema = z.object({ ids: z.array(z.enum([ids[0], ...ids.slice(1)])).min(3).max(10) })

    const selectedIds = await customWrapper(
        model,
        params,
        `${customTableSelectionPrompt}\n${entriesPrompt}`,
        selectionSchema
    );
    
    let possibleTables: SSBTableMetadata[] = [];

    // 6. Iterate selected
    for (const id of selectedIds.ids) {
        const metadata = await fetchMetadata(id, baseURL);
        if (await isTableAcceptable(model, params, metadata, sendLog)) {
            return metadata;
        }
        possibleTables.push(metadata);
    }

    // 7. Abort
    sendLog({
        content: JSON.stringify(possibleTables),
        eventType: 'abort'
    });
    
    return undefined;
}
