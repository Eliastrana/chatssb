"use server";

import {ChatOpenAI} from '@langchain/openai';
import {HumanMessage, SystemMessage} from '@langchain/core/messages';
import {PxWebData, SSBTableMetadata} from "@/app/types";
import {navigationRunnable} from "@/app/utils/LLM_navigation/navigationRunnable";
import {metadataRunnable} from "@/app/utils/LLM_metadata_selection/metadataRunnable";

const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0,
});

export async function userRequestToLLMResponse(message: string): Promise<PxWebData> {
    let depth = 0;
    const maxDepth = 5;
    let LLMNavigationResponse  = { type: '', id: '', label: '' };

    console.log('Received message:', message);

    while (depth < maxDepth) {
        const navigationId = LLMNavigationResponse.id;

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
        
        LLMNavigationResponse = await navigationRunnable(model, messages).invoke({}, {});
        console.log(LLMNavigationResponse);
        
        if (LLMNavigationResponse.type === 'Table') break;
        depth++;
    }

    if (depth === maxDepth) {
        throw new Error('Failed to find a table in the SSB API');
    }

    const response = await fetch('https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + LLMNavigationResponse.id + '/metadata?lang=no&outputFormat=json-stat2', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    })

    if (!response.ok) throw new Error('Failed to fetch SSB API table metadata');

    const tableMetadata: SSBTableMetadata = await response.json();
    let SSBGetUrl = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + LLMNavigationResponse.id + '/data?lang=no&format=json-stat2';
    
    const LLMMetadataResponse = await metadataRunnable(model, [new HumanMessage(message)], tableMetadata).invoke({}, {});
    console.log(LLMMetadataResponse);
    
    
    // For each key-value pair in LLMMetadataResponse, add to SSBGetUrl
    // TODO create optional workflow to let LLM answer one by one
    for (const key in LLMMetadataResponse) {

        if (LLMMetadataResponse[key].itemSelections) {
            let selection = '';
            for (const item of LLMMetadataResponse[key].itemSelections) {
                selection += item + ',';
            }
            selection = selection.slice(0, -1);
            console.log(key, 'Item Selection:', selection);
            SSBGetUrl += '&valueCodes[' + key + ']=' + selection;
        }

        if (LLMMetadataResponse[key].selectionExpressions) {
            for (const expression of LLMMetadataResponse[key].selectionExpressions) {
                console.log(key, 'Selection Expression:', expression);
                SSBGetUrl += '&valueCodes[' + key + ']=[' + expression + ']';
            }
        }

        if (!LLMMetadataResponse[key].itemSelections && !LLMMetadataResponse[key].selectionExpressions) {
            console.log(key, 'No Selections or Expressions');
            SSBGetUrl += '&valueCodes[' + key + ']=*';
        }
    }
    
    console.log('SSBGetUrl:', SSBGetUrl);

    const responseTableData = await fetch(SSBGetUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    });

    if (!responseTableData.ok) throw new Error('Failed to fetch SSB API table data from table ' + LLMNavigationResponse.label + ' with URL ' + SSBGetUrl);

    const tableData = await responseTableData.json();
    
    //console.log(tableData);    
    
    return tableData;
}