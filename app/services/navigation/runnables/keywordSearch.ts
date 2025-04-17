import {z} from 'zod';
import {keywordSearchPrompt} from "@/app/services/navigation/keywordSearchPrompt";
import {DecoupledRunnable} from "@/app/types";

export function keywordSearch(
    numKeywords: number,
): DecoupledRunnable {

    const keywordSearchSchema = z.object({
            keywords: z.array(z.string()).max(numKeywords),
        }
    );

    const maxBreathPrompt = `You must select ${numKeywords} keyword(s).`;

    return { schema: keywordSearchSchema, systemPrompt: `${keywordSearchPrompt}\n${maxBreathPrompt}` };
}