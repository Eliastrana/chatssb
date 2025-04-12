import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";
import {resonateSystemMessage} from "@/app/services/resonate/resonateSystemMessage";


export function resonateRunnable(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
): Runnable {
    
    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(resonateSystemMessage),
        ...messages
    ]);
    
    return prompt.pipe(selectedModel);
}