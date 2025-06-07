import {DecoupledRunnable, SSBTableMetadata} from "@/app/types";
import {z} from "zod";
import {customDimensionPrompt} from "@/app/custom/customDimensionPrompt";

export function dimensionSelection(
            tableMetadata: SSBTableMetadata,
        ): DecoupledRunnable {
        
            const schema: Record<string, z.ZodTypeAny> = {};
            
            let prompt = ``;
        
            Object.entries(tableMetadata.dimension).forEach(([key, value]) => {
                prompt += `\nvariable: "${key}", label: "${value.label}"`;
                
                const options: string[] = [];
                
                if (value.extension.codeLists.length > 0) {
                    prompt += `, codeLists: {`;
                    for (const codeList of value.extension.codeLists.values()) {
                        options.push(codeList.id);
                        prompt += `"${codeList.id}":"${codeList.label}",`;
                    }
                    prompt = prompt.slice(0, -1) + `}`;
                }
                
                if (value.extension.elimination) {
                    if (options.length == 0) {
                        options.push("INCLUDED");
                    }
                    options.push("OMITTED");
                    
                    prompt += `, optional: true`;
                }
                
                if (options.length == 0) {
                    prompt += `, optional: false`;
                    return;
                }
                
                schema[key] = z.enum(options as [string, ...string[]]);
            });
        
            const finalSchema = z.object(schema);
        
            return { schema: finalSchema, systemPrompt: `${customDimensionPrompt}\n${prompt}` };
        }