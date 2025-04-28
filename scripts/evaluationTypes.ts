import {ModelType} from "@/app/types";

export interface NavigationConfiguration {
    model: ModelType,
    navigationTechnique: 'folderNavigation' | 'keywordSearch',
    navigationValue: number,
    reasoning: boolean,
}

export interface SelectionConfiguration {
    model: ModelType,
    selectionTechnique: 'expression' | 'enum' | 'redundant'
    reasoning: boolean,
}

export interface SelectionParameters {
    tableId: string,
    parameters: {
        [key: string]: string[] // Omitted values will just not be included in the correct
    }
}

export interface SelectionEvaluationParameters {
    tableId: string,
    parameters: {
        [key: string]: {
            correctValues: number,
            extraValues: number,
            missingValues: number,
        }
    }
    url?: string; // URL to the error page if the selection is not correct
}

export interface EvaluationBenchmark {
    userPrompt: string, // Functions as the key for the benchmark
    reasoningPrompt?: string, // Optional prompt to be used for reasoning
    difficulty: 'easy' | 'medium' | 'hard';
    expectedCorrectTables: string[]; // Tables that the LLM should pick
    technicallyCorrectTables?: string[]; // Tables that the LLM can pick, but are not logically
    // correct according to the query and available options.
    selectionBenchmarks?: SelectionParameters[];
}

export interface NavigationAnswers {
    configurations: {
        navigationConfiguration: NavigationConfiguration,
        benchmarkAnswers: {
            userPrompt: string,
            responses: {
                tableId: string,
                result: 'correct' | 'technicallyCorrect' | 'incorrect' | 'error',
                milliseconds: number, // Time for response in ms
                tokenUsage: {
                    completionTokens: number,
                    promptTokens: number,
                    totalTokens: number,
                }
                errorMessage?: string, // Error message if the result is 'error'
            }[]
        }[]
    }[]
}

export interface SelectionAnswers {
    configurations: {
        selectionConfiguration: SelectionConfiguration,
        benchmarkAnswers: {
            userPrompt: string,
            responses: {
                selectedParameters: SelectionEvaluationParameters,
                milliseconds: number, // Time for response in ms
                tokenUsage: {
                    completionTokens: number,
                    promptTokens: number,
                    totalTokens: number,
                }
                errorMessage?: string, // Error message if the result is 'error'
            }[]
        }[]
    }[]
}