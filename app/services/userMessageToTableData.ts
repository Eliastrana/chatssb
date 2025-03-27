import {ChatOpenAI} from '@langchain/openai';
import {HumanMessage} from '@langchain/core/messages';
import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import {ChatGroq} from "@langchain/groq";


import {
    BackendAPIParams,
    ModelType,
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
import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {Generation, LLMResult} from "@langchain/core/outputs";
import {Serialized} from "@/node_modules/@langchain/core/dist/load/serializable";
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

export async function userMessageToTableData(
    params: BackendAPIParams,
    sendLog: (log: ServerLog) => void,
): Promise<PxWebData> {
    const defaultLLMConfig = {
        maxTokens: undefined,
        callbacks: [
            {
                handleLLMStart(llm: Serialized, prompts: string[]) {
                    sendLog({ content: JSON.stringify(prompts, null, 2), eventType: 'log' });
                }
            }
            ,{
                handleLLMEnd(output: LLMResult) {
                    interface ExtendedGeneration extends Generation {
                        message: {
                            tool_calls: { args: unknown }[];
                        };
                    }

                    // Bad implementation, but it works for now
                    (output.generations as ExtendedGeneration[][])
                        .flatMap(g => g)
                        .forEach(g =>
                            sendLog({ content: JSON.stringify(g.message.tool_calls[0].args, null, 2), eventType: 'log' }));
                    
                    if (output.llmOutput?.tokenUsage) {
                        sendLog({ content: JSON.stringify(output.llmOutput.tokenUsage), eventType: 'tokens' });
                    }
                },
            },
        ],
    };
    
    let model: BaseChatModel;

    switch (params.modelType) {
        case ModelType.GPT4oMini:
            model = new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: ModelType.GPT4oMini,
                temperature: 0,
                ...defaultLLMConfig
            });
            console.log('Using GPT-4o-mini first');
            break;
        case ModelType.GPTo3Mini:
            model = new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: ModelType.GPTo3Mini,
                reasoningEffort: 'low',
                ...defaultLLMConfig
            });
            console.log('Using GPT-o3-mini');
            break;
        case ModelType.GeminiFlash2Lite:
            model = new ChatGoogleGenerativeAI({
                model: ModelType.GeminiFlash2Lite,
                temperature: 0,
                ...defaultLLMConfig
            });
            console.log('Using Gemini Flash 2 Lite');
            break;
        case ModelType.Llama33_70b:
            model = new ChatGroq({
                model: ModelType.Llama33_70b,
                temperature: 0,
                ...defaultLLMConfig
            });
            console.log('Using Llama 3.3-70b');
            break;
        case ModelType.Llama32_1b:
            model = new ChatGroq({
                model: ModelType.Llama32_1b,
                temperature: 0,
                ...defaultLLMConfig
            });
            console.log('Using Llama 3.2-1b');
            break;
        case ModelType.DeepseekR1_70b:
            model = new ChatGroq({
                model: ModelType.DeepseekR1_70b,
                temperature: 0,
                ...defaultLLMConfig
            });
            console.log('Using Deepseek R1 70b');
            break;
        default:
            model = new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: ModelType.GPT4oMini,
                temperature: 0,
                ...defaultLLMConfig
            });
            console.log('Using GPT-4o-mini from fallback');
    }

    const { userMessage, nav, sel } = params;

    // Navigation code
    let tableMetadata: SSBTableMetadata;

    switch (nav) {
        case NavType.Parallell_1:
            tableMetadata = await parallellUserMessageToMetadata(
                model,
                userMessage,
                1,
                sendLog
            );
            break;
        default:
            throw new Error('Invalid navigation technique');
    }

    const tableId = tableMetadata.extension.px.tableid;
    let SSBGetUrl = 'https://data.ssb.no/api/pxwebapi/v2-beta/tables/' + tableId + '/data?lang=no&format=json-stat2';
    
    const messages = [
        new HumanMessage(userMessage)
    ];

    // Selection code
    switch (sel) {
        case SelType.Singlethreaded:
            const singlethreadedSelectedVariables = await singlethreadedSelectionRunnable(
                model,
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
                model,
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
                model,
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
                model,
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
                model,
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