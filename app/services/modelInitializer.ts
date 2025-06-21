import {ModelType, ServerLog} from "@/app/types";
import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {Generation, LLMResult} from "@langchain/core/outputs";
import {ChatOpenAI} from "@langchain/openai";
import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import {ChatGroq} from "@langchain/groq";
import {Serialized} from "@/node_modules/@langchain/core/dist/load/serializable";

export function modelInitializer(
    modelType: ModelType, 
    sendLog: (log: ServerLog) => void, 
    evaluationTokenUsage?: { completionTokens: number, promptTokens: number, totalTokens: number },
): BaseChatModel {
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

                    if (evaluationTokenUsage && output.llmOutput?.tokenUsage) {
                        evaluationTokenUsage.completionTokens += output.llmOutput.tokenUsage.completionTokens;
                        evaluationTokenUsage.promptTokens += output.llmOutput.tokenUsage.promptTokens;
                        evaluationTokenUsage.totalTokens += output.llmOutput.tokenUsage.totalTokens;
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
        case ModelType.GPTo4Mini:
        case ModelType.GPTo3Mini:
            return new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: modelType,
                reasoningEffort: 'low',
                ...defaultLLMConfig
            });
        case ModelType.GPT4oMini:
        case ModelType.GPT4_1Nano:
        case ModelType.GPT4_1Mini:
        case ModelType.GPT4_1:
            return new ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: modelType,
                temperature: 0,
                ...defaultLLMConfig
            });
        case ModelType.GeminiFlash2Lite:
        case ModelType.GeminiFlash2:
        case ModelType.Gemini2_5ProExp:
        case ModelType.GeminiFlash2_5:
            return new ChatGoogleGenerativeAI({
                model: modelType,
                ...defaultLLMConfig
            });
        case ModelType.Llama3_3_70b:
        case ModelType.Llama3_1_8b:
        case ModelType.Llama4Maverick:
        case ModelType.Llama4Scout:
        case ModelType.DeepseekR1_70b:
        case ModelType.Qwen_QwQ_32b:
            return new ChatGroq({
                model: modelType,
                temperature: 0,
                ...defaultLLMConfig
            });
        default:
            throw new Error(`Model type ${modelType} not supported`);
    }
}