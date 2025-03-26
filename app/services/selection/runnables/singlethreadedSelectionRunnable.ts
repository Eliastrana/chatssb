import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {BaseMessage, SystemMessage} from "@langchain/core/messages";
import {ServerLog, SSBTableMetadata} from "@/app/types";
import {Runnable} from "@langchain/core/runnables";
import {z} from "zod";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {metadataSystemPrompt} from "@/app/services/selection/metadataSystemPrompt";


export function singlethreadedSelectionRunnable(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    metadataJson: SSBTableMetadata,
    sendLog: (log: ServerLog) => void
): Runnable {
    const variableSchema: Record<string, z.ZodTypeAny> = {};
    const variableJson: Record<string, unknown> = {};

    Object.entries(metadataJson.dimension).forEach(([key, dimension]) => {
        // Create a union schema for each key.
        const schemaForKey = z.union([
            z.object({
                itemSelection: z
                    .array(z.string())
                    .describe(
                        `A list of valid item keys for the variable: ${key}. Must always be the JSON key(s) from the provided input data, not the corresponding item values.`
                    )
            }),
            z.object({
                selectionExpression: z
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
    
    const systemMessage = JSON.stringify(variableJson);
    
    sendLog({ content: systemMessage, eventType: 'log' });

    const prompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(metadataSystemPrompt),
        new SystemMessage(systemMessage),
        ...messages
    ]);
    
    return prompt.pipe(selectedModel.withStructuredOutput(schema));
}