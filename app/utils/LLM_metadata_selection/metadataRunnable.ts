import {z} from 'zod';
import {ChatPromptTemplate} from '@langchain/core/prompts';
import {BaseMessage, SystemMessage} from '@langchain/core/messages';
import {BaseChatModel} from '@langchain/core/language_models/chat_models';
import {metadataSystemPrompt} from "@/app/utils/LLM_metadata_selection/metadataSystemPrompt";
import {Runnable} from "@langchain/core/runnables";
import {SSBTableMetadata} from '@/app/types';



export function metadataRunnable(selectedModel: BaseChatModel, messages: BaseMessage[], metadataJson: SSBTableMetadata): Runnable {
    const prompt = ChatPromptTemplate.fromMessages([new SystemMessage(metadataSystemPrompt)]);

    const variableSchema: Record<string, z.ZodTypeAny> = {};

    Object.entries(metadataJson.dimension).forEach(([key, value]) => {
        variableSchema[key] = z
            .object({
                itemSelections: z
                    .array(z.string())
                    .describe(
                        `A list of valid item keys for the variable: ${key}. Must always be the JSON key(s) from the provided input data, not the corresponding item values.`
                    )
            }).or(z
                .object({
                    selectionExpressions: z
                        .array(z.string())
                        .describe(
                            `A list of valid selection expressions for the variable: ${key}. If an item identifier is used in the expression, it must be the JSON key from the provided input data, not the corresponding item value.`
                        )
                })
            );
        
        if (!metadataJson.dimension[key].extension.elimination) {
            // Make the object above optional
            variableSchema[key] = variableSchema[key].optional();
        }
    });
    
    const schema = z.object(variableSchema)
        .describe("Item selection / selection expression for each variable in the table");
    
    let variableJson = {};

    for (const variableKey in metadataJson.dimension) {
        const variable = metadataJson.dimension[variableKey];

        //const itemLabels = Object.values(variable.category.label);

        variableJson[variableKey] = {
            label: variable.label,
            items: variable.category.label,
            unit: variable.category.unit,
        };
    }
    
    const dimensionPromptString = JSON.stringify(variableJson);
    
    prompt.promptMessages.push(new SystemMessage(dimensionPromptString));
    prompt.promptMessages.push(...messages);
    
    prompt.promptMessages.values().forEach((message) => {
        console.log(message);
    });
    
    return prompt.pipe(selectedModel.withStructuredOutput(schema));
}
