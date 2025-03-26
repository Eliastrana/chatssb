import {ChatOpenAI} from '@langchain/openai';
import {HumanMessage, SystemMessage} from '@langchain/core/messages';
import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import {ChatGroq} from "@langchain/groq";


import {
    BackendAPIParams,
    ModelType,
    NavType,
    PxWebData,
    SelectionParamaters,
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
import {BaseChatModel} from "@langchain/core/language_models/chat_models";

export async function userMessageToTableData(
    params: BackendAPIParams,
    sendLog: (log: ServerLog) => void,
    config?: Record<string, unknown>,
): Promise<PxWebData> {
    
    // Kan mest sannsynlig bli vagere
    let model: BaseChatModel;

    switch (params.modelType) {
        case ModelType.GPT4oMini:
            model = new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: ModelType.GPT4oMini,
                temperature: 0,
            });
            console.log('Using GPT-4o-mini first');
            break;
        case ModelType.GPTo3Mini:
            model = new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: ModelType.GPTo3Mini,
                reasoningEffort: 'low'
            });
            console.log('Using GPT-o3-mini');
            break;
        case ModelType.GeminiFlash2Lite:
            model = new ChatGoogleGenerativeAI({
                model: ModelType.GeminiFlash2Lite,
                temperature: 0,
                maxRetries: 2,
            });
            console.log('Using Gemini Flash 2 Lite');
            break;
        case ModelType.Llama33_70b:
            model = new ChatGroq({
                model: ModelType.Llama33_70b,
                temperature: 0,
                maxTokens: undefined,
                maxRetries: 2,
            });
            console.log('Using Llama 3.3-70b');
            break;
        case ModelType.Llama32_1b:
            model = new ChatGroq({
                model: ModelType.Llama32_1b,
                temperature: 0,
                maxTokens: undefined,
                maxRetries: 2,
            });
            console.log('Using Llama 3.2-1b');
            break;
        case ModelType.DeepseekR1_70b:
            model = new ChatGroq({
                model: ModelType.DeepseekR1_70b,
                temperature: 0,
                maxTokens: undefined,
                maxRetries: 2,
            });
            console.log('Using Deepseek R1 70b');
            break;
        default:
            model = new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: ModelType.GPT4oMini,
                temperature: 0,
            });
            console.log('Using GPT-4o-mini from fallback');
            break;
    }

    const { userMessage, nav, sel } = params;

    // Navigation code
    let tableMetadata: SSBTableMetadata;

    switch (nav) {
        case NavType.Parallell:
            tableMetadata = await parallellUserMessageToMetadata(
                model,
                userMessage,
                config?.maxBreath ? (config.maxBreath as number) : 1,
                sendLog
            );
            break;
        default:
            throw new Error('Invalid navigation technique');
    }

    const tableId = tableMetadata.extension.px.tableid;
    let SSBGetUrl = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + tableId + '/data?lang=no&format=json-stat2';
    
    const messages = [
        new SystemMessage('Select the best parameters based on the users request'),
        new HumanMessage(userMessage)
    ];

    // Selection code
    switch (sel) {
        case SelType.SingleThreaded:
            const singlethreadedSelectedVariables = await singlethreadedSelectionRunnable(
                model,
                messages,
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
        case SelType.MultiThreaded:
            const multithreadedSelectedVariables = await multithreadedSelectionRunnable(
                model,
                messages,
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
        case SelType.EnumSingleThreaded:
            const enumSinglethreadedSelectedVariables = await enumSinglethreadedSelectionRunnable(
                model,
                messages,
                tableMetadata,
                sendLog
            ).invoke({}, {});

            sendLog({ content: JSON.stringify(enumSinglethreadedSelectedVariables, null, 2), eventType: 'log' });
            
            SSBGetUrl = enumSinglethreadedRunnableToURL(
                enumSinglethreadedSelectedVariables,
                SSBGetUrl,
                sendLog
            )
            break;
        case SelType.EnumMultiThreaded:
            const enumMultithreadedSelectedVariables = await enumMultithreadedSelectionRunnable(
                model,
                messages,
                tableMetadata,
                sendLog
            ).invoke({}, {});
            
            Object.entries(enumMultithreadedSelectedVariables).forEach(([key, value]) => {
                sendLog({ content: key + JSON.stringify(value, null, 2), eventType: 'log' });
            });
            
            SSBGetUrl = enumMultithreadedRunnableToURL(
                enumMultithreadedSelectedVariables,
                SSBGetUrl,
                sendLog
            )
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

function singlethreadedToURL(
    response: Record<string, SelectionParamaters>,
    url: string,
    sendLog: (log: ServerLog) => void
): string {
    Object.entries(response).forEach(([key, value]) => {
        if (value.itemSelection) {
            // Join the selections into a comma-separated string
            const selection = value.itemSelection.join(",");
            sendLog({ content: `Selections for ${key}: ${selection}`, eventType: 'log' });
            url += `&valueCodes[${key}]=${selection}`;
        } else if (value.selectionExpression) {
            // Process each selection expression
            value.selectionExpression.forEach((expression: string) => {
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
    responses: Record<string, Record<string, SelectionParamaters>>,
    url: string,
    sendLog: (log: ServerLog) => void
): string {
    // Iterate over the top-level keys in the responses object
    Object.entries(responses).forEach(([, responseValue]) => {
        // Each responseValue is itself an object that we need to iterate over
        Object.entries(responseValue).forEach(([key, value]) => {
            if (value.itemSelection) {
                // Join the selections into a comma-separated string
                const selection = value.itemSelection.join(",");
                sendLog({ content: `Selections for ${key}: ${selection}`, eventType: 'log' });
                url += `&valueCodes[${key}]=${selection}`;
            } else if (value.selectionExpression) {
                // Process each selection expression
                value.selectionExpression.forEach((expression: string) => {
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
