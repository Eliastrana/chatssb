import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {metadataSystemPrompt} from "@/app/utils/LLM_metadata_selection/metadataSystemPrompt";
import {Runnable, RunnableMap} from "@langchain/core/runnables";
import {SSBTableMetadata} from '@/app/types';

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
    metadataJson: SSBTableMetadata
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
            
            const variableJson = {
                [key]: {
                    label: value.label,
                    items: value.category.label,
                    unit: value.category.unit
                }
            };
            
            console.log(JSON.stringify(variableJson) + '\n');

            const prompt = ChatPromptTemplate.fromMessages([
                new SystemMessage(metadataSystemPrompt),
                new SystemMessage(JSON.stringify(variableJson)),
                ...messages
            ]);
            
            //console.log('-----------------------NEXT-VARIABLE----------------------');
            //prompt.promptMessages.values().forEach((message) => {
            //    console.log(message);
            //});

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
    url: string
): string {
    // Iterate over the top-level keys in the responses object
    Object.entries(responses).forEach(([, responseValue]) => {
        // Each responseValue is itself an object that we need to iterate over
        Object.entries(responseValue).forEach(([key, value]) => {
            console.log(value, key);

            if (value.itemSelections) {
                // Join the selections into a comma-separated string
                const selection = value.itemSelections.join(",");
                console.log(key, 'Item Selection:', selection);
                url += `&valueCodes[${key}]=${selection}`;
            } else if (value.selectionExpressions) {
                // Process each selection expression
                value.selectionExpressions.forEach((expression: string) => {
                    console.log(key, 'Selection Expression:', expression);
                    url += `&valueCodes[${key}]=[${expression}]`;
                });
            } else {
                console.log(key, 'No Selections or Expressions');
                url += `&valueCodes[${key}]=*`;
            }
        });
    });

    return url;
}

