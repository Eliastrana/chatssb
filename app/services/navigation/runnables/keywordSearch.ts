import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";
import {keywordSearchPrompt} from "@/app/services/navigation/keywordSearchPrompt";

export function keywordSearch(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    numKeywords: number,
): Runnable {

    const keywordSchema: Record<string, z.ZodTypeAny> = {};
    
    for (let i = 1; i <= numKeywords; i++) {
        keywordSchema[`keyword_${i}`] = z.string();
    }
    
    const keywordSearchSchema = z.object(keywordSchema);
    
    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(keywordSearchPrompt),
        ...messages,
    ]);
    
    return prompt.pipe(selectedModel.withStructuredOutput(keywordSearchSchema));
}