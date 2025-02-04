import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {systemPrompt} from "@/app/utils/navigation_runnable/systemPrompt";
import {Runnable} from "@langchain/core/runnables";

const navigationSchema = z.object({
    type: z.string().describe("The 'type' of the current entry"),
    id: z.string().describe("The 'id' of either a list or a table."),
    label: z.string().describe("The 'label' of the current item.")
});

const prompt = ChatPromptTemplate.fromMessages([new SystemMessage(systemPrompt)]);

export function navigationRunnable(selectedModel: BaseChatModel, messages: BaseMessage[]): Runnable {
    prompt.promptMessages.push(...messages);
    return prompt.pipe(selectedModel.withStructuredOutput(navigationSchema));
}
