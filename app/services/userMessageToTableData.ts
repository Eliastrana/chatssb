"use server";

import {ChatOpenAI} from '@langchain/openai';
import {HumanMessage} from '@langchain/core/messages';
import {PxWebData, ServerLog, SSBTableMetadata} from "@/app/types";
import {
    metadataRunnableMultithreadedPrompts,
    multithreadedPromptSchemaToPxApiQuery
} from "@/app/services/selection/runnables/metadataRunnable";
import {parallellUserMessageToMetadata} from "@/app/services/navigation/parallellUserMessageToMetadata";

const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0,
});

export async function userMessageToTableData(
    userMessage: string,
    sendLog: (log: ServerLog) => void
): Promise<PxWebData> {
    

    const tableMetadata: SSBTableMetadata = await parallellUserMessageToMetadata(
        model,
        userMessage,
        2,
        sendLog
    )
    
    const tableId = tableMetadata.extension.px.tableid;
    
    let SSBGetUrl = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + tableId + '/data?lang=no&format=json-stat2';
    
    // Single prompt for metadata selection
    //const LLMMetadataResponse = await metadataRunnableSinglePrompt(model, [new
    // HumanMessage(message)], tableMetadata).invoke({}, {});
    //console.log(LLMMetadataResponse);
    //SSBGetUrl = singlePromptSchemaToPxApiQuery(LLMMetadataResponse, SSBGetUrl);
    
    // Multithreaded prompts for metadata selection
    const LLMMetadataResponse = await metadataRunnableMultithreadedPrompts(
        model, 
        [new HumanMessage(userMessage)], 
        tableMetadata,
        sendLog
    ).invoke({}, {});
    
    sendLog({ content: JSON.stringify(LLMMetadataResponse, null, 2), eventType: 'log' });
    
    SSBGetUrl = multithreadedPromptSchemaToPxApiQuery(
        LLMMetadataResponse,
        SSBGetUrl,
        sendLog
    );
    
    sendLog({ content: SSBGetUrl, eventType: 'log' });

    const responseTableData = await fetch(SSBGetUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        }
    });

    if (!responseTableData.ok) throw new Error('Failed to fetch SSB API table data from table ' + tableId + ' with URL ' + SSBGetUrl);
    
    return await responseTableData.json() as PxWebData;
}