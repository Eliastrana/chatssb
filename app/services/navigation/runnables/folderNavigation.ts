import {z} from 'zod';
import {DecoupledRunnable, SSBNavigationResponse} from "@/app/types";
import {folderNavigationPrompt} from "@/app/services/navigation/folderNavigationPrompt";

export function folderNavigation(
    folderEntriesList: SSBNavigationResponse[],
    maxBreadth: number,
): DecoupledRunnable {
    
    const ids = folderEntriesList.map(folderEntries => folderEntries.folderContents.map(entry => `${entry.type}:${entry.id}`)).flat();
    
    // Smallest of maxBreadth and the number of entries
    const options = Math.min(maxBreadth, ids.length);
    
    const folderNavigationSchema = z.object({
        folderContents: z.array(
            z.object({
                typeAndId: z.enum([ids[0], ...ids.slice(1)]),
                label: z.string(),
            }))
            .min(1)
            .max(options)
    });
    
    let entriesPrompt = ``;

    for (const folderEntries of folderEntriesList) {
        for (const entry of folderEntries.folderContents) {
            if (entry.type === 'Table') {
                entriesPrompt += `\ntype: "${entry.type}", id: "${entry.id}", label: "${entry.label}", firstPeriod: "${entry.firstPeriod}", lastPeriod: "${entry.lastPeriod}"`;
            } else if (entry.type === 'FolderInformation') {
                entriesPrompt += `\ntype: "${entry.type}", id: "${entry.id}", label: "${entry.label}"`;
            }
        }
    }
    
    const maxBreathPrompt = `You must select ${options} entry(ies).`;
    
    return { schema: folderNavigationSchema, systemPrompt: `${folderNavigationPrompt}\n${maxBreathPrompt}\n${entriesPrompt}` };
}