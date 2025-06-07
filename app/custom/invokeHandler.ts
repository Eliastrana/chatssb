import {CustomAPIParams, ModelType, PxWebData, ServerLog, SSBTableMetadata} from "@/app/types";
import {redundantSingle} from "@/app/services/selection/runnables/redundantSingle";
import {redundantSingleToURL} from "@/app/services/selection/utils/redundantSingleToURL";
import {reasoning} from "@/app/services/reasoning/runnables/reasoning";
import {modelInitializer} from "@/app/services/modelInitializer";
import {keywordSearchToMetadata} from "@/app/services/navigation/keywordSearchToMetadata";
import {parsingRunnableRetryWrapper} from "@/app/services/parsingRunnableRetryWrapper";


export async function invokeHandler(
    params: CustomAPIParams,
    sendLog: (log: ServerLog) => void,
): Promise<PxWebData> {

    let baseURL = 'https://data.ssb.no/api/pxwebapi/v2-beta/';
    
    // If Weekends or 05.00-08.15 every day:
    const currentDay = new Date().getDay();
    const currentHour = new Date().getHours();
    if ((currentDay === 0 || currentDay === 6) || (currentHour >= 5 && currentHour < 8)) {
        baseURL = 'https://data.qa.ssb.no/api/pxwebapi/v2-beta/'
        sendLog({content: `The SSB API is unavailable on weekends and daily from 05:00 to 08:15. 
    During these times, the test Statbank is used instead.`, eventType: 'info'});
    }

    let userPrompt = `${params.userMessage}\nDate: ${new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
    })}`;

    sendLog({content: 'Resonnerer...', eventType: 'nav'})

    const resonatedContext = await reasoning(
        modelInitializer(ModelType.GeminiFlash2, sendLog),
        userPrompt
    ).invoke({});

    userPrompt += `\n${resonatedContext.content}`;

    let tableMetadata: SSBTableMetadata;
    const navigationModel = modelInitializer(ModelType.GeminiFlash2, sendLog);


    tableMetadata = await keywordSearchToMetadata(
        navigationModel,
        userPrompt,
        5,
        sendLog,
        baseURL
    );

    const tableId = tableMetadata.extension.px.tableid;
    let SSBGetUrl = baseURL + 'tables/' + tableId + '/data?lang=no&format=json-stat2';

    const selectionModel = modelInitializer(ModelType.GeminiFlash2, sendLog);


    const schemaSinglethreadedSelectedVariables = await parsingRunnableRetryWrapper(
        selectionModel,
        userPrompt,
        redundantSingle(tableMetadata)
    )

    SSBGetUrl = redundantSingleToURL(
        schemaSinglethreadedSelectedVariables,
        SSBGetUrl,
        tableMetadata,
        sendLog
    );


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