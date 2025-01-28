// noinspection TypeScriptValidateTypes

import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { createOpenAIFnRunnable } from 'langchain/chains/openai_functions';

const systemPrompt = `
Brukeren er ute etter statistikk som relaterer til deres forespørsel.
Du skal navigere i en API-struktur for å finne 1 tabell av 8000 som passer best til brukerens ønske.

API-en består av flere hovedemner som er hver sin egen liste av lister ned til tabellnivå.
Du kan identifisere underemner ved å se på 'type' som har følgende alternativer:

- 'FolderInformation' for liste som kan inneholde flere lister, tabeller eller header
- 'Table' for tabell som inneholder data
- 'Heading' for header som er en overskrift

Du skal bare navigere i lister og tabeller.
Du skal returnere 'id' attributtet til tabellen som passer best til brukerens forespørsel sammen med 'type' og 'label' attributtene valgt.

Du skal finne neste liste eller tabell, dette er så langt du allerede har navigert og du skal ikke respondere med det samme igjen:
"Startmappe"
`;


interface TokenUsage {
    promptTokens?: number;
    completionTokens?: number;
}

interface LLMOutput {
    tokenUsage?: TokenUsage;
}

interface Output {
    llmOutput?: LLMOutput;
}

const tokenUsageLogger = {
    handleLLMEnd: async (output: Output) => {
        const inputTokenPriceUSD = 0.15 / 1_000_000;
        const outputTokenPriceUSD = 0.60 / 1_000_000;
        const usdToNokRate = 11.25;
        const tokenUsage = output.llmOutput?.tokenUsage;
        if (tokenUsage) {
            const { promptTokens = 0, completionTokens = 0 } = tokenUsage;
            const inputCostUSD = promptTokens * inputTokenPriceUSD;
            const outputCostUSD = completionTokens * outputTokenPriceUSD;
            const totalCostUSD = inputCostUSD + outputCostUSD;
            const totalCostNOK = totalCostUSD * usdToNokRate;
            console.log(`${promptTokens + completionTokens} tokens koster: ${totalCostNOK.toFixed(6)} NOK`);
        } else {
            console.log('Token usage information is not available.');
        }
    },
};

const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0,
    callbacks: [tokenUsageLogger],

});

const OpenAIFunction = {
    name: "navigate_to_best_table",
    description: "Navigate in the SSB API structure to find the best table for the user's request.",
    parameters: {
        type: "object",
        properties: {
            type: {type: "string", description: "The 'type' of the current item."},
            id: {type: "string", description: "The 'id' of either a list or a table."},
            label: {type: "string", description: "The 'label' of the current item."},
        },
        required: ["id"],
    },
};

type responseFormat = {
    type: string;
    id: string;
    label: string;
};

export async function POST(request: Request) {

    let depth = 0;
    const maxDepth = 5;
    let APIResponse = {} as JSON;
    let LLMResponse: responseFormat = { type: '', id: '', label: '' };
    let currentSystemPrompt: string = systemPrompt;

    const { message } = (await request.json()) as { message: string };
    console.log('Received message:', message + '\n');

    while (depth < maxDepth) {
        const navigationId = LLMResponse.id;

        await fetch('https://data.ssb.no/api/pxwebapi/v2-beta/navigation/' + navigationId, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch structure from SSB. Status: ${response.status}`);
                }
                APIResponse = await response.json();
            })
            .catch((err) => {
                return NextResponse.json({ error: err.message }, { status: 500 });
            });

        const prompt = ChatPromptTemplate.fromMessages([
            new SystemMessage(currentSystemPrompt),
            new SystemMessage('API response: ' + JSON.stringify(APIResponse)),
            new HumanMessage(message),
        ]);

        const runnable = createOpenAIFnRunnable({
            functions: [OpenAIFunction],
            llm: model,
            prompt,
        });

        const input = {  };
        const options = { };
        LLMResponse = await runnable.invoke(input, options) as responseFormat;

        // console.log('LLMResponse:', LLMResponse);

        console.log(LLMResponse.label +"\n")

        currentSystemPrompt += JSON.stringify(LLMResponse.label) + '\n';

        if (LLMResponse.type === 'Table') break;
        depth++;
    }

    if (depth < maxDepth) {
        return NextResponse.json({ content: LLMResponse.label }, { status: 200 });
    } else {
        return NextResponse.json({ error: 'Max depth reached, LLM could not find a table.' }, { status: 500 });
    }
}