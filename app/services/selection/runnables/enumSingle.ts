import {DecoupledRunnable, SSBTableMetadata} from "@/app/types";
import {z} from "zod";
import {expressionPrompt} from "@/app/services/selection/expressionPrompt";


export function enumSingle(
    metadataJson: SSBTableMetadata,
): DecoupledRunnable {
    const schema: Record<string, z.ZodTypeAny> = {};

    let parametersPrompt = ``;

    Object.entries(metadataJson.dimension).forEach(([key, value]) => {

        const allKeys = Object.keys(value.category.label);

        schema[key] = z.union([
            z.object({ itemSelection: z.array(z.enum([allKeys[0], ...allKeys.slice(1)])).min(1) }),
            z.object({ wildcard: z.boolean() }),
            z.object({ top: z.object({ n: z.number(), offset: z.number().optional() }) }),
            z.object({ bottom: z.object({ n: z.number(), offset: z.number().optional() }) }),
            z.object({ range: z.object({ start: z.enum([allKeys[0], ...allKeys.slice(1)]), end: z.enum([allKeys[0], ...allKeys.slice(1)]) }) }),
            z.object({ from: z.enum([allKeys[0], ...allKeys.slice(1)]) }),
            z.object({ to: z.enum([allKeys[0], ...allKeys.slice(1)]) })
        ])

        parametersPrompt += `\nvariable: "${key}", label: "${value.label}", item-key-value-pairs: ${JSON.stringify(value.category.label)}`;
        if (value.category.unit) {
            parametersPrompt += `, unit: ${JSON.stringify(value.category.unit)}`;
        }
        if (value.extension.elimination) {
            parametersPrompt += `, optional: ${value.extension.elimination}`;
        }
    });
    
    const finalSchema = z.object(schema);

    return { schema: finalSchema, systemPrompt: `${expressionPrompt}\\n${parametersPrompt}` }
}