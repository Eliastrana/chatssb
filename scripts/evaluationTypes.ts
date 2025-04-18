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
        ContentsCode: string[]; // The contents code that should be selected
        Tid: string[]; // The year that should be selected
    }
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
            responses: { // Each configuraiton and benchmark can be run multiple times to test
                // averge performance.
                tableId: string,
                milliseconds: number, // Time for response in ms
                tokenUsage: {
                    completionTokens: number,
                    promptTokens: number,
                    totalTokens: number,
                }
            }[]
        }[]
    }[]
}

export interface SelectionAnswers {
    configBenchmarkPairs: {
        configuration: SelectionConfiguration,
        answers: {
            benchmark: EvaluationBenchmark
            responses: { // Each configuraiton and benchmark can be run multiple times to test
                // averge performance.
                selectedParameters: SelectionParameters,
                milliseconds: number, // Time for response in ms
                tokenUsage: {
                    completionTokens: number,
                    promptTokens: number,
                    totalTokens: number,
                }
            }[]
        }
    }[]
}