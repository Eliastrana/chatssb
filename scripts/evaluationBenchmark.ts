interface EvaluationBenchmark {
    userPrompt: string,
    reasoningPrompt?: string, // Optional prompt to be used for reasoning
    difficulty: 'easy' | 'medium' | 'hard';
    expectedCorrectTables: string[]; // Tables that the LLM should pick
    technicallyCorrectTables?: string[]; // Tables that the LLM can pick, but are not logically
    // correct according to the query and available options.
    selectionExamples?: {
        tableId: string,
        correctParameters: {
            [key: string]: string[] // Omitted values will just not be included in the correct
            ContentsCode: string[]; // The contents code that should be selected
            Tid: string[]; // The year that should be selected
        }
    }[];
}

function timeArrayGenerator(startYear: number, endYear: number, subStep?: { start: number, end: number, interval?: number, prefix?: string, postfix?: string }): string[] {
    const years: string[] = [];
    for (let i = startYear; i <= endYear; i++) {
        if (subStep) {
            for (let j = subStep.start; j <= subStep.end; j += subStep.interval || 1) {
                if (subStep.end > 10 && j < 10) {
                    years.push(`${i}${subStep.prefix || ''}0${j}${subStep.postfix || ''}`);
                } else {
                    years.push(`${i}${subStep.prefix || ''}${j}${subStep.postfix || ''}`);
                }
            }
        } else {
            years.push(`${i}`);
        }
    }
    return years;
}

// These answers are made with the date being 01.01.2024 as that gives some leeway for data that
// maybe is not available yet, but will be in the future.
export const evaluationBenchmark: EvaluationBenchmark[] = [
    {
        userPrompt: 'Hva var befolkningstallet i Norge i 2022?',
        difficulty: 'easy',
        expectedCorrectTables: ['07459', '06913', '03027', '03031', '11342', '12871', '13536', '05803', '10211', '05810', '05328'],
        technicallyCorrectTables: ['01222', '01223', '04362', '05196'],
        selectionExamples: [
            {
                tableId: '07459',
                correctParameters: {
                    ContentsCode: ['Personer1'],
                    Tid: ['2022'],
                },
            },
        ],
    },
    {
        userPrompt: 'Hvor mange heter Trygve til fornavn i dag?',
        difficulty: 'easy',
        expectedCorrectTables: ['10501'],
        selectionExamples: [
            {
                tableId: '10501',
                correctParameters: {
                    Fornavn: ['2TRYGVE'],
                    ContentsCode: ['Fornavn'],
                    Tid: ['2024'],
                }
            }
        ]
    },
    {
        userPrompt: 'Hva var Norges BNP fra 2010-2020?',
        difficulty: 'easy',
        expectedCorrectTables: ['09189'],
        technicallyCorrectTables: ['11721'],
        selectionExamples: [
            {
                tableId: '09189',
                correctParameters: {
                    ContentsCode: ['BNP'],
                    Tid: timeArrayGenerator(2010, 2020),
                }
            }
        ]
    }
    
]