import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {ServerLog, SSBTableMetadata} from "@/app/types";
import {folderNavigationToTableId} from "@/app/services/navigation/folderNavigationToTableId";

export async function folderNavigationToMetadata(
    model: BaseChatModel,
    userPrompt: string,
    maxBreadth: number = 1,
    sendLog: (log: ServerLog) => void,
    baseURL: string = 'https://data.ssb.no/api/pxwebapi/v2-beta/'
): Promise<SSBTableMetadata> {
    const selectedTable = await folderNavigationToTableId(
        model,
        userPrompt,
        maxBreadth,
        sendLog,
        baseURL
    );

    const response = await fetch(`${baseURL}tables/${selectedTable.id}/metadata?lang=en&outputFormat=json-stat2`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    })
    
    if (!response.ok) throw new Error('Failed to fetch SSB API metadata from table ' + selectedTable.id);
    
    const tableMetadata = await response.json() as SSBTableMetadata;
    
    sendLog({ content: `Valgt tabell '${tableMetadata.extension.px.tableid}' navngitt '${tableMetadata.label}'`, eventType: 'nav' });
    
    return tableMetadata;
}