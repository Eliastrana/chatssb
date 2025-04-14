import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {ServerLog, SSBSearchResponse, SSBTableMetadata} from "@/app/types";
import {BaseMessage} from "@langchain/core/messages";
import {
    keywordNavigationRunnable
} from "@/app/services/navigation/runnables/keywordNavigationRunnable";
import {
    selectKeywordTableFromTablesRunnable
} from "@/app/services/navigation/runnables/selectKeywordTableFromTablesRunnable";


export async function keywordUserMessageToMetadata(
    model: BaseChatModel,
    messages: BaseMessage[],
    numKeywords: number,
    sendLog: (log: ServerLog) => void,
    baseURL: string,
): Promise<SSBTableMetadata> {

    const chosenKeywords: { keywords: string[] } = await keywordNavigationRunnable(
        model,
        messages,
        numKeywords,
    ).invoke({}, {});
    
    const tableResponses: SSBSearchResponse = { tables: [] };

    for (const keyword of Object.values(chosenKeywords.keywords)) {
        sendLog({ content: `Henter tabeller for søkeord '${keyword}'`, eventType: 'nav' });

        const response = await fetch(`${baseURL}/tables?query=${keyword}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        
        const keywordTableResponses = (await response.json()) as SSBSearchResponse;
        tableResponses.tables.push(...keywordTableResponses.tables);
    }
    
    tableResponses.tables = tableResponses.tables.filter((table, index, self) =>
        index === self.findIndex((t) => t.id === table.id)
    );
    
    sendLog({ content: `Hentet ${tableResponses.tables.length} tabeller`, eventType: 'nav' });
    
    const selectedTable = await selectKeywordTableFromTablesRunnable(
        model,
        messages,
        tableResponses
    ).invoke({}, {});
    
    const response = await fetch(`${baseURL}/tables/${selectedTable.id}/metadata?lang=no&outputFormat=json-stat2`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    
    const tableMetadata = (await response.json()) as SSBTableMetadata;
    
    sendLog({ content: `Valgt tabell '${tableMetadata.extension.px.tableid}' navngitt '${tableMetadata.label}'`, eventType: 'nav' });
    
    return tableMetadata;
}