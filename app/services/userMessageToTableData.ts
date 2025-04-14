import {HumanMessage, SystemMessage} from '@langchain/core/messages';

import {
    BackendAPIParams,
    NavType,
    PxWebData,
    SelType,
    ServerLog,
    SSBTableMetadata
} from "@/app/types";
import {folderNavigationToMetadata} from "@/app/services/navigation/folderNavigationToMetadata";
import {expressionSingle} from "@/app/services/selection/runnables/expressionSingle";
import {expressionMulti} from "@/app/services/selection/runnables/expressionMulti";
import {enumMulti} from "@/app/services/selection/runnables/enumMulti";
import {enumSingle} from "@/app/services/selection/runnables/enumSingle";
import {enumSingleToURL} from "@/app/services/selection/utils/enumSingleToURL";
import {enumMultiToURL} from "@/app/services/selection/utils/enumMultiToURL";
import {expressionSingleToURL} from "@/app/services/selection/utils/expressionSingleToURL";
import {expressionMultiToURL} from "@/app/services/selection/utils/expressionMultiToURL";
import {redundantSingle} from "@/app/services/selection/runnables/redundantSingle";
import {redundantSingleToURL} from "@/app/services/selection/utils/redundantSingleToURL";
import {reasoning} from "@/app/services/reasoning/runnables/reasoning";
import {modelInitializer} from "@/app/services/modelInitializer";
import {keywordSearchToMetadata} from "@/app/services/navigation/keywordSearchToMetadata";


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
    
    if (params.reasoning) {
        sendLog({content: 'Resonnerer...', eventType: 'nav'})
        
        const resonatedContext = await reasoning(
            modelInitializer(params.reasoningModel, sendLog),
            messages
        ).invoke({}, {});
        
        sendLog({content: resonatedContext.content, eventType: 'log'})
        messages.push(new SystemMessage(resonatedContext.content));
    }
    
    let tableMetadata: SSBTableMetadata;
    const navigationModel = modelInitializer(params.navigationModel, sendLog);

    switch (params.navigationTechnique) {
        case NavType.FolderNavigation_1:
        case NavType.FolderNavigation_2:
        case NavType.FolderNavigation_3:
        case NavType.FolderNavigation_4:
        case NavType.FolderNavigation_5:
                tableMetadata = await folderNavigationToMetadata(
                navigationModel,
                messages,
                parseInt(params.navigationTechnique.slice(-1)),
                sendLog,
                baseURL
            );
            break;
        case NavType.KeywordSearch_1:
        case NavType.KeywordSearch_2:
        case NavType.KeywordSearch_3:
        case NavType.KeywordSearch_4:
        case NavType.KeywordSearch_5:
            tableMetadata = await keywordSearchToMetadata(
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
    
    const selectionModel = modelInitializer(params.selectionModel, sendLog);
    
    switch (params.selectionTechnique) {
        case SelType.ExpressionSingle:
            const singlethreadedSelectedVariables = await expressionSingle(
                selectionModel,
                messages,
                tableMetadata
            ).invoke({}, {});
            
            SSBGetUrl = expressionSingleToURL(
                singlethreadedSelectedVariables,
                SSBGetUrl
            );
            break;
        case SelType.ExpressionMulti:
            const multithreadedSelectedVariables = await expressionMulti(
                selectionModel,
                messages,
                tableMetadata,
            ).invoke({}, {});
            
            SSBGetUrl = expressionMultiToURL(
                multithreadedSelectedVariables,
                SSBGetUrl,
            );
            break;
        case SelType.EnumSingle:
            const enumSinglethreadedSelectedVariables = await enumSingle(
                selectionModel,
                messages,
                tableMetadata,
            ).invoke({}, {});
            
            SSBGetUrl = enumSingleToURL(
                enumSinglethreadedSelectedVariables,
                SSBGetUrl,
            )
            break;
        case SelType.EnumMulti:
            const enumMultithreadedSelectedVariables = await enumMulti(
                selectionModel,
                messages,
                tableMetadata,
            ).invoke({}, {});
            
            SSBGetUrl = enumMultiToURL(
                enumMultithreadedSelectedVariables,
                SSBGetUrl,
            )
            break;
        case SelType.RedundantSingle:
            const schemaSinglethreadedSelectedVariables = await redundantSingle(
                selectionModel,
                messages,
                tableMetadata
            ).invoke({}, {});
            
            SSBGetUrl = redundantSingleToURL(
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