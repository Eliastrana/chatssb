import {SSBSearchResponse} from "@/app/types";
import {Runnable} from "@langchain/core/runnables";
import {BaseMessage, SystemMessage} from "@langchain/core/messages";
import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {z} from "zod";
import {ChatPromptTemplate} from "@langchain/core/prompts";


export function tableSelectionFromKeywordSearch(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    possibleTables: SSBSearchResponse,
): Runnable {
    const tableIDSchema = z.object({
        id: z.string().describe("The unique identifier of the folder or table entry."),
    }).describe("The most relevant table that matches the user's request.");

    let systemMessageText = "";
    
    for (const table of possibleTables.tables) {
        systemMessageText += `ID: ${table.id}, Label: ${table.label}, FirstPeriod: ${table.firstPeriod}, LastPeriod: ${table.lastPeriod}, Variables: [${table.variableNames}]\n`;
    }

    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemMessageText),
        ...messages,
    ]);

    return prompt.pipe(selectedModel.withStructuredOutput(tableIDSchema));
}
