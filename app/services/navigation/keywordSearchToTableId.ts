import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {ServerLog, SSBEntry, SSBSearchResponse} from "@/app/types";
import {keywordSearch} from "@/app/services/navigation/runnables/keywordSearch";
import {tableSelection} from "@/app/services/navigation/runnables/tableSelection";
import {parsingRunnableRetryWrapper} from "@/app/services/parsingRunnableRetryWrapper";


export async function keywordSearchToTableId(
    model: BaseChatModel, 
    userPrompt: string, 
    numKeywords: number, 
    sendLog: (log: ServerLog) => void,
    baseURL: string = 'https://data.ssb.no/api/pxwebapi/v2-beta/'
): Promise<{ id: string }> {
    const keywords = await parsingRunnableRetryWrapper(
        model,
        userPrompt,
        keywordSearch(numKeywords),
    )

    let tableEntries: SSBEntry[] = []

    const keywordTableResponses = await Promise.all(
        keywords.keywords.map(async (keyword: string) => {
            sendLog({content: `Henter tabeller for søkeord '${keyword}'`, eventType: 'nav'});

            const response = await fetch(`${baseURL}/tables?lang=en&query=${keyword}`, {
                method: "GET",
                headers: {"Content-Type": "application/json"},
            });
            
            
            return (await response.json()) as SSBSearchResponse;
        })
    );

    tableEntries = keywordTableResponses.flatMap((response) => response.tables);

    tableEntries = tableEntries.filter((table, index, self) =>
        index === self.findIndex((t) => t.id === table.id)
    );

    sendLog({content: `Hentet ${tableEntries.length} tabeller`, eventType: 'nav'});

    const selectedTable = await parsingRunnableRetryWrapper(
        model,
        userPrompt,
        tableSelection(tableEntries),
    )
    
    return selectedTable;
}