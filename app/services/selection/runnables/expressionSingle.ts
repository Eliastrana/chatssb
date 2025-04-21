import {DecoupledRunnable, SSBTableMetadata} from "@/app/types";
import {z} from "zod";
import {expressionPrompt} from "@/app/services/selection/expressionPrompt";


export function expressionSingle(
    metadataJson: SSBTableMetadata,
): DecoupledRunnable {
    const schema: Record<string, z.ZodTypeAny> = {};

    let parametersPrompt = ``;

    Object.entries(metadataJson.dimension).forEach(([key, value]) => {
        // Create a union schema for each key.
        schema[key] = z.union([
            z.object({
                itemSelection: z
                    .array(z.string()).min(1)
            }),
            z.object({
                selectionExpression: z.string()
            })
        ]);

        if (value.extension.elimination) {
            schema[key] = schema[key].optional();
        }

        parametersPrompt += `\nvariable: "${key}", label: "${value.label}", item-key-value-pairs: ${JSON.stringify(value.category.label)}`;
        if (value.category.unit) {
            parametersPrompt += `, unit: ${JSON.stringify(value.category.unit)}`;
        }
        if (value.extension.elimination) {
            parametersPrompt += `, optional: ${value.extension.elimination}`;
        }
    });

    const finalSchema = z.object(schema);
    
    return { schema: finalSchema, systemPrompt: `${expressionPrompt}\n${parametersPrompt}` }
}