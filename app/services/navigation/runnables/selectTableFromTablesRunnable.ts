import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";

export function selectTableFromTablesRunnable(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    possibleTables: { id: string, label: string }[],
): Runnable {
    const navigationSchema = z
        .object({
                    id: z
                        .string()
                        .describe("The unique identifier of the folder or table entry."),
                })
            .describe(
                "The most relevant table that matches the user's request."
            );
    
    let systemMessageText = "Possible tables:\n";

    const possibleTablesText = possibleTables
        .map(
            (e) =>
                `ID: ${e.id}, Label: ${e.label}`
        )
        .join("\n");

    systemMessageText += `\n${possibleTablesText}`;
    
    const prompt = ChatPromptTemplate.fromMessages([
        ...messages,
        new SystemMessage(systemMessageText)
    ]);
    
    return prompt.pipe(selectedModel.withStructuredOutput(navigationSchema));
}