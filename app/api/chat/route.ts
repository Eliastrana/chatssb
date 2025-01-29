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

const SystemPromptRequestTableData = `
Brukeren er ute etter statistikk som relaterer til deres forespørsel.
Du har mottatt metadataen til en relevant tabell og du skal nå hente ut den relevante dataen.

Du skal lage en GET-forespørsel basert på metadataen som er mest relevant for brukerens forespørsel.
`;

const SystemPromptRequestTableDataDocs = `
### Get data for a specific table
\`\`\`
HTTP GET http://my-site.com/api/v2/tables/<table-id>/data/
\`\`\`
#### Parameters
The variables of the table can be used to query a specific part of the table by using the parameters bellow. If the parameters is not given a default region of the table will be selected.

##### valueCodes
A selection specifying a region of the table that will be returned. All variables that cann´t be eliminated must have a selection specified. The selection for a varibale is given in the form:
\`\`\`
valueCodes[VARIABLE-CODE]=ITEM-SELECTION-1,ITEM-SELECTION-2,ITEM-SELECTION-3, etc
\`\`\`
Where \`VARIABLE-CODE\` is the code of the variable and \`ITEM-SELECTION-X\` is either a value code of a selection expression.
If the value code of a selection expression contains a comma is should be in brackets e.g. \`[TOP(1,12)]\` and if the value code is allready in brackets is should be in extra brackets e.g. \`[ME01]\` should be \`[[ME01]]\`.
##### codelist
You might what to use a diffrent codelist i.e. have a diffrent aggregate for a variable. I that case use can specify a codelist of one that is available for that variable. The items refered in \`valueCodes\` will then refeere to the values in the refered codelist. To codelist is specified in the form
\`\`\`
codelist[VARIABLE-CODE]=CODELIST-ID
\`\`\`
Where \`VARIABLE-CODE\` is the code of the variable and \`CODELIST-ID\` is the ID of the codelist to use.
##### outputValues
Codelists can either be used to transform the returned variable or as a mean for selecting values. E.g. If a variable as values at municipality level and a codelist a county level. You might either use the codelist to aggregated the municiplaites to countys in the result or select all municipalities by specifying counties and have the municipalities that belongs the selected counties in the result.
The \`outputValues\` paramater can be used to specify how the codelist is used and is only applicable when a codelist have been secified for a variable.
It is given in the form
\`\`\`
outputValues[VARIABLE-CODE]=aggregated|single
\`\`\`
Where \`VARIABLE-CODE\` is the code of the variable and the value could be either \`aggregated\` that is the values should be transformed to the codelist values or \`single\` the original values should be in the result. If no paramater is given \`aggregated\` will be used when specifying a codelist for a variable.

### Selection expression
Instead of specifying all valuecodes one could use a selection expression instead. Bellow follows the available expressions.
#### Wildcard expression 
A wildcard can be used to match all codes e.g. \`*01\` matches all codes that ends with \`01\`, \`*2*\` matches all codes that contains a \`2\`, \`A*\` matches all codes that starts with \`A\` and \`*\` matches all codes. Maximum of 2 waildcards can be given.

#### Exact match
A questionmark can be used to match exactly one character. E.g. \`?\` matches all codes that has exactly one character, \`?1\` matches codes that are 2 character long and ends with \`1\`.

#### TOP
The \`TOP(N, Offset)\` expression selects the \`N\` first values with an offset of \`Offset\`. E.g. \`TOP(5)\` will select the first 5 values or \`TOP(5,3)\` will select 3rd to 8th value. The \`Offset\` is by default \`0\` and must not be specified.

#### BOTTOM
\`BOTTOM\` is just as \`TOP\` but selects values from the bottom if the values list.

#### RANGE
\`RANGE(X,Y)\` selectes all values between value code \`X\` and value code \`Y\` including \`X\` and \`Y\`.

#### FROM
\`FROM(X)\` selectes all value codes from the value code that has \`X\` and bellow including \`X\`.

#### TO
TO(X) väljer alla värden från början till värdet med koden X inklusive värdet med koden X.

## Elimination
If elimination is set to true the variable can be eliminated and nothing have to be selected for this variable and the result will not contain that variable. If the variable have a value that states that it is the elimination value then that value will be selected to eliminate the variable. If no elimination value is specified the variable will be eliminated from the result by summing up all data points for the all values of that variable. If a variable has elimination set to false then at least one value bust be selected for that variable.
`;

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
    console.log('Received message:', message + '\n');

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

        console.log(LLMResponse.label +"\n")

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
    
            console.log('LLMRequestTableData:', LLMRequestTableData);
        }
        
        return NextResponse.json({ content: LLMResponse.label }, { status: 200 });
    } else {
        return NextResponse.json({ error: 'Max depth reached, LLM could not find a table.' }, { status: 500 });
    }
}