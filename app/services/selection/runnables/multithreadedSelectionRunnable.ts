import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {metadataSystemPrompt} from "@/app/services/selection/metadataSystemPrompt";
import {RunnableMap} from "@langchain/core/runnables";
import {ServerLog, SSBTableMetadata} from '@/app/types';


export function multithreadedSelectionRunnable(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    metadataJson: SSBTableMetadata,
    sendLog: (log: ServerLog) => void,
    promptFormat: string = 'json'
): RunnableMap {
    const promptMap = Object.fromEntries(
        Object.entries(metadataJson.dimension).map(([key, value]) => {

            const schema = z.object({
                [key]: z.union([
                    z.object({
                        itemSelections: z
                            .array(z.string())
                            .describe(
                                `A list of valid item keys for the variable: ${key}. Must always be the JSON key(s) from the provided input data, not the corresponding item values.`
                            )
                    }),
                    z.object({
                        selectionExpressions: z
                            .array(z.string())
                            .describe(
                                `A list of valid selection expressions for the variable: ${key}. If an item identifier is used in the expression, it must be the JSON key from the provided input data, not the corresponding item value.`
                            )
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
            
            sendLog({ content: systemMessage, eventType: 'log' });

            const prompt = ChatPromptTemplate.fromMessages([
                new SystemMessage(metadataSystemPrompt),
                new SystemMessage(systemMessage),
                ...messages
            ]);
            
            return [key + "Prompt", prompt.pipe(selectedModel.withStructuredOutput(schema))];
        })
    );
    
    return RunnableMap.from(promptMap);
}


