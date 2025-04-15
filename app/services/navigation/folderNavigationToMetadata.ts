import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {ServerLog, SSBEntry, SSBNavigationResponse, SSBTableMetadata} from "@/app/types";
import {folderNavigation} from "@/app/services/navigation/runnables/folderNavigation";
import {BaseMessage} from "@langchain/core/messages";
import {
    tableSelectionFromFolderNavigation
} from "@/app/services/navigation/runnables/tableSelectionFromFolderNavigation";


export async function folderNavigationToMetadata(
    model: BaseChatModel,
    messages: BaseMessage[],
    maxBreadth: number = 1,
    sendLog: (log: ServerLog) => void,
    baseURL: string = 'https://data.ssb.no/api/pxwebapi/v2-beta/'
): Promise<SSBTableMetadata> {
    
    let depth = 0;
    const maxDepth = 5;

    let currentEntries: Record<string, SSBEntry> = {
        entry_1: { type: 'FolderInformation', id: '', label: 'Root' },
    };

    const tableEntries: SSBEntry[] = [];

    while (depth <= maxDepth) {
        sendLog({ content: `Nåværende mappedybde: ${depth}`, eventType: 'nav' });

        // Add tables from current entries to tableEntries.
        for (const entry of Object.values(currentEntries)) {
            if (entry.type === 'Table') {
                tableEntries.push(entry);
                sendLog({ content: `Mulige tabeller funnet: ${entry.id} navngitt '${entry.label}'`, eventType: 'nav' });
            }
        }

        // Get folder entries for further navigation.
        const folderEntries = Object.values(currentEntries).filter(entry => entry.type !== 'Table');

        // Exit loop if no folders are left to navigate.
        if (!folderEntries.some(entry => entry.type === 'FolderInformation')) {
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

        // Invoke the navigation runnable with the fetched folder entries.
        currentEntries = await folderNavigation(
            model,
            messages,
            nextFolderEntries,
            maxBreadth,
        ).invoke({});
        
        depth++;
    }
    
    let selectedTable: { id: string };

    if (tableEntries.length === 0) {
        throw new Error('Failed to find a table in the SSB API');
    } else if (tableEntries.length > 1) {
        
        // Fetch the variable names for each table entry.
        for (let entry of tableEntries) {
            const response = await fetch(`${baseURL}tables/${entry.id}?lang=en`,{
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch SSB API table data from ID ' + entry.id);
            }

            const jsonResponse = await response.json() as SSBEntry;
            entry.firstPeriod = jsonResponse.firstPeriod;
            entry.lastPeriod = jsonResponse.lastPeriod;
            entry.variableNames = jsonResponse.variableNames;
        }
        
        selectedTable = await tableSelectionFromFolderNavigation(
            model,
            messages,
            tableEntries
        ).invoke({});
    } else {
        selectedTable = { id: tableEntries[0].id };
    }
    
    const response = await fetch(`${baseURL}tables/${selectedTable.id}/metadata?lang=no&outputFormat=json-stat2`, {
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