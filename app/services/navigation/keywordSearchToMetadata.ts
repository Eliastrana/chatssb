import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {ServerLog, SSBEntry, SSBSearchResponse, SSBTableMetadata} from "@/app/types";
import {keywordSearch} from "@/app/services/navigation/runnables/keywordSearch";
import {tableSelection} from "@/app/services/navigation/runnables/tableSelection";
import {parsingRunnableRetryWrapper} from "@/app/services/parsingRunnableRetryWrapper";


export async function keywordSearchToMetadata(
    model: BaseChatModel,
    userPrompt: string,
    numKeywords: number,
    sendLog: (log: ServerLog) => void,
    baseURL: string,
): Promise<SSBTableMetadata> {

    const keywords = await parsingRunnableRetryWrapper(
        model,
        userPrompt,
        keywordSearch(numKeywords),
    )
    
    let tableEntries: SSBEntry[] = []

    for (const keyword of keywords.keywords) {
        sendLog({ content: `Henter tabeller for søkeord '${keyword}'`, eventType: 'nav' });

        const response = await fetch(`${baseURL}/tables?lang=en&query=${keyword}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        
        const keywordTableResponses = (await response.json()) as SSBSearchResponse;
        tableEntries.push(...keywordTableResponses.tables);
    }

    tableEntries = tableEntries.filter((table, index, self) =>
        index === self.findIndex((t) => t.id === table.id)
    );
    
    sendLog({ content: `Hentet ${tableEntries.length} tabeller`, eventType: 'nav' });
    
    const selectedTable = await parsingRunnableRetryWrapper(
        model,
        userPrompt,
        tableSelection(tableEntries),
    )
    
    const response = await fetch(`${baseURL}/tables/${selectedTable.id}/metadata?lang=en&outputFormat=json-stat2`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    
    const tableMetadata = (await response.json()) as SSBTableMetadata;
    
    sendLog({ content: `Valgt tabell '${tableMetadata.extension.px.tableid}' navngitt '${tableMetadata.label}'`, eventType: 'nav' });
    
    return tableMetadata;
}