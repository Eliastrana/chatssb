import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";
import {SSBNavigationResponse} from "@/app/types";
import {folderNavigationPrompt} from "@/app/services/navigation/folderNavigationPrompt";

/**
 * Creates a runnable that lets the LLM navigate one step deeper into the folder structure or
 *
 * @param selectedModel The selected LLM instance to use.
 * @param messages Both the user and system messages to include in the prompt.
 * @param folderEntriesList The avialble folders or tables to navigate.
 * @param maxBreadth The maximum number of folders or tables the LLM can select.
 */
export function folderNavigation(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    folderEntriesList: SSBNavigationResponse[],
    maxBreadth: number,
): Runnable {
    const entrySchema: Record<string, z.ZodTypeAny> = {};
    
    for (let i = 1; i <= maxBreadth; i++) {
        entrySchema[`entry_${i}`] = z.object({
            type: z.string(),
            id: z.string(),
            label: z.string(),
        });
    }
    
    const folderNavigationSchema = z.object(entrySchema)

    let entriesPrompt = ``;
    
    for (const folderEntries of folderEntriesList) {
        for (const entry of folderEntries.folderContents) {
            if (entry.type !== 'Table' && entry.type !== 'FolderInformation') continue;
            entriesPrompt += `\ntype: "${entry.type}", id: "${entry.id}", label: "${entry.label}"`;
        }
    }
    
    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(`${folderNavigationPrompt}\n${entriesPrompt}`),
        ...messages,
    ]);
    
    return prompt.pipe(selectedModel.withStructuredOutput(folderNavigationSchema));
}