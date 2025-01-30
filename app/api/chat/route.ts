// noinspection TypeScriptValidateTypes

import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { createOpenAIFnRunnable } from 'langchain/chains/openai_functions';

const systemPromptNavigation = `
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

const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0,
});

const OpenAINavigationFunction = {
    name: "navigate_to_best_table",
    description: "Navigate in the SSB API structure to find the best table for the user's request.",
    parameters: {
        type: "object",
        properties: {
            type: {type: "string", description: "The 'type' of the current item."},
            id: {type: "string", description: "The 'id' of either a list or a table."},
            label: {type: "string", description: "The 'label' of the current item."},
        },
        required: ["id", "type", "label"],
    },
};

type OpenAINavigationFunctionType = {
    type: string;
    id: string;
    label: string;
};

const OpenAIRequestTableDataFunction = {
    name: "filter_table",
    description: "Based on the user request, select the most relevant category based on the" +
        " available categories given. All other information like 'label' and 'unit' is just" +
        " context. You should only return the most relevant available category.",
    parameters: {
        type: "object",
        description: "The category that corresponds best to the user's request.",
        properties: {
            category: {
                type: "string",
                description: "The category that corresponds best to the user's request."
            }
        },
        required: ["category"],
    },
};

type SSBTableMetadata = {
    label: string;
    note: string[];
    dimension: Record<string, {
        label: string;
        category: {
            label: Record<string, string>;
            unit?: Record<string, { base: string; decimals: number; }>;
        };
        extension: { elimination: boolean; };
    }>;
}

export async function POST(request: Request) {

    let depth = 0;
    const maxDepth = 5;
    let LLMResponse: OpenAINavigationFunctionType = { type: '', id: '', label: '' };
    let currentSystemPrompt: string = systemPromptNavigation;

    const { message } = (await request.json()) as { message: string };
    console.log('Received message:', message);

    while (depth < maxDepth) {
        const navigationId = LLMResponse.id;

        const response = await fetch('https://data.ssb.no/api/pxwebapi/v2-beta/navigation/' + navigationId, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        })
        
        if (!response.ok) return NextResponse.json({ error: response.statusText }, { status: response.status });

        const SSBResponse: JSON = await response.json();

        const prompt = ChatPromptTemplate.fromMessages([
            new SystemMessage(currentSystemPrompt),
            new SystemMessage('API response: ' + JSON.stringify(SSBResponse)),
            new HumanMessage(message),
        ]);

        const runnable = createOpenAIFnRunnable({
            functions: [OpenAINavigationFunction],
            llm: model,
            prompt,
        });

        LLMResponse = await runnable.invoke({}, {}) as OpenAINavigationFunctionType;

        // console.log('LLMResponse:', LLMResponse);

        console.log(LLMResponse.label)

        currentSystemPrompt += JSON.stringify(LLMResponse.label) + '\n';

        if (LLMResponse.type === 'Table') break;
        depth++;
    }
    
    if (depth < maxDepth) {
        const response = await fetch('https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + LLMResponse.id + '/metadata?lang=no&outputFormat=json-stat2', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        })
        
        const tableMetadata: SSBTableMetadata = await response.json();
        let SSBGetUrl = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + LLMResponse.id + '/data?lang=no&format=json-stat2';
        
        for (const dimensionKey in tableMetadata.dimension) {
            const dimension = tableMetadata.dimension[dimensionKey];
            
            const categoryLabels = Object.values(dimension.category.label);
            
            const dimensionPrompt = JSON.stringify({
                label: dimension.label,
                category: categoryLabels,
                unit: dimension.category.unit,
                elimination: dimension.extension.elimination,
            });
            
            console.log('Dimension:', dimensionPrompt);
            
            const prompt = ChatPromptTemplate.fromMessages([
                new SystemMessage(dimensionPrompt),
                new HumanMessage(message),
            ]);
            
            const runnable = createOpenAIFnRunnable({
                functions: [OpenAIRequestTableDataFunction],
                llm: model,
                prompt,
                enforceSingleFunctionUsage: true,
            });
    
            const LLMRequestTableData = await runnable.invoke({}, {})
            const categoryKey = Object.keys(dimension.category.label).find(key => dimension.category.label[key] === LLMRequestTableData.category) || '*';
            
            SSBGetUrl += `&valueCodes[${dimensionKey}]=${categoryKey}`;
            
            console.log('LLMRequestTableData:', categoryKey, '=>', LLMRequestTableData.category);
        }
        
        console.log('SSBGetUrl:', SSBGetUrl);
        
        const responseTableData = await fetch(SSBGetUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        const tableData = await responseTableData.json();

        // return NextResponse.json({ content: JSON.stringify(tableData.value) }, { status: 200 });
        // return NextResponse.json({ content:(tableData.value) }, { status: 200 });

        console.log('Table data:', tableData);
        return NextResponse.json(tableData, { status: 200 });

    } else {
        return NextResponse.json({ content: 'Å nei! Vi fant ikke en relevant tabell for deg.' }, { status: 200 });
    }
}