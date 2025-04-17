import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";
import {reasoningPrompt} from "@/app/services/reasoning/reasoningPrompt";
import {BaseMessage, HumanMessage, SystemMessage} from "@langchain/core/messages";
import {ChatPromptTemplate} from "@langchain/core/prompts";


export function reasoning(
    selectedModel: BaseChatModel,
    userPrompt: string,
): Runnable {
    
    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(reasoningPrompt),
        new HumanMessage(userPrompt),
    ]);

    return prompt.pipe(selectedModel);
}