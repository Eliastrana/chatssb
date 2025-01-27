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

// Create a ChatOpenAI model instance
const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0,
    //maxTokens: 16000,
});

// Return function to be used in the chain
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
    let APIResponse: JSON;
    let LLMResponse: responseFormat;
    let currentSystemPrompt: string = systemPrompt;

    const { message } = (await request.json()) as { message: string };
    console.log('Received message:', message);

    while (depth < maxDepth) {
        const navigationId = LLMResponse?.id || '';
        
        await fetch('https://data.ssb.no/api/pxwebapi/v2-beta/navigation/' + navigationId, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        }).then(async (response) => {
            if (!response.ok) throw new Error(`Failed to fetch structure from SSB. Status: ${response.status}`);
            APIResponse = await response.json();
            //console.log('API response:', currentResponse);
        }).catch((err) => {
            return NextResponse.json({error: err.message}, {status: 500});
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
        
        //console.log('Prompt:', prompt.toJSON());

        LLMResponse = await runnable.invoke();
        //console.log('Response:', LLMResponse);
        
        currentSystemPrompt += JSON.stringify(LLMResponse.label) + '\n';
        //console.log('Current prompt:', currentSystemPrompt);
        
        if (LLMResponse.type === 'Table') break;
        
        depth++;
    }

    if (depth < maxDepth) {
        return NextResponse.json(
            { content: LLMResponse.label }, 
            { status: 200 });
    } else return NextResponse.json(
        { error: 'Max depth reached, LLM could not find a table.' },
        { status: 500 }
    );
}
