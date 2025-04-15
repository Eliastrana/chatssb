import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";
import {SSBEntry} from "@/app/types";

import {
    tableSelectionPrompt
} from "@/app/services/navigation/tableSelectionPrompt";

export function tableSelection(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    tableEntries: SSBEntry[],
): Runnable {
    const navigationSchema = z.object({id: z.string()})
    
    let tableEntriesPrompt = ``;
    
    for (const entry of tableEntries) {
        tableEntriesPrompt += `\nid: "${entry.id}", label: "${entry.label}", firstPeriod: "${entry.firstPeriod}", lastPeriod: "${entry.lastPeriod}", variableNames: [${entry.variableNames}]`;
    }
    
    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(`${tableSelectionPrompt}\n${tableEntriesPrompt}`),
        ...messages,
    ]);
    
    return prompt.pipe(selectedModel.withStructuredOutput(navigationSchema));
}