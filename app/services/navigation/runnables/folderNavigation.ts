import {z} from 'zod';
import {DecoupledRunnable, SSBNavigationResponse} from "@/app/types";
import {folderNavigationPrompt} from "@/app/services/navigation/folderNavigationPrompt";

export function folderNavigation(
    folderEntriesList: SSBNavigationResponse[],
    maxBreadth: number,
): DecoupledRunnable {
    const folderNavigationSchema = z.object({
        folderContents: z.array(
            z.object({
                type: z.enum(['Table', 'FolderInformation']),
                id: z.string(),
                label: z.string(),
            })
        ).max(maxBreadth)
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
    
    const maxBreathPrompt = `You must select ${maxBreadth} entry(ies).`;
    
    return { schema: folderNavigationSchema, systemPrompt: `${folderNavigationPrompt}\n${maxBreathPrompt}\n${entriesPrompt}` };
}