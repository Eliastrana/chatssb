import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";
import {SSBEntry} from "@/app/types";
import {
    tableSelectionFromKeywordSearch
} from "@/app/services/navigation/runnables/tableSelectionFromKeywordSearch";
import {
    tableSelectionFromFolderNavigationPrompt
} from "@/app/services/navigation/tableSelectionFromFolderNavigationPrompt";

export function tableSelectionFromFolderNavigation(
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
        new SystemMessage(`${tableSelectionFromFolderNavigationPrompt}\n${tableEntriesPrompt}`),
        ...messages,
    ]);
    
    return prompt.pipe(selectedModel.withStructuredOutput(navigationSchema));
}