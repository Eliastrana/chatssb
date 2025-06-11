import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {CustomAPIParams, ServerLog, SSBSearchResponse, SSBTableMetadata} from "@/app/types";
import {customWrapper} from "@/app/custom/customWrapper";
import {z} from "zod";
import {customKeywordSearchPrompt} from "@/app/custom/customKeywordSearchPrompt";
import {customTableSelectionPrompt} from "@/app/custom/customTableSelectionPrompt";

export async function customKeywordSearch(
    model: BaseChatModel,
    params: CustomAPIParams,
    numKeywords: number,
    numTables: number,
    sendLog: (log: ServerLog) => void,
    baseURL: string = 'https://data.ssb.no/api/pxwebapi/v2-beta/'
): Promise<SSBTableMetadata> {


    const keywordSearchSchema = z.object({
        input: z.array(z.string()).max(numKeywords).describe("Keywords to search for an" +
            " unknown table").or(z.string().describe("Table ID to" +
            " select a specific table.")),
    });

    const maxBreathPrompt = `You can select up to ${numKeywords} keyword(s).`;
    
    const keywords = await customWrapper(
        model,
        params,
        { schema: keywordSearchSchema, systemPrompt: `${customKeywordSearchPrompt}\n${maxBreathPrompt}` },
    )
    
    if (typeof keywords.input === "string") {
        sendLog({content: `Henter tabell med ID '${keywords.input}'`, eventType: 'nav'});
        
        const tableResponse = await fetch(`${baseURL}/tables/${keywords.input}/metadata?lang=en&outputFormat=json-stat2`, {
            method: "GET",
            headers: {"Content-Type": "application/json"},
        });
        
        const tableMetadata = (await tableResponse.json()) as SSBTableMetadata;
        
        sendLog({content: `Valgt tabell '${keywords.input}' navngitt '${tableMetadata.label}'`, eventType: 'nav'});
        
        return tableMetadata;
    }
    
    const keywordParamaters = keywords.input.join(',');
    const keywordStrings = keywords.input.join(', ');
    
    sendLog({content: `Henter tabeller for søkeordene '${keywordStrings}'`, eventType: 'nav'});

    const keywordResponse = await fetch(`${baseURL}/tables?lang=en&pageSize=${numTables}&query=${keywordParamaters}`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    });
    
    const tableEntries = (await keywordResponse.json()) as SSBSearchResponse;

    sendLog({content: `Hentet ${tableEntries.tables.length} tabeller`, eventType: 'nav'});
    
    const ids = tableEntries.tables.map(entry => entry.id);

    const navigationSchema = z.object({
        id: z.enum([ids[0], ...ids.slice(1)]),
    })

    let tableEntriesPrompt = ``;

    for (const entry of tableEntries.tables) {
        tableEntriesPrompt += `\nid: "${entry.id}", label: "${entry.label}", timeUnit: "${entry.timeUnit}", firstPeriod: "${entry.firstPeriod}", lastPeriod: "${entry.lastPeriod}", variableNames: [${entry.variableNames}]`;
    }
    
    const selectedTable = await customWrapper(
        model,
        params,
        { schema: navigationSchema, systemPrompt: `${customTableSelectionPrompt}\n${tableEntriesPrompt}` },
    )
    
    const metadataResponse = await fetch(`${baseURL}/tables/${selectedTable.id}/metadata?lang=en&outputFormat=json-stat2`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    
    const tableMetadata = (await metadataResponse.json()) as SSBTableMetadata;
    
    sendLog({ content: `Valgt tabell '${tableMetadata.extension.px.tableid}' navngitt '${tableMetadata.label}'`, eventType: 'nav' });
    
    return tableMetadata;
}