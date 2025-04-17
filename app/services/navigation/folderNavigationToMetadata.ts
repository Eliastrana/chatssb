import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {ServerLog, SSBEntry, SSBNavigationResponse, SSBTableMetadata} from "@/app/types";
import {folderNavigation} from "@/app/services/navigation/runnables/folderNavigation";
import {tableSelection} from "@/app/services/navigation/runnables/tableSelection";
import {parsingRunnableRetryWrapper} from "@/app/services/parsingRunnableRetryWrapper";


export async function folderNavigationToMetadata(
    model: BaseChatModel,
    userPrompt: string,
    maxBreadth: number = 1,
    sendLog: (log: ServerLog) => void,
    baseURL: string = 'https://data.ssb.no/api/pxwebapi/v2-beta/'
): Promise<SSBTableMetadata> {
    
    let depth = 0;
    const maxDepth = 5;

    let currentEntries: SSBNavigationResponse = {
        folderContents: [{ type: 'FolderInformation', id: '', label: 'Root' }],
    };

    const tableEntries: SSBEntry[] = [];

    while (depth <= maxDepth) {
        sendLog({ content: `Nåværende mappedybde: ${depth}`, eventType: 'nav' });

        // For each element in the folder contents array.
        for (const entry of currentEntries.folderContents) {
            if (entry.type === 'Table') {
                tableEntries.push(entry);
                sendLog({ content: `Mulige tabeller funnet: ${entry.id} navngitt '${entry.label}'`, eventType: 'nav' });
            }
        }

        // Remove table entries from current entries.
        const folderEntries = currentEntries.folderContents.filter(entry => entry.type !== 'Table');

        // Exit loop if no folders are left to navigate.
        if (folderEntries.length === 0) {
            sendLog({ content: `Navigering fullført`, eventType: 'nav' });
            break;
        }

        // Fetch navigation data for each folder entry.
        const nextFolderEntries: SSBNavigationResponse[] = [];
        for (const folderEntry of folderEntries) {
            sendLog({ content: `Valgt mappe: '${folderEntry.id}' navngitt '${folderEntry.label}'`, eventType: 'nav'});

            const response: Response = await fetch(`${baseURL}navigation/${folderEntry.id}?lang=en`,{
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch SSB API navigation data from ID ' + folderEntry.id);
            }

            nextFolderEntries.push(await response.json() as SSBNavigationResponse);
        }
        
        currentEntries = await parsingRunnableRetryWrapper(
            model,
            userPrompt,
            folderNavigation(nextFolderEntries, maxBreadth),
        ) as SSBNavigationResponse;
        
        depth++;
    }
    
    let selectedTable: { id: string };

    if (tableEntries.length === 0) {
        throw new Error('Failed to find a table in the SSB API');
    } else if (tableEntries.length > 1) {
        
        // Fetch the variable names for each table entry.
        for (const tableEntry of tableEntries) {
            const response = await fetch(`${baseURL}tables/${tableEntry.id}?lang=en`,{
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch SSB API table data from ID ' + tableEntry.id);
            }

            const jsonResponse = await response.json() as SSBEntry;
            tableEntry.firstPeriod = jsonResponse.firstPeriod;
            tableEntry.lastPeriod = jsonResponse.lastPeriod;
            tableEntry.variableNames = jsonResponse.variableNames;
        }
        
        selectedTable = await parsingRunnableRetryWrapper(
            model,
            userPrompt,
            tableSelection(tableEntries)
        )
    } else {
        selectedTable = { id: tableEntries[0].id };
    }
    
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