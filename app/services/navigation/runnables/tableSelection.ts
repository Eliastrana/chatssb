import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";
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