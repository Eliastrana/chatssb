import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {ServerLog, SSBNavigationResponse, SSBTableMetadata} from "@/app/types";
import {
    parallellNavigationRunnable
} from "@/app/services/navigation/runnables/parallellNavigationRunnable";
import {HumanMessage} from "@langchain/core/messages";
import {
    selectTableFromTablesRunnable
} from "@/app/services/navigation/runnables/selectTableFromTablesRunnable";


export async function parallellUserMessageToMetadata(
    model: BaseChatModel,
    userMessage: string,
    maxBreadth: number = 1,
    sendLog: (log: ServerLog) => void
): Promise<SSBTableMetadata> {
    
    let depth = 0;
    const maxDepth = 5;
    
    let currentFolderEntries = {
        folderEntries: [
            {
                type: 'FolderInformation',
                id: '',
                label: 'Root'
            }
        ]
    }
    
    const possibleTables: { id: string, label: string }[] = []

    while (depth <= maxDepth) {
        
        sendLog({ content: `Nåværende mappedybde: ${depth}`, eventType: 'nav' });
        
        // Extract and add tables from the current folder entries.
        currentFolderEntries.folderEntries.forEach((entry) => {
            if (entry.type === 'Table') {
                possibleTables.push({ id: entry.id, label: entry.label });
                sendLog({ content: `Mulige tabeller funnet: ${entry.id} navngitt '${entry.label}'`, eventType: 'nav' });
            }
        });

        // Filter out folder entries (non-tables) for further navigation.
        const folderEntries = currentFolderEntries.folderEntries.filter(
            (entry) => entry.type !== 'Table'
        );

        // If there are no more folder entries to navigate, exit the loop.
        if (!folderEntries.some((entry) => entry.type === 'FolderInformation')) {
            sendLog({ content: `Navigering fullført`, eventType: 'nav' });
            break;
        }

        // Fetch navigation data for each folder entry.
        const nextFolderEntries: SSBNavigationResponse[] = [];
        for (const folderEntry of folderEntries) {
            sendLog({ content: `Valgt mappe: '${folderEntry.id}' navngitt '${folderEntry.label}'`, eventType: 'nav'});
            
            const response: Response = await fetch(
                'https://data.ssb.no/api/pxwebapi/v2-beta/navigation/' + folderEntry.id,
                {
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
        currentFolderEntries = await parallellNavigationRunnable(
            model,
            [new HumanMessage(userMessage)],
            nextFolderEntries,
            maxBreadth,
        ).invoke({}, {});
        
        depth++;
    }
    
    let selectedTable: { id: string };

    if (possibleTables.length === 0) {
        throw new Error('Failed to find a table in the SSB API');
    } else if (possibleTables.length > 1) {
        selectedTable = await selectTableFromTablesRunnable(
            model,
            [new HumanMessage(userMessage)],
            possibleTables
        ).invoke({}, {});
    } else {
        selectedTable = { id: possibleTables[0].id };
    }
    
    const response = await fetch('https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + selectedTable.id + '/metadata?lang=no&outputFormat=json-stat2', {
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