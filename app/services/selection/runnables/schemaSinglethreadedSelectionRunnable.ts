import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {BaseMessage, SystemMessage} from "@langchain/core/messages";
import {SSBTableMetadata} from "@/app/types";
import {Runnable} from "@langchain/core/runnables";
import {z} from "zod";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {schemaMetadataSystemMessage} from "@/app/services/selection/schemaMetadataSystemMessage";


export function schemaSinglethreadedSelectionRunnable(
    selectedModel: BaseChatModel,
    messages: BaseMessage[],
    metadataJson: SSBTableMetadata,
): Runnable {
    
    const schema: Record<string, z.ZodTypeAny> = {};
    const json: Record<string, unknown> = {};

    Object.entries(metadataJson.dimension).forEach(([key, value]) => {
        schema[key] = z.union([
            z.object({
                itemSelection: z.array(z.string())
                    .describe("An array of predefined item keys for exact matching. Use only keys from the allowed set.")
            }),
            z.object({
                wildcard: z.boolean()
                    .describe("A flag indicating that a wildcard expression is used. When true, a wildcard (e.g. '*') represents selecting all options")
            }),
            z.object({
                top: z.object({
                    n: z.number().describe("The number of items to select from the beginning."),
                    offset: z.number().optional().describe("Optional offset from the start (defaults to 0 if not provided).")
                }).describe("Represents a TOP expression formatted as TOP(n, offset).")
            }),
            z.object({
                bottom: z.object({
                    n: z.number().describe("The number of items to select from the end."),
                    offset: z.number().optional().describe("Optional offset from the end (defaults to 0 if not provided).")
                }).describe("Represents a BOTTOM expression formatted as BOTTOM(n, offset).")
            }),
            z.object({
                range: z.object({
                    start: z.string().describe("The starting predefined key for a range selection."),
                    end: z.string().describe("The ending predefined key for a range selection.")
                }).describe("Represents a RANGE expression formatted as RANGE(start, end), selecting all items between start and end (inclusive).")
            }),
            z.object({
                from: z.string()
                    .describe("A predefined key that marks the beginning of a FROM expression, selecting all items from this key downward.")
            }),
            z.object({
                to: z.string()
                    .describe("A predefined key that marks the end of a TO expression, selecting all items up to and including this key.")
            })
        ])
        
        if (value.extension.elimination) {
            schema[key] = schema[key].optional();
        }

        json[key] = {
            label: value.label,
            items: value.category.label,
            unit: value.category.unit
        };
        
    });
    
    const finalSchema = z.object(schema);

    const prompt = ChatPromptTemplate.fromMessages([
        ...messages,
        new SystemMessage(schemaMetadataSystemMessage),
        new SystemMessage(JSON.stringify(json)),
    ]);
    
    return prompt.pipe(selectedModel.withStructuredOutput(finalSchema));
}