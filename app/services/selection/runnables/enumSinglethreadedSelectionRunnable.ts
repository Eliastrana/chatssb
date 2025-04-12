import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {BaseMessage, SystemMessage} from "@langchain/core/messages";
import {SSBTableMetadata} from "@/app/types";
import {Runnable} from "@langchain/core/runnables";
import {z} from "zod";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {
    completeMetadataSystemMessage
} from "@/app/services/selection/completeMetadataSystemMessage";


export function enumSinglethreadedSelectionRunnable(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    metadataJson: SSBTableMetadata,
): Runnable {
    const schema: Record<string, z.ZodTypeAny> = {};
    const json: Record<string, unknown> = {};

    Object.entries(metadataJson.dimension).forEach(([key, value]) => {

        const allKeys = Object.keys(value.category.label);

        schema[key] = z.union([
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

        // Build the JSON used for the prompt.
        json[key] = {
            label: value.label,
            items: value.category.label,
            unit: value.category.unit
        };
    });
    
    const finalSchema = z.object(schema);
    
    const systemMessage = JSON.stringify(json);
    
    const prompt = ChatPromptTemplate.fromMessages([
        ...messages,
        new SystemMessage(completeMetadataSystemMessage),
        new SystemMessage(systemMessage),
    ]);

    return prompt.pipe(selectedModel.withStructuredOutput(finalSchema));
}