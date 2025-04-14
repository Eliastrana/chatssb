import {HumanMessage, SystemMessage} from '@langchain/core/messages';

import {
    BackendAPIParams,
    NavType,
    PxWebData,
    SelType,
    ServerLog,
    SSBTableMetadata
} from "@/app/types";
import {
    parallellUserMessageToMetadata
} from "@/app/services/navigation/parallellUserMessageToMetadata";
import {
    singlethreadedSelectionRunnable
} from "@/app/services/selection/runnables/singlethreadedSelectionRunnable";
import {
    multithreadedSelectionRunnable
} from "@/app/services/selection/runnables/multithreadedSelectionRunnable";
import {
    enumMultithreadedSelectionRunnable
} from "@/app/services/selection/runnables/enumMultithreadedSelectionRunnable";
import {
    enumSinglethreadedSelectionRunnable
} from "@/app/services/selection/runnables/enumSinglethreadedSelectionRunnable";
import {
    enumSinglethreadedRunnableToURL
} from "@/app/services/selection/utils/enumSinglethreadedRunnableToURL";
import {
    enumMultithreadedRunnableToURL
} from "@/app/services/selection/utils/enumMultithreadedRunnableToURL";
import {
    expressionSinglethreadedToURL
} from "@/app/services/selection/utils/expressionSinglethreadedToURL";
import {
    expressionMultithreadedToURL
} from "@/app/services/selection/utils/expressionMultithreadedToURL";
import {
    schemaSinglethreadedSelectionRunnable
} from "@/app/services/selection/runnables/schemaSinglethreadedSelectionRunnable";
import {
    secureSchemaSinglethreadedRunnableToURL
} from "@/app/services/selection/utils/secureSchemaSinglethreadedRunnableToURL";
import {resonateRunnable} from "@/app/services/resonate/runnable/resonateRunnable";
import {initializeModel} from "@/app/services/initializeModel";
import {keywordUserMessageToMetadata} from "@/app/services/navigation/keywordUserMessageToMetadata";


export async function userMessageToTableData(
    params: BackendAPIParams,
    sendLog: (log: ServerLog) => void,
): Promise<PxWebData> {
    
    const baseURL = params.useQAURL 
        ? 'https://data.qa.ssb.no/api/pxwebapi/v2-beta/' 
        : 'https://data.ssb.no/api/pxwebapi/v2-beta/';
    
    const messages = [
        new HumanMessage(params.userMessage),
        new SystemMessage(`Dato: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`),
        //new HumanMessage(params.userMessage + `\nDato: ${new
        // Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`),
    ]
    
    if (params.resonate) {
        sendLog({content: 'Resonnerer...', eventType: 'nav'})
        
        const resonatedContext = await resonateRunnable(
            initializeModel(params.resonateModel, sendLog),
            messages
        ).invoke({}, {});
        
        sendLog({content: resonatedContext.content, eventType: 'log'})
        messages.push(new SystemMessage(resonatedContext.content));
    }
    
    let tableMetadata: SSBTableMetadata;
    const navigationModel = initializeModel(params.navigationModel, sendLog);

    switch (params.navigationTechnique) {
        case NavType.Parallell_1:
        case NavType.Parallell_2:
        case NavType.Parallell_3:
        case NavType.Parallell_4:
        case NavType.Parallell_5:
                tableMetadata = await parallellUserMessageToMetadata(
                navigationModel,
                messages,
                parseInt(params.navigationTechnique.slice(-1)),
                sendLog,
                baseURL
            );
            break;
        case NavType.Keyword_1:
        case NavType.Keyword_2:
        case NavType.Keyword_3:
        case NavType.Keyword_4:
        case NavType.Keyword_5:
            tableMetadata = await keywordUserMessageToMetadata(
                navigationModel,
                messages,
                parseInt(params.navigationTechnique.slice(-1)),
                sendLog,
                baseURL
            );
            break;
        default:
            throw new Error('Invalid navigation technique');
    }

    const tableId = tableMetadata.extension.px.tableid;
    let SSBGetUrl = baseURL + 'tables/' + tableId + '/data?lang=no&format=json-stat2';
    
    const selectionModel = initializeModel(params.selectionModel, sendLog);
    
    switch (params.selectionTechnique) {
        case SelType.Singlethreaded:
            const singlethreadedSelectedVariables = await singlethreadedSelectionRunnable(
                selectionModel,
                messages,
                tableMetadata
            ).invoke({}, {});
            
            SSBGetUrl = expressionSinglethreadedToURL(
                singlethreadedSelectedVariables,
                SSBGetUrl
            );
            break;
        case SelType.Multithreaded:
            const multithreadedSelectedVariables = await multithreadedSelectionRunnable(
                selectionModel,
                messages,
                tableMetadata,
            ).invoke({}, {});
            
            SSBGetUrl = expressionMultithreadedToURL(
                multithreadedSelectedVariables,
                SSBGetUrl,
            );
            break;
        case SelType.EnumSinglethreaded:
            const enumSinglethreadedSelectedVariables = await enumSinglethreadedSelectionRunnable(
                selectionModel,
                messages,
                tableMetadata,
            ).invoke({}, {});
            
            SSBGetUrl = enumSinglethreadedRunnableToURL(
                enumSinglethreadedSelectedVariables,
                SSBGetUrl,
            )
            break;
        case SelType.EnumMultithreaded:
            const enumMultithreadedSelectedVariables = await enumMultithreadedSelectionRunnable(
                selectionModel,
                messages,
                tableMetadata,
            ).invoke({}, {});
            
            SSBGetUrl = enumMultithreadedRunnableToURL(
                enumMultithreadedSelectedVariables,
                SSBGetUrl,
            )
            break;
        case SelType.SchemaSinglethreaded:
            const schemaSinglethreadedSelectedVariables = await schemaSinglethreadedSelectionRunnable(
                selectionModel,
                messages,
                tableMetadata
            ).invoke({}, {});
            
            SSBGetUrl = secureSchemaSinglethreadedRunnableToURL(
                schemaSinglethreadedSelectedVariables,
                SSBGetUrl,
                tableMetadata,
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

    if (!responseTableData.ok)
        throw new Error('Failed to fetch SSB API table data from table ' + tableId + ' with URL ' + SSBGetUrl);

    return (await responseTableData.json()) as PxWebData;
}