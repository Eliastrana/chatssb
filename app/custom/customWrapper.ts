import {CustomAPIParams} from "@/app/types";
import {HumanMessage, SystemMessage} from "@langchain/core/messages";
import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {ZodTypeAny} from "zod";


export async function customWrapper(model: BaseChatModel, params: CustomAPIParams, taskPrompt: string, schema?: ZodTypeAny, maxRetries: number = 2): Promise<unknown> {
    let attempts = 0;
    let errors: string[] =  [];
    
    let formattedChatHistory = ``
    
    const tab = '    ';
    
    for (const message of params.messageHistory) {
        if (message.sender === 'user') {
            formattedChatHistory += message.forceTableId ? `Human: USER CLICKED TABLE\n${tab}${message.text}` : `Human: ${message.text}`;
        } else if (message.sender === 'bot') {
            if (message.pxData) {
                formattedChatHistory += 
                    `Bot: RETRIEVED DATA\n` +
                    `${tab}Table: ${message.pxData.label}\n` +
                    `${tab}Variables:`;
                
                for (const [key, value] of Object.entries(message.pxData.dimension)) {
                    formattedChatHistory += `\n${tab}${tab}${key}: ${value.label}`;

                    const labels = Object.entries(value.category.label);
                    const totalLabels = labels.length;
                    
                    if (value.totalValues) formattedChatHistory += ` (${totalLabels}/${value.totalValues} available values selected)`;
                    else formattedChatHistory += ` (OMITTED)`;
                    
                    if (totalLabels > 10) {
                        for (let i = 0; i < 5; i++) {
                            const [label, index] = labels[i];
                            formattedChatHistory += `\n${tab}${tab}${tab}${label}: ${index}`;
                            
                            if (value.category.unit && value.category.unit[label]) {
                                formattedChatHistory += ` (${value.category.unit[label].base}, decimals: ${value.category.unit[label].decimals})`;
                            }
                        }
                        const remainingLabels = totalLabels - 10;
                        formattedChatHistory += `\n${tab}${tab}${tab}...(${remainingLabels} more)...`;
                        for (let i = totalLabels - 5; i < totalLabels; i++) {
                            const [label, index] = labels[i];
                            formattedChatHistory += `\n${tab}${tab}${tab}${label}: ${index}`;
                            if (value.category.unit && value.category.unit[label]) {
                                formattedChatHistory += ` (${value.category.unit[label].base}, decimals: ${value.category.unit[label].decimals})`;
                            }
                        }
                    } else {
                        for (let i = 0; i < totalLabels; i++) {
                            const [label, index] = labels[i];
                            formattedChatHistory += `\n${tab}${tab}${tab}${label}: ${index}`;
                            
                            if (value.category.unit && value.category.unit[label]) {
                                formattedChatHistory += ` (${value.category.unit[label].base}, decimals: ${value.category.unit[label].decimals})`;
                            }
                        }
                    }
                }
            } else if (message.possibleTables) {
                formattedChatHistory += `Bot: POSSIBLE TABLES`
                for (const table of message.possibleTables) {
                    formattedChatHistory += `\n${tab}${table.label}`
                }
            } else if (message.type === 'error') {
                formattedChatHistory += `Bot: ERROR`;
            } else {
                formattedChatHistory += `Bot: ${message.text}`;
            }
        }
        formattedChatHistory += `\n`;
    }
    
    const humanMessageText = params.userMessage.forceTableId ? `USER CLICKED TABLE\n${tab}${params.userMessage.text}` : params.userMessage.text;
    
    const humanMessage = new HumanMessage(`${humanMessageText}${params.userMessageReflection ? `\n\n### User Message Analysis\n${params.userMessageReflection}` : ''}`);
    
    while (attempts < maxRetries) {
        try {
            const systemMessage = new SystemMessage(`
### Metadata
Date: ${new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'long', year: 'numeric'})}

### System Prompt
You are acting as an intelligent search agent for SSB (Statistics Norway). Your job is to translate user requests into precise data-retrieval actions against SSB’s tables.
Although the user may communicate in Norwegian or other languages, you should always respond in English no matter the task or query.

### Current Task
${taskPrompt}

### Chat History
${formattedChatHistory}
${errors.length > 0 ? `\n### Previous Errors\n${errors.join('\n')}` : ``}`)
            
            return await ChatPromptTemplate.fromMessages([
                systemMessage,
                humanMessage,
            ]).pipe(schema ? model.withStructuredOutput(schema) : model).invoke({});
        } catch (error) {
            attempts++;
            errors = [...errors, `Attempt ${attempts}: ${error instanceof Error ? error.message : String(error)}`];
        }
    }

    throw new Error(`Failed after ${attempts} attempts: ${errors[errors.length - 1]}`);
}

