import {EvaluationBenchmark} from "@/scripts/evaluationTypes";

function timeArrayGenerator(startYear: number, endYear: number, subStep?: { start: number, end: number, interval?: number, prefix?: string, postfix?: string }): string[] {
    const years: string[] = [];
    for (let i = startYear; i <= endYear; i++) {
        if (subStep) {
            for (let j = subStep.start; j <= subStep.end; j += subStep.interval || 1) {
                years.push(`${i}${subStep.prefix || ''}${(subStep.end >= 10 && j < 10) ? '0' : ''}${j}${subStep.postfix || ''}`);
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
        selectionBenchmarks: [
            {
                tableId: '07459',
                parameters: {
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
        selectionBenchmarks: [
            {
                tableId: '10501',
                parameters: {
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
        selectionBenchmarks: [
            {
                tableId: '09189',
                parameters: {
                    ContentsCode: ['BNP'],
                    Tid: timeArrayGenerator(2010, 2020),
                }
            }
        ]
    }
    
]