import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";
import {SSBNavigationResponse} from "@/app/types";

/**
 * Creates a runnable that lets the LLM navigate one step deeper into the folder structure or
 *
 * @param selectedModel The selected LLM instance to use.
 * @param messages Both the user and system messages to include in the prompt.
 * @param folderEntries The avialble folders or tables to navigate.
 * @param maxBreadth The maximum number of folders or tables the LLM can select.
 */
export function parallellNavigationRunnable(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    folderEntries: SSBNavigationResponse[],
    maxBreadth: number = 1,
): Runnable {
    
    const navigationSchema = z
        .object({
            folderEntries: z.array(z
                .object({
                    type: z
                        .string()
                        .describe("The entry type (e.g., 'FolderInformation' or 'Table')."),
                    id: z
                        .string()
                        .describe("The unique identifier of the folder or table entry."),
                    label: z
                        .string()
                        .describe("The display label for this navigation entry."),
                })) // .max(maxBreadth) is not utilized as the LLM may return more entries
                // anyways and breaking the schema validation is not desired. Instead, just
                // select the first `maxBreadth` entries.
            .describe(
                "An array of maximum " + maxBreadth + " entries representing the selected" +
                " folders or tables that match the user's request. The entries are ordered from" +
                " most to least relevant."
            )
        });
    
    let systemMessageText = "Folder contents:";
    
    for (const folderEntry of folderEntries) {
        const entries = folderEntry.folderContents.map((entry) => ({
            type: entry.type,
            id: entry.id,
            label: entry.label,
        }));

        const navigationEntriesText = entries
            .map(
                (e) =>
                    `Type: ${e.type}, ID: ${e.id}, Label: ${e.label}`
            )
            .join("\n");

        systemMessageText += `\n${navigationEntriesText}`;
    }
    
    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemMessageText)
    ]);

    prompt.promptMessages.push(...messages);

    return prompt.pipe(selectedModel.withStructuredOutput(navigationSchema));
}