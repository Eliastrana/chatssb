import {DecoupledRunnable, SSBTableMetadata} from "@/app/types";
import {z} from "zod";
import {customSelectionPrompt} from "@/app/custom/customSelectionPrompt";
import {buildTableDescription} from "@/app/custom/buildTableDescription";


export function valueSelection(
    tableMetadata: SSBTableMetadata,
): DecoupledRunnable {
    
    const schema: Record<string, z.ZodTypeAny> = {};

    Object.entries(tableMetadata.dimension).forEach(([key, ]) => {
        schema[key] = z.union([
            z.object({ itemSelection: z.array(z.string()).min(1) }),
            z.object({ wildcard: z.boolean() }),
            z.object({ range: z.object({ start: z.string(), end: z.string() }) }),
        ]);
    });
    
    const finalSchema = z.object(schema);

    return { schema: finalSchema, systemPrompt: `${customSelectionPrompt}\n\n${buildTableDescription(tableMetadata)}` }
}