import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {
    completeMetadataSystemMessage
} from "@/app/services/selection/completeMetadataSystemMessage";
import {RunnableMap} from "@langchain/core/runnables";
import {SSBTableMetadata} from '@/app/types';


export function enumMultithreadedSelectionRunnable(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    metadataJson: SSBTableMetadata,
    promptFormat: string = 'json'
): RunnableMap {
    const promptMap = Object.fromEntries(
        Object.entries(metadataJson.dimension).map(([key, value]) => {
            
            // Get all keys from the category
            const allKeys = Object.keys(value.category.label);
            
            const schema = z.object({
                [key]: z.union([
                    z.object({
                        itemSelection: z
                            .array(z.enum([allKeys[0], ...allKeys.slice(1)]))
                    }),
                    z.object({
                        wildcard: z.string(),
                    }),
                    z.object({
                        exactMatch: z.string(),
                    }),
                    z.object({
                        top: z
                            .object({
                                n: z.number(),
                                offset: z.number().optional()
                            })
                    }),
                    z.object({
                        bottom: z
                            .object({
                                n: z.number(),
                                offset: z.number().optional()
                            })
                    }),
                    z.object({
                        range: z
                            .object({
                                start: z.enum([allKeys[0], ...allKeys.slice(1)]),
                                end: z.enum([allKeys[0], ...allKeys.slice(1)])
                            })
                    }),
                    z.object({
                        from: z.enum([allKeys[0], ...allKeys.slice(1)])
                    }),
                    z.object({
                        to: z.enum([allKeys[0], ...allKeys.slice(1)])
                    })
                ])
            });
            
            let systemMessage = '';
            
            if (promptFormat === 'json') {
                systemMessage = JSON.stringify({
                    [key]: {
                        label: value.label,
                        items: value.category.label,
                        unit: value.category.unit
                    }
                });
            } else {
                systemMessage = `VARIABLE-CODE: ${key}, LABEL: ${value.label}\n\n`;
                systemMessage += `'Item-key': 'Item-value' (unit?)\n\n`;
                Object.entries(value.category.label).forEach(([itemKey, itemValue]) => {
                    systemMessage += `'${itemKey}': '${itemValue}'`
                    if (value.category.unit?.[itemKey]) {
                        systemMessage += ` (${value.category.unit[itemKey].base})`;
                    }
                    systemMessage += '\n';
                });
            }
            
            const prompt = ChatPromptTemplate.fromMessages([
                ...messages,
                new SystemMessage(completeMetadataSystemMessage),
                new SystemMessage(systemMessage),
            ]);
            
            return [key, prompt.pipe(selectedModel.withStructuredOutput(schema))];
        })
    );
    
    return RunnableMap.from(promptMap);
}


