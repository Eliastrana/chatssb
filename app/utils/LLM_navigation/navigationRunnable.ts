import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";
import {SSBNavigationResponse} from "@/app/types";

// Improved schema with updated descriptions:
const navigationSchema = z
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
    })
    .describe(
        "A navigation entry representing a folder or table that best matches the user's request."
    );

// Updated runnable that extracts folderContents entries and injects them into the prompt:
export function navigationRunnable(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    folderStructure: SSBNavigationResponse
): Runnable {
    // Assume folderStructure.folderContents is an array of objects with type, id, and label properties
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

    const systemMessageText = `Folder Contents:\n${navigationEntriesText}`;
    
    console.log(systemMessageText, "\n");

    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemMessageText)
    ]);

    prompt.promptMessages.push(...messages);

    return prompt.pipe(selectedModel.withStructuredOutput(navigationSchema));
}

