import {ModelType} from "@/app/types";

export interface NavigationConfiguration {
    model: ModelType,
    navigationTechnique: 'folderNavigation' | 'keywordSearch',
    navigationValue: number,
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
    userPrompt: string,
    reasoningPrompt?: string, // Optional prompt to be used for reasoning
    difficulty: 'easy' | 'medium' | 'hard';
    expectedCorrectTables: string[]; // Tables that the LLM should pick
    technicallyCorrectTables?: string[]; // Tables that the LLM can pick, but are not logically
    // correct according to the query and available options.
    selectionBenchmarks?: SelectionParameters[];
}

export interface NavigationAnswers {
    configBenchmarkPairs: {
        configuration: NavigationConfiguration,
        answers: {
            benchmark: EvaluationBenchmark
            responses: { // Each configuraiton and benchmark can be run multiple times to test
                // averge performance.
                tableId: string,
                milliseconds: number, // Time for response in ms
            }[]
        }
    }[]
}
