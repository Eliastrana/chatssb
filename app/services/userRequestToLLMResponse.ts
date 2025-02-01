"use server";

import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { createOpenAIFnRunnable } from 'langchain/chains/openai_functions';
import {PxWebData} from "@/app/types";
import {navigationRunnable} from "@/app/utils/navigation_runnable/navigationRunnable";

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

const OpenAIRequestTableDataFunction = {
    name: "filter_table",
    description: "Based on the user request, select the most relevant category based on the" +
        " available categories given. All other information like 'label' and 'unit' is just" +
        " context. You should all relevant categories, each separated by a comma with no spaces.",
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

export async function userRequestToLLMResponse(message: string): Promise<PxWebData> {
    let depth = 0;
    const maxDepth = 5;
    let LLMResponse  = { type: '', id: '', label: '' };
    let currentSystemPrompt: string = systemPromptNavigation;

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

        if (!response.ok) throw new Error('Failed to fetch SSB API navigation data');

        const SSBResponse: JSON = await response.json();
        const messages = [
            new SystemMessage("API response: " + JSON.stringify(SSBResponse)),
            new HumanMessage(message),
        ];
        
        LLMResponse = await navigationRunnable(model, messages).invoke({}, {});
        console.log(LLMResponse);

        currentSystemPrompt += JSON.stringify(LLMResponse.label) + '\n';

        if (LLMResponse.type === 'Table') break;
        depth++;
    }

    if (depth === maxDepth) {
        throw new Error('Failed to find a table in the SSB API');
    }

    const response = await fetch('https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + LLMResponse.id + '/metadata?lang=no&outputFormat=json-stat2', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    })

    if (!response.ok) throw new Error('Failed to fetch SSB API table metadata');

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

        if (!LLMRequestTableData.category.toString().includes(',')) {

            const categoryKey = Object.keys(dimension.category.label).find(key => dimension.category.label[key] === LLMRequestTableData.category) || '*';

            SSBGetUrl += `&valueCodes[${dimensionKey}]=${categoryKey}`;
            console.log('LLMRequestTableData:', categoryKey, '=>', LLMRequestTableData.category);

        } else {
            const categoryKeys = LLMRequestTableData.category.split(',');

            for (const category of categoryKeys) {
                const categoryKey = Object.keys(dimension.category.label).find(key => dimension.category.label[key] === category) || '*';
                SSBGetUrl += `&valueCodes[${dimensionKey}]=${categoryKey}`;
            }
            console.log('LLMRequestTableData:', categoryKeys, '=>', LLMRequestTableData.category);
        }
    }
    
    console.log('SSBGetUrl:', SSBGetUrl);

    const responseTableData = await fetch(SSBGetUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    });

    if (!responseTableData.ok) throw new Error('Failed to fetch SSB API table data');

    const tableData = await responseTableData.json();
    console.log('Table data:', tableData);
    
    return tableData;
}