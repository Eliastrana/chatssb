import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {ServerLog, SSBTableMetadata} from "@/app/types";
import {keywordSearchToTableId} from "@/app/services/navigation/keywordSearchToTableId";

export async function keywordSearchToMetadata(
    model: BaseChatModel,
    userPrompt: string,
    numKeywords: number,
    sendLog: (log: ServerLog) => void,
    baseURL: string = 'https://data.ssb.no/api/pxwebapi/v2-beta/'
): Promise<SSBTableMetadata> {
    const selectedTable = await keywordSearchToTableId(model, userPrompt, numKeywords, sendLog, baseURL);

    const response = await fetch(`${baseURL}/tables/${selectedTable.id}/metadata?lang=en&outputFormat=json-stat2`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    
    const tableMetadata = (await response.json()) as SSBTableMetadata;
    
    sendLog({ content: `Valgt tabell '${tableMetadata.extension.px.tableid}' navngitt '${tableMetadata.label}'`, eventType: 'nav' });
    
    return tableMetadata;
}