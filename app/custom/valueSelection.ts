import {DecoupledRunnable, SSBTableMetadata} from "@/app/types";
import {z} from "zod";
import {customSelectionPrompt} from "@/app/custom/customSelectionPrompt";


export function valueSelection(
    tableMetadata: SSBTableMetadata,
): DecoupledRunnable {
    
    const schema: Record<string, z.ZodTypeAny> = {};
    
    let parametersPrompt = `Variables:`; 
    const tab = '    ';

    Object.entries(tableMetadata.dimension).forEach(([key, value]) => {
        schema[key] = z.union([
            z.object({ itemSelection: z.array(z.string()).min(1) }),
            z.object({ wildcard: z.boolean() }),
            z.object({ range: z.object({ start: z.string(), end: z.string() }) }),
        ]);
        
        parametersPrompt += `\n${tab}${key}: ${value.label}`
        
        for (const [itemKey, itemLabel] of Object.entries(value.category.label)) {
            parametersPrompt += `\n${tab}${tab}${itemKey}: ${itemLabel}`;
            
            // Add unit if it exists
            if (value.category.unit && value.category.unit[itemKey]) {
                parametersPrompt += ` (${value.category.unit[itemKey].base}, decimals: ${value.category.unit[itemKey].decimals})`;
            }
        }
    });
    
    const finalSchema = z.object(schema);

    return { schema: finalSchema, systemPrompt: `${customSelectionPrompt}\n${parametersPrompt}` }
}