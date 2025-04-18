import {ModelType, ServerLog} from "@/app/types";
import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {Generation, LLMResult} from "@langchain/core/outputs";
import {ChatOpenAI} from "@langchain/openai";
import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import {ChatGroq} from "@langchain/groq";
import {Serialized} from "@/node_modules/@langchain/core/dist/load/serializable";

export function modelInitializer(modelType: ModelType, sendLog: (log: ServerLog) => void): BaseChatModel {
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

                    if (output.llmOutput?.tokenUsage) {
                        sendLog({ content: JSON.stringify(output.llmOutput.tokenUsage), eventType: 'tokens' });
                    }

                    // Bad implementation, but it works for now
                    (output.generations as ExtendedGeneration[][])
                        .flatMap(g => g)
                        .forEach(g => {
                            if (g.message.tool_calls?.[0]?.args) {
                                sendLog({ content: JSON.stringify(g.message.tool_calls[0].args, null, 2), eventType: 'log' });
                            }
                        });

                },
            },
        ],
    };
    
    switch (modelType) {
        case ModelType.GPT4oMini:
            return new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: ModelType.GPT4oMini,
                temperature: 0,
                ...defaultLLMConfig
            });
            break;
        case ModelType.GPTo3Mini:
            return new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: ModelType.GPTo3Mini,
                reasoningEffort: 'low',
                ...defaultLLMConfig
            });
        case ModelType.GeminiFlash2Lite:
            return new ChatGoogleGenerativeAI({
                model: ModelType.GeminiFlash2Lite,
                temperature: 0,
                convertSystemMessageToHumanContent: true,
                ...defaultLLMConfig
            });
            break;
        case ModelType.Gemini2_5ProExp:
            return new ChatGoogleGenerativeAI({
                model: ModelType.Gemini2_5ProExp,
                temperature: 0,
                convertSystemMessageToHumanContent: true,
                ...defaultLLMConfig
            });
            break;
        case ModelType.Llama3_3_70b:
            return new ChatGroq({
                model: ModelType.Llama3_3_70b,
                temperature: 0,
                ...defaultLLMConfig
            });
            break;
        case ModelType.Llama3_1_8b:
            return new ChatGroq({
                model: ModelType.Llama3_1_8b,
                temperature: 0,
                ...defaultLLMConfig
            });
            break;
        case ModelType.DeepseekR1_70b:
            return new ChatGroq({
                model: ModelType.DeepseekR1_70b,
                temperature: 0,
                ...defaultLLMConfig
            });
            break;
        default:
            console.log('Using GPT-4o-mini from fallback');
            return new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: ModelType.GPT4oMini,
                temperature: 0,
                ...defaultLLMConfig
            });
    }
}