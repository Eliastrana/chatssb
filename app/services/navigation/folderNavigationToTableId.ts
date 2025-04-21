import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {ServerLog, SSBEntry, SSBNavigationResponse} from "@/app/types";
import {folderNavigation} from "@/app/services/navigation/runnables/folderNavigation";
import {tableSelection} from "@/app/services/navigation/runnables/tableSelection";
import {parsingRunnableRetryWrapper} from "@/app/services/parsingRunnableRetryWrapper";


export async function folderNavigationToTableId(
    model: BaseChatModel, 
    userPrompt: string, 
    maxBreadth: number, 
    sendLog: (log: ServerLog) => void,
    baseURL: string = 'https://data.ssb.no/api/pxwebapi/v2-beta/'
): Promise<{ id: string }> {
    
    let depth = 0;
    const maxDepth = 5;
    
    const initialEntry = { type: 'FolderInformation', id: '', label: 'Root' };
    let responseEntries: SSBNavigationResponse = { folderContents: [initialEntry] };
    const tableEntries: SSBEntry[] = [];

    const fetchOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    };

    while (depth <= maxDepth) {
        // Make list distinct by id
        responseEntries.folderContents = responseEntries.folderContents.filter((entry, index, self) =>
            index === self.findIndex((e) => e.id === entry.id)
        );
        
        sendLog({content: `Nåværende mappedybde: ${depth}`, eventType: 'nav'});

        // Collect and log table entries.
        responseEntries.folderContents.forEach(entry => {
            if (entry.type === "Table") {
                tableEntries.push(entry);
                sendLog({ content: `Muilig tabell: ${entry.id} som heter '${entry.label}'`, eventType: "nav" });
            }
        });

        // Filter folder entries and exit if none are left.
        const folderEntries = responseEntries.folderContents.filter(entry => entry.type !== "Table");
        if (folderEntries.length === 0) {
            sendLog({ content: "Navigasjon fullført", eventType: "nav" });
            break;
        }

        // Fetch and process navigation data for each folder.
        const nextFolderEntries = await Promise.all(folderEntries.map(async folderEntry => {
            sendLog({ content: `Valgt mappe: '${folderEntry.id}' navngitt '${folderEntry.label}'`, eventType: "nav" });

            const response = await fetch(`${baseURL}navigation/${folderEntry.id}?lang=en`, fetchOptions);
            if (!response.ok) {
                throw new Error(`Failed to fetch navigation data from folder ID ${folderEntry.id}`);
            }
            return (await response.json()) as SSBNavigationResponse;
        }));

        // Process navigation data using the retry wrapper.
        const tempEntries = await parsingRunnableRetryWrapper(
            model,
            userPrompt,
            folderNavigation(nextFolderEntries, maxBreadth)
        );

        
        responseEntries = { folderContents: [] };
        
        // Add processed entries to folder contents.
        for (const entry of tempEntries.folderContents) {
            const [type, id] = entry.typeAndId.split(":");
            responseEntries.folderContents.push({
                id,
                label: entry.label,
                type: type as "Table" | "FolderInformation",
            } as SSBEntry);
        }

        depth++;
    }
    
    if (tableEntries.length === 0) {
        throw new Error('Failed to find a table in the SSB API');
    }
    
    if (tableEntries.length > 1) {
        // Fetch the variable names for each table entry.
        for (const tableEntry of tableEntries) {
            const response = await fetch(`${baseURL}tables/${tableEntry.id}?lang=en`, {
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

        return await parsingRunnableRetryWrapper(
            model,
            userPrompt,
            tableSelection(tableEntries)
        )
    }

    return { id: tableEntries[0].id };
}