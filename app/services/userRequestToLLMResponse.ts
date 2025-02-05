"use server";

import {ChatOpenAI} from '@langchain/openai';
import {HumanMessage} from '@langchain/core/messages';
import {PxWebData, SSBNavigationResponse, SSBTableMetadata} from "@/app/types";
import {navigationRunnable} from "@/app/utils/LLM_navigation/navigationRunnable";
import {
    metadataRunnableMultithreadedPrompts,
    multithreadedPromptSchemaToPxApiQuery
} from "@/app/utils/LLM_metadata_selection/metadataRunnable";

const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0,
});

export async function userRequestToLLMResponse(message: string): Promise<PxWebData> {
    let depth = 0;
    const maxDepth = 5;
    
    let currentLLMNavigation = {
        folderSelection: [
            {
                type: 'FolderInformation',
                id: '',
                label: 'Root'
            }
        ]
    }
    
    let nextLLMNavigation = {
        folderSelection: []
    }
    
    console.log('Received message:', message);
    
    while (depth < maxDepth) {
        const SSBResponses: SSBNavigationResponse[] = [];
        
        for (const responseItem of currentLLMNavigation.folderSelection) {
            if (responseItem.type === 'Table') break;
            
            console.log('Fetching navigation data for ID:', responseItem.id);
            
            const response = await fetch('https://data.ssb.no/api/pxwebapi/v2-beta/navigation/' + responseItem.id, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });
            
            if (!response.ok) throw new Error('Failed to fetch SSB API navigation data from ID ' + navigationId);
            
            SSBResponses.push(await response.json());
        }
        
        currentLLMNavigation = await navigationRunnable(
            model, 
            [new HumanMessage(message)], 
            SSBResponses, 
            4
        ).invoke({}, {});
        
        console.log(currentLLMNavigation);
        
        // TODO handle LLM returning folders AND tables by offloading the table selection and
        //  checking when all folders have been traversed.
        
        if (currentLLMNavigation.folderSelection[0].type === 'Table') break;
        
        depth++;
    }

    if (depth === maxDepth) {
        throw new Error('Failed to find a table in the SSB API');
    }

    const response = await fetch('https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + currentLLMNavigation.folderSelection[0].id + '/metadata?lang=no&outputFormat=json-stat2', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    })

    if (!response.ok) throw new Error('Failed to fetch SSB API table metadata');

    const tableMetadata: SSBTableMetadata = await response.json();
    let SSBGetUrl = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + currentLLMNavigation.folderSelection[0].id + '/data?lang=no&format=json-stat2';
    
    // Single prompt for metadata selection
    //const LLMMetadataResponse = await metadataRunnableSinglePrompt(model, [new
    // HumanMessage(message)], tableMetadata).invoke({}, {});
    //console.log(LLMMetadataResponse);
    //SSBGetUrl = singlePromptSchemaToPxApiQuery(LLMMetadataResponse, SSBGetUrl);
    
    // Multithreaded prompts for metadata selection
    const LLMMetadataResponse = await metadataRunnableMultithreadedPrompts(model, [new HumanMessage(message)], tableMetadata).invoke({}, {});
    console.log(JSON.stringify(LLMMetadataResponse, null, 2));
    SSBGetUrl = multithreadedPromptSchemaToPxApiQuery(LLMMetadataResponse, SSBGetUrl);
    
    console.log('SSBGetUrl:', SSBGetUrl)

    const responseTableData = await fetch(SSBGetUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    });

    if (!responseTableData.ok) throw new Error('Failed to fetch SSB API table data from table ' + currentLLMNavigation.folderSelection[0].label + ' with URL ' + SSBGetUrl);
    
    const tableData = await responseTableData.json();
    
    //console.log(tableData);    
    
    return tableData;
}