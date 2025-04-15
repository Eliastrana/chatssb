import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";
import {SSBFolderEntry} from "@/app/types";

export function tableSelectionFromFolderNavigation(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    possibleTables: SSBFolderEntry[],
): Runnable {
    const navigationSchema = z.object({id: z.string()})
    
    let systemMessageText = "";

    const possibleTablesText = possibleTables
        .map(
            (e) =>
                `id: "${e.id}", label: ${e.label}`
        )
        .join("\n");

    systemMessageText += `\n${possibleTablesText}`;
    
    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemMessageText),
        ...messages,
    ]);
    
    return prompt.pipe(selectedModel.withStructuredOutput(navigationSchema));
}