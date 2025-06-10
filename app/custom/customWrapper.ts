import {CustomAPIParams, DecoupledRunnable} from "@/app/types";
import {HumanMessage, SystemMessage} from "@langchain/core/messages";
import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {ChatPromptTemplate} from "@langchain/core/prompts";

export async function customWrapper(model: BaseChatModel, params: CustomAPIParams, runnableParams: DecoupledRunnable | string, maxRetries: number = 1): Promise<any> {
    let attempts = 0;
    let errors: string[] =  [];
    
    let formattedChatHistory = ``
    
    const tab = '    ';
    
    for (const message of params.messageHistory) {
        if (message.sender === 'user') {
            formattedChatHistory += `Human: ${message.text}`;
        } else if (message.sender === 'bot') {
            if (message.pxData) {
                formattedChatHistory += 
                    `Bot: RETRIEVED DATA\n` +
                    `${tab}Table: ${message.pxData.label}\n` +
                    `${tab}Variables:`;
                
                for (const [key, value] of Object.entries(message.pxData.dimension)) {
                    formattedChatHistory += `\n${tab}${tab}${key}: ${value.label}`;
                    
                    let printedLabels = 0;
                    for (const [label, index] of Object.entries(value.category.label)) {
                        if (printedLabels >= 10) {
                            const remainingLabels = Object.keys(value.category.label).length - printedLabels;
                            formattedChatHistory += `\n${tab}${tab}${tab}... (${remainingLabels} more)`;
                            break;
                        }
                        formattedChatHistory += `\n${tab}${tab}${tab}${label}: ${index}`;
                        printedLabels++;
                    }
                }
            } else if (message.type === 'error') {
                formattedChatHistory += `Bot: ERROR`;
            } else {
                formattedChatHistory += `Bot: ${message.text}`;
            }
        }
        formattedChatHistory += `\n`;
    }
    
    const taskPrompt = typeof runnableParams === 'string' ? runnableParams : runnableParams.systemPrompt || '';
    
    while (attempts < maxRetries) {
        try {
            return await ChatPromptTemplate.fromMessages([
                // There can only be one system message and one human message
                new SystemMessage(`
### Metadata
Date: ${new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'long', year: 'numeric'})}

### System Prompt
You are a search engine that fetches statistics from SSB (Statistics Norway) based on user queries.
Although the user may communicate in Norwegian or other languages, you should always respond in English no matter the task or query.

### Current Task
${taskPrompt}

### Chat History
${formattedChatHistory}${errors.length > 0 ? `\n\n### Previous Errors\n${errors.join('\n')}` : ``}`),
                new HumanMessage(`${params.userMessage}${params.userMessageReflection ? `\n\n### User Message Analysis\n${params.userMessageReflection}` : ''}`),
            ]).pipe(typeof runnableParams === 'string' ? model : model.withStructuredOutput(runnableParams.schema)).invoke({});
        } catch (error) {
            attempts++;
            errors = [...errors, `Attempt ${attempts}: ${error instanceof Error ? error.message : String(error)}`];
        }
    }

    throw new Error(`Failed after ${attempts} attempts: ${errors[errors.length - 1]}`);
}
