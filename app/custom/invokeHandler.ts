import {
    CustomAPIParams,
    ModelType,
    PxWebData,
    ServerLog,
    SSBCodeList,
    SSBTableMetadata
} from "@/app/types";
import {modelInitializer} from "@/app/services/modelInitializer";
import {valueSelection} from "@/app/custom/valueSelection";
import {customSelectionToURL} from "@/app/custom/customSelectionToURL";
import {dimensionSelection} from "@/app/custom/dimensionSelection";
import {customKeywordSearch} from "@/app/custom/customKeywordSearch";
import {customWrapper} from "@/app/custom/customWrapper";
import {customReasoningPrompt} from "@/app/custom/customReasoningPrompt";


export async function invokeHandler(
    params: CustomAPIParams,
    sendLog: (log: ServerLog) => void,
): Promise<PxWebData> {
    sendLog({ content: 'Prosseserer...', eventType: 'nav' });

    let baseURL = 'https://data.qa.ssb.no/api/pxwebapi/v2-beta/';
    
    // If Weekends or 05.00-08.15 every day:
    const currentDay = new Date().getDay();
    const currentHour = new Date().getHours();
    if ((currentDay === 0 || currentDay === 6) || (currentHour >= 5 && currentHour < 8)) {
        baseURL = 'https://data.qa.ssb.no/api/pxwebapi/v2-beta/'
        sendLog({content: `The SSB API is unavailable on weekends and daily from 05:00 to 08:15. 
    During these times, the test Statbank is used instead.`, eventType: 'info'});
    }
    
    // Add totalValues
    for (const message of params.messageHistory) {
        if (message.pxData) {
            const response = await fetch(`${baseURL}/tables/${message.pxData.extension.px.tableid}/metadata?lang=en&outputFormat=json-stat2`, {
                method: "GET",
                headers: {"Content-Type": "application/json"},
            });
            
            const tableMetadata = (await response.json()) as SSBTableMetadata;

            for (const [dimension, value] of Object.entries(tableMetadata.dimension)) {
                if (message.pxData.dimension[dimension]) {
                    message.pxData.dimension[dimension].totalValues = Object.keys(value.category.label).length;
                } else {
                    message.pxData.dimension[dimension] = { // Hatløsning
                        ...value,
                        category: {
                            index: {},
                            label: {},
                            unit:  {},
                        },
                    };
                }
            }
        }
    }
    
    const navigationModel = modelInitializer(ModelType.GPT4_1, sendLog);
    
    sendLog({ content: 'Ressonerer...', eventType: 'nav' });
    
    const reasoning = await customWrapper(
        navigationModel,
        params,
        customReasoningPrompt
    );
    
    params.userMessageReflection = reasoning.content;
    
    let tableMetadata: SSBTableMetadata;

    tableMetadata = await customKeywordSearch(
        navigationModel,
        params,
        5,
        50,
        sendLog,
        baseURL
    );

    const tableId = tableMetadata.extension.px.tableid;
    let SSBGetUrl = baseURL + 'tables/' + tableId + '/data?lang=no&format=json-stat2';

    const selectionModel = modelInitializer(ModelType.GPTo4Mini, sendLog);
    
    // if no table has code list or if no table is optional
    const hasCodeListOrIsOptional = Object.entries(tableMetadata.dimension).some(([, value]) => {
        return value.extension.codeLists.length > 0 || value.extension.elimination;
    });
    
    let selectedDimensions = {}
    
    if (hasCodeListOrIsOptional) {
        selectedDimensions =  await customWrapper(
            selectionModel,
            params,
            dimensionSelection(tableMetadata).systemPrompt,
            dimensionSelection(tableMetadata).schema,
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
    
    const selectedValues = await customWrapper(
        selectionModel,
        params,
        valueSelection(tableMetadata).systemPrompt,
        valueSelection(tableMetadata).schema,
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