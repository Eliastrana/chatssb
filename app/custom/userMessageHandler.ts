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
import {customMessageReasoningPrompt} from "@/app/custom/customMessageReasoningPrompt";
import {buildTableDescription} from "@/app/custom/buildTableDescription";
import {customForcedReasoningPrompt} from "@/app/custom/customForcedReasoningPrompt";


export async function userMessageHandler(
    params: CustomAPIParams,
    sendLog: (log: ServerLog) => void,
    baseURL: string
): Promise<void> {
    sendLog({ content: 'Prosseserer...', eventType: 'nav' });
    
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
    
    const reasoningModel = modelInitializer(ModelType.GPT4_1Mini, sendLog);
    const navigationModel = modelInitializer(ModelType.GeminiFlash2_5, sendLog);


    sendLog({ content: 'Ressonerer...', eventType: 'nav' });
    
    let tableMetadata: SSBTableMetadata;

    if (params.userMessage.forceTableId) {
        try {
            const res = await fetch(`${baseURL}/tables/${params.userMessage.forceTableId}/metadata?lang=en&outputFormat=json-stat2`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            tableMetadata = await res.json() as SSBTableMetadata;
        } catch {
            throw new Error(`Failed to fetch SSB API table metadata for table ${params.userMessage.forceTableId}`);
        }
        
        const reasoning = await customWrapper(
            reasoningModel,
            params,
            customForcedReasoningPrompt + `\n\n` + buildTableDescription(tableMetadata)
        );
        
        params.userMessageReflection = reasoning.content;
    } else {
        const reasoning = await customWrapper(
            reasoningModel,
            params,
            customMessageReasoningPrompt
        );

        params.userMessageReflection = reasoning.content;
        
        const searchResult = await customKeywordSearch(
            navigationModel,
            params,
            5,
            100,
            sendLog,
            baseURL
        );
        if (!searchResult) return;
        tableMetadata = searchResult;
    }
    
    const tableId = tableMetadata.extension.px.tableid;
    let SSBGetUrl = baseURL + 'tables/' + tableId + '/data?lang=no&format=json-stat2';

    const selectionModel = modelInitializer(ModelType.GeminiFlash2_5, sendLog);
    
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

    const result = await responseTableData.json() as PxWebData;

    sendLog({ content: JSON.stringify(result), eventType: 'pxData' });
}