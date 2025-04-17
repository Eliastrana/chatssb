import {z} from 'zod';
import {DecoupledRunnable, SSBEntry} from "@/app/types";

import {tableSelectionPrompt} from "@/app/services/navigation/tableSelectionPrompt";

export function tableSelection(
    tableEntries: SSBEntry[],
): DecoupledRunnable {
    const navigationSchema = z.object({id: z.string()})
    
    let tableEntriesPrompt = ``;
    
    for (const entry of tableEntries) {
        tableEntriesPrompt += `\nid: "${entry.id}", label: "${entry.label}", firstPeriod: "${entry.firstPeriod}", lastPeriod: "${entry.lastPeriod}", variableNames: [${entry.variableNames}]`;
    }
    
    return { schema: navigationSchema, systemPrompt: `${tableSelectionPrompt}\n${tableEntriesPrompt}` };
}