import {DecoupledRunnable} from "@/app/types";
import {HumanMessage, SystemMessage} from "@langchain/core/messages";
import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {ChatPromptTemplate} from "@langchain/core/prompts";

export async function parsingRunnableRetryWrapper(model: BaseChatModel, userPrompt: string, decoupledRunnable: DecoupledRunnable, maxRetries: number = 5) {
    let attempts = 0;
    let lastError: string = "";
    
    while (attempts < maxRetries) {
        try {
            return await ChatPromptTemplate.fromMessages([
                new SystemMessage(decoupledRunnable.systemPrompt + lastError),
                new HumanMessage(userPrompt),
            ]).pipe(model.withStructuredOutput(decoupledRunnable.schema)).invoke({});
        } catch (error) {
            lastError += `\n${error}`;
            attempts++;
        }
    }

    throw new Error(`Failed after ${attempts} attempts: ${lastError}`);
}