import {ChatOpenAI} from '@langchain/openai';
import {HumanMessage} from '@langchain/core/messages';
import {
    BackendAPIParams,
    PromptResponse,
    PxWebData,
    ServerLog,
    SSBTableMetadata
} from "@/app/types";
import {parallellUserMessageToMetadata} from "@/app/services/navigation/parallellUserMessageToMetadata";
import {
    singlethreadedSelectionRunnable
} from "@/app/services/selection/runnables/singlethreadedSelectionRunnable";
import {
    multithreadedSelectionRunnable
} from "@/app/services/selection/runnables/multithreadedSelectionRunnable";

const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0,
});

export async function userMessageToTableData(
    params: BackendAPIParams,
    sendLog: (log: ServerLog) => void,
    config?: Record<string, unknown>,
): Promise<PxWebData> {

    const { userMessage, nav, sel, modelType } = params;

    // Navigation code
    // =================
    
    let tableMetadata: SSBTableMetadata;
    
    switch (nav) {
        case `parallell`:
            tableMetadata = await parallellUserMessageToMetadata(
                model,
                userMessage,
                config?.maxBreath ? config.maxBreath as number : 1,
                sendLog
            );
            break;
        default:
            throw new Error('Invalid navigation technique');
    }
    
    const tableId = tableMetadata.extension.px.tableid;
    
    let SSBGetUrl = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + tableId + '/data?lang=no&format=json-stat2';
    
    // Selection code
    // =================
    
    switch (sel) {
        case `singlethreaded`:
            const singlethreadedSelectedVariables = await singlethreadedSelectionRunnable(
                model, 
                [new HumanMessage(userMessage)], 
                tableMetadata,
                sendLog
            ).invoke({}, {});
            
            sendLog({ content: JSON.stringify(singlethreadedSelectedVariables, null, 2), eventType: 'log' });
            
            SSBGetUrl = singlethreadedToURL(
                singlethreadedSelectedVariables,
                SSBGetUrl,
                sendLog
            );
            
            break;
        case `multithreaded`:
            const multithreadedSelectedVariables = await multithreadedSelectionRunnable(
                model, 
                [new HumanMessage(userMessage)], 
                tableMetadata,
                sendLog
            ).invoke({}, {});
            
            sendLog({ content: JSON.stringify(multithreadedSelectedVariables, null, 2), eventType: 'log' });
            
            SSBGetUrl = multithreadedToURL(
                multithreadedSelectedVariables,
                SSBGetUrl,
                sendLog
            );
            
            break;
        default:
            throw new Error('Invalid selection technique');
    }
    
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

function singlethreadedToURL(
    response: Record<string, PromptResponse>,
    url: string,
    sendLog: (log: ServerLog) => void
): string {
    Object.entries(response).forEach(([key, value]) => {
        if (value.itemSelections) {
            // Join the selections into a comma-separated string
            const selection = value.itemSelections.join(",");
            sendLog({ content: `Selections for ${key}: ${selection}`, eventType: 'log' });
            url += `&valueCodes[${key}]=${selection}`;
        } else if (value.selectionExpressions) {
            // Process each selection expression
            value.selectionExpressions.forEach((expression: string) => {
                sendLog({ content: `Expression for ${key}: ${expression}`, eventType: 'log' });
                url += `&valueCodes[${key}]=[${expression}]`;
            });
        } else {
            // If neither itemSelections nor selectionExpressions are defined, use a wildcard
            sendLog({ content: `Wildcard * for ${key}`, eventType: 'log' });
            url += `&valueCodes[${key}]=*`;
        }
    });

    return url;
}

function multithreadedToURL(
    responses: Record<string, Record<string, PromptResponse>>,
    url: string,
    sendLog: (log: ServerLog) => void
): string {
    // Iterate over the top-level keys in the responses object
    Object.entries(responses).forEach(([, responseValue]) => {
        // Each responseValue is itself an object that we need to iterate over
        Object.entries(responseValue).forEach(([key, value]) => {
            if (value.itemSelections) {
                // Join the selections into a comma-separated string
                const selection = value.itemSelections.join(",");
                sendLog({ content: `Selections for ${key}: ${selection}`, eventType: 'log' });
                url += `&valueCodes[${key}]=${selection}`;
            } else if (value.selectionExpressions) {
                // Process each selection expression
                value.selectionExpressions.forEach((expression: string) => {
                    sendLog({ content: `Expression for ${key}: ${expression}`, eventType: 'log' });
                    url += `&valueCodes[${key}]=[${expression}]`;
                });
            } else {
                // If neither itemSelections nor selectionExpressions are defined, use a wildcard
                sendLog({ content: `Wildcard * for ${key}`, eventType: 'log' });
                url += `&valueCodes[${key}]=*`;
            }
        });
    });

    return url;
}