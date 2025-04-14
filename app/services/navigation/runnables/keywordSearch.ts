import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {Runnable} from "@langchain/core/runnables";

export function keywordSearch(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    numKeywords: number,
): Runnable {

    const keywordSchema = z.object({
        keywords: z
            .array(z.string())
            .describe(`En liste med ${numKeywords} nøkkelord som beskriver hovedtemaene i brukerens forespørsel. 
                Nøkkelordene skal være generelle og relevante for å finne passende tabeller i Statistisk sentralbyrås database. 
                Unngå spesifikke verdier som årstall, tall, kjønn eller andre variabler – fokuser på overordnede begreper som for eksempel "arbeidsledighet", "utdanning", "befolkning", "helse", "klima", "innvandring", osv.`)
        });
    
    const prompt = ChatPromptTemplate.fromMessages([
        ...messages,
    ]);
    
    return prompt.pipe(selectedModel.withStructuredOutput(keywordSchema));
}