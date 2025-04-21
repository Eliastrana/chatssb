import {DecoupledRunnable, SSBTableMetadata} from "@/app/types";
import {z} from "zod";
import {redundantPrompt} from "@/app/services/selection/redundantPrompt";


export function redundantSingle(
    metadataJson: SSBTableMetadata,
): DecoupledRunnable {
    
    const schema: Record<string, z.ZodTypeAny> = {};
    
    let parametersPrompt = ``; 

    Object.entries(metadataJson.dimension).forEach(([key, value]) => {
        schema[key] = z.union([
            z.object({ itemSelection: z.array(z.string()) }),
            z.object({ wildcard: z.boolean() }),
            z.object({ top: z.object({ n: z.number(), offset: z.number().optional() }) }),
            z.object({ bottom: z.object({ n: z.number(), offset: z.number().optional() }) }),
            z.object({ range: z.object({ start: z.string(), end: z.string() }) }),
            z.object({ from: z.string() }),
            z.object({ to: z.string() })
        ]);
        
        if (value.extension.elimination) {
            schema[key] = schema[key].optional();
        }

        parametersPrompt += `\nvariable: "${key}", label: "${value.label}", item-key-value-pairs: ${JSON.stringify(value.category.label)}`;
        if (value.category.unit) {
            parametersPrompt += `, unit: ${JSON.stringify(value.category.unit)}`;
        }
    });
    
    const finalSchema = z.object(schema);

    return { schema: finalSchema, systemPrompt: `${redundantPrompt}\n${parametersPrompt}` }
}