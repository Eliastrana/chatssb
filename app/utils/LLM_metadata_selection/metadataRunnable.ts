import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {metadataSystemPrompt} from "@/app/utils/LLM_metadata_selection/metadataSystemPrompt";
import {Runnable, RunnableMap} from "@langchain/core/runnables";
import {ServerLog, SSBTableMetadata} from '@/app/types';

export function metadataRunnableSinglePrompt(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    metadataJson: SSBTableMetadata
): Runnable {
    const variableSchema: Record<string, z.ZodTypeAny> = {};
    const variableJson: Record<string, unknown> = {};

    Object.entries(metadataJson.dimension).forEach(([key, dimension]) => {
        // Create a union schema for each key.
        const schemaForKey = z.union([
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
        ]);

        // Apply optionality based on the elimination flag.
        variableSchema[key] = dimension.extension.elimination ? schemaForKey : schemaForKey.optional();

        // Build the JSON used for the prompt.
        variableJson[key] = {
            label: dimension.label,
            items: dimension.category.label,
            unit: dimension.category.unit
        };
    });

    const schema = z
        .object(variableSchema)
        .describe("Item selection / selection expression for each variable in the table");

    const variablePromptString = JSON.stringify(variableJson);

    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(metadataSystemPrompt),
        new SystemMessage(variablePromptString),
        ...messages
    ]);

    console.log('Prompt:', prompt);
    console.log('-----------------------NEXT-VARIABLE----------------------');

    return prompt.pipe(selectedModel.withStructuredOutput(schema));
}

export function metadataRunnableMultithreadedPrompts(
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

export interface PromptResponse {
    itemSelections?: string[];
    selectionExpressions?: string[];
}

export function multithreadedPromptSchemaToPxApiQuery(
    responses: Record<string, Record<string, PromptResponse>>,
    url: string,
    sendLog: (log: ServerLog) => void
): string {
    // Iterate over the top-level keys in the responses object
    Object.entries(responses).forEach(([, responseValue]) => {
        // Each responseValue is itself an object that we need to iterate over
        Object.entries(responseValue).forEach(([key, value]) => {
            if (value.itemSelections) {
                // Join the selections into a comma-separated string
                const selection = value.itemSelections.join(",");
                sendLog({ content: `Selections for ${key}: ${selection}`, eventType: 'log' });
                url += `&valueCodes[${key}]=${selection}`;
            } else if (value.selectionExpressions) {
                // Process each selection expression
                value.selectionExpressions.forEach((expression: string) => {
                    sendLog({ content: `Expression for ${key}: ${expression}`, eventType: 'log' });
                    url += `&valueCodes[${key}]=[${expression}]`;
                });
            } else {
                // If neither itemSelections nor selectionExpressions are defined, use a wildcard
                sendLog({ content: `Wildcard * for ${key}`, eventType: 'log' });
                url += `&valueCodes[${key}]=*`;
            }
        });
    });

    return url;
}

