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
        reasoningPrompt: 
`1. **Translation of Request:** What was the population number in Norway in 2022?
2. **Interpretation of the Request:** The request is likely about obtaining the total population figure for Norway for the year 2022. The user is interested in demographic statistics.
3. **Possible Interpretations:** The request could also imply an interest in trends over time, such as how the population has changed from previous years or projections for future years. Additionally, the user might be interested in specific demographic breakdowns (e.g., age, gender, region).
4. **Understanding of Timeframe:** The user is explicitly asking for data from the year 2022. Given that today is April 18, 2025, this is a specific past year.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be \\"population\\" and \\"demographics.\\"
6. **Potential Relevant Keywords:** Population statistics, Norway population 2022, demographic data Norway, population growth Norway, Statistics Norway population figures."`,
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
        reasoningPrompt:
`1. **Translation of Request:** How many people have the first name Trygve today?
2. **Interpretation of the Request:** The request is likely about the current number of individuals in Norway who have the first name Trygve. The user is interested in understanding the popularity or prevalence of this specific name.
3. **Possible Interpretations:** The request could also be interpreted as asking for historical data on the name Trygve, such as how its popularity has changed over time, or comparisons with other names. Additionally, the user might be interested in demographic information about people named Trygve, such as age distribution or geographic concentration.
4. **Understanding of Timeframe:** The user refers to \\"today,\\" which in this context is April 18, 2025. This indicates a request for the most current data available as of that date.
5. **Suggested Themes/Categories:** The relevant statistical domains for this request would include \\"population\\" and \\"demographics,\\" specifically focusing on naming statistics.
6. **Potential Relevant Keywords:** Trygve, first name statistics, name popularity, demographics, population statistics, name distribution, Statistics Norway."`,
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
        reasoningPrompt:
`1. **Translation of Request:** What was Norway's GDP from 2010-2020?
2. **Interpretation of the Request:** The request is likely about obtaining data on Norway's Gross Domestic Product (GDP) for the years 2010 to 2020. The user is interested in understanding the economic performance of Norway over this specific period.
3. **Possible Interpretations:** The request could also imply a desire for insights into trends in GDP, such as growth rates, comparisons to other countries, or the impact of specific events (like the COVID-19 pandemic) on GDP during these years.
4. **Understanding of Timeframe:** The user explicitly refers to the years 2010 to 2020. This timeframe is clear and does not require further interpretation.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be \\"economy\\" and \\"national accounts,\\" specifically focusing on GDP.
6. **Potential Relevant Keywords:** GDP, Gross Domestic Product, Norway, economic growth, national accounts, economic performance, 2010-2020."`,
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