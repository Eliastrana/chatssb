import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";
import {SSBNavigationResponse} from "@/app/types";


export function navigationRunnable(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    folderStructures: SSBNavigationResponse[],
    maxBreadth: number = 1
): Runnable {
    const navigationSchema = z
        .object({
            folderSelection: z.array(z
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
    
    let systemMessageText = "Folder contents:\n";
    for (const folderStructure of folderStructures) {
        const entries = folderStructure.folderContents.map((entry) => ({
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
        
    console.log(systemMessageText, "\n");

    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemMessageText)
    ]);

    prompt.promptMessages.push(...messages);

    return prompt.pipe(selectedModel.withStructuredOutput(navigationSchema));
}

