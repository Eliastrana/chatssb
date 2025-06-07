import {DecoupledRunnable, SSBTableMetadata} from "@/app/types";
import {z} from "zod";
import {customSelectionPrompt} from "@/app/custom/customSelectionPrompt";


export function valueSelection(
    tableMetadata: SSBTableMetadata,
): DecoupledRunnable {
    
    const schema: Record<string, z.ZodTypeAny> = {};
    
    let parametersPrompt = ``; 

    Object.entries(tableMetadata.dimension).forEach(([key, value]) => {
        schema[key] = z.union([
            z.object({ itemSelection: z.array(z.string()).min(1) }),
            z.object({ wildcard: z.boolean() }),
            z.object({ range: z.object({ start: z.string(), end: z.string() }) }),
        ]);
        
        parametersPrompt += `\nvariable: "${key}", label: "${value.label}", item-key-value-pairs: ${JSON.stringify(value.category.label)}`;
        if (value.category.unit) {
            parametersPrompt += `, unit: ${JSON.stringify(value.category.unit)}`;
        }
    });
    
    const finalSchema = z.object(schema);

    return { schema: finalSchema, systemPrompt: `${customSelectionPrompt}\n${parametersPrompt}` }
}