import {
    CustomAPIParams,
    ModelType,
    PxWebData,
    ServerLog,
    SSBCodeList,
    SSBTableMetadata
} from "@/app/types";
import {reasoning} from "@/app/services/reasoning/runnables/reasoning";
import {modelInitializer} from "@/app/services/modelInitializer";
import {keywordSearchToMetadata} from "@/app/services/navigation/keywordSearchToMetadata";
import {parsingRunnableRetryWrapper} from "@/app/services/parsingRunnableRetryWrapper";
import {valueSelection} from "@/app/custom/valueSelection";
import {customSelectionToURL} from "@/app/custom/customSelectionToURL";
import {dimensionSelection} from "@/app/custom/dimensionSelection";


export async function invokeHandler(
    params: CustomAPIParams,
    sendLog: (log: ServerLog) => void,
): Promise<PxWebData> {

    
    let baseURL = 'https://data.qa.ssb.no/api/pxwebapi/v2-beta/';
    
    // TODO Implement when prod pxwebapi is fixed
    /*
    let baseURL = 'https://data.ssb.no/api/pxwebapi/v2-beta/';
    
    // If Weekends or 05.00-08.15 every day:
    const currentDay = new Date().getDay();
    const currentHour = new Date().getHours();
    if ((currentDay === 0 || currentDay === 6) || (currentHour >= 5 && currentHour < 8)) {
        baseURL = 'https://data.qa.ssb.no/api/pxwebapi/v2-beta/'
        sendLog({content: `The SSB API is unavailable on weekends and daily from 05:00 to 08:15. 
    During these times, the test Statbank is used instead.`, eventType: 'info'});
    }*/

    let userPrompt = `${params.userMessage}\nDate: ${new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric'
    })}`;

    sendLog({content: 'Resonnerer...', eventType: 'nav'})

    const resonatedContext = await reasoning(
        modelInitializer(ModelType.GPT4_1, sendLog),
        userPrompt
    ).invoke({});

    userPrompt += `\n${resonatedContext.content}`;

    let tableMetadata: SSBTableMetadata;
    const navigationModel = modelInitializer(ModelType.GPT4_1, sendLog);

    // TODO, implment custom keyword search that uses a single 100 page search.
    tableMetadata = await keywordSearchToMetadata(
        navigationModel,
        userPrompt,
        5,
        sendLog,
        baseURL
    );

    const tableId = tableMetadata.extension.px.tableid;
    let SSBGetUrl = baseURL + 'tables/' + tableId + '/data?lang=no&format=json-stat2';

    const selectionModel = modelInitializer(ModelType.GPT4_1, sendLog);
    
    // if no table has code list or if no table is optional
    const hasCodeListOrIsOptional = Object.entries(tableMetadata.dimension).some(([, value]) => {
        return value.extension.codeLists.length > 0 || value.extension.elimination;
    });
    
    let selectedDimensions = {}
    
    if (hasCodeListOrIsOptional) {
        selectedDimensions =  await parsingRunnableRetryWrapper(
            selectionModel,
            userPrompt,
            dimensionSelection(tableMetadata)
        )
        
        for (const [dimension, value] of Object.entries(selectedDimensions)) {
            if (value === 'OMITTED') {
                delete tableMetadata.dimension[dimension];
                continue;
            }

            if (value !== 'INCLUDED') {
                const response = await fetch(`${baseURL}/codeLists/${value}?lang=en`, {
                    method: "GET",
                    headers: {"Content-Type": "application/json"},
                });

                const codeList = (await response.json()) as SSBCodeList;
                
                tableMetadata.dimension[dimension].label += ` (${codeList.label})`;
                
                tableMetadata.dimension[dimension].category.label = {};

                for (const item of codeList.values) {
                    tableMetadata.dimension[dimension].category.label[item.code] = item.label;
                }
            }
        }
    }
    
    const selectedValues = await parsingRunnableRetryWrapper(
        selectionModel,
        userPrompt,
        valueSelection(tableMetadata)
    )

    SSBGetUrl = customSelectionToURL(
        selectedValues,
        SSBGetUrl,
        tableMetadata,
        selectedDimensions,
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