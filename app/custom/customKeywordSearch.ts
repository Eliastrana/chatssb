import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {ServerLog, SSBSearchResponse, SSBTableMetadata} from "@/app/types";
import {parsingRunnableRetryWrapper} from "@/app/services/parsingRunnableRetryWrapper";
import {keywordSearch} from "@/app/services/navigation/runnables/keywordSearch";
import {tableSelection} from "@/app/services/navigation/runnables/tableSelection";

export async function customKeywordSearch(
    model: BaseChatModel,
    userPrompt: string,
    numKeywords: number,
    numTables: number,
    sendLog: (log: ServerLog) => void,
    baseURL: string = 'https://data.ssb.no/api/pxwebapi/v2-beta/'
): Promise<SSBTableMetadata> {

    const keywords = await parsingRunnableRetryWrapper(
        model,
        userPrompt,
        keywordSearch(numKeywords),
    )
    
    const keywordParamaters = keywords.keywords.join(',');
    const keywordStrings = keywords.keywords.join(', ');
    
    sendLog({content: `Henter tabeller for søkeordene '${keywordStrings}'`, eventType: 'nav'});

    const keywordResponse = await fetch(`${baseURL}/tables?lang=en&query=${keywordParamaters}&pageSize=${numTables}`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    });
    
    const tableEntries = (await keywordResponse.json()) as SSBSearchResponse;

    sendLog({content: `Hentet ${tableEntries.tables.length} tabeller`, eventType: 'nav'});

    const selectedTable = await parsingRunnableRetryWrapper(
        model,
        userPrompt,
        tableSelection(tableEntries.tables),
    )
    
    const metadataResponse = await fetch(`${baseURL}/tables/${selectedTable.id}/metadata?lang=en&outputFormat=json-stat2`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    
    const tableMetadata = (await metadataResponse.json()) as SSBTableMetadata;
    
    sendLog({ content: `Valgt tabell '${tableMetadata.extension.px.tableid}' navngitt '${tableMetadata.label}'`, eventType: 'nav' });
    
    return tableMetadata;
}