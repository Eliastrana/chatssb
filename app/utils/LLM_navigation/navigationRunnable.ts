import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";

const navigationSchema = z.object({
    type: z.string().describe("The 'type' of the current entry, either 'FolderInformation' or 'Table'."),
    id: z.string().describe("The 'id' of either the current folder or table."),
    label: z.string().describe("The 'label' of the current entry."),
}).describe("The entries that the most closely match the user's request.");

export function navigationRunnable(selectedModel: BaseChatModel, messages: BaseMessage[]): Runnable {
    const prompt = ChatPromptTemplate.fromMessages([
        //new SystemMessage(systemPrompt)
    ]);
    
    prompt.promptMessages.push(...messages);
    return prompt.pipe(selectedModel.withStructuredOutput(navigationSchema));
}
