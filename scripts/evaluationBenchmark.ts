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
    },
    {
        userPrompt: 'Gi meg antall pasienter på sykehus i 2023',
        difficulty: 'medium',
        reasoningPrompt:
            `1. **Translation of Request:** What was Norway's GDP from 2010-2020?
2. **Interpretation of the Request:** The request is likely about obtaining data on Norway's Gross Domestic Product (GDP) for the years 2010 to 2020. The user is interested in understanding the economic performance of Norway over this specific period.
3. **Possible Interpretations:** The request could also imply a desire for insights into trends in GDP, such as growth rates, comparisons to other countries, or the impact of specific events (like the COVID-19 pandemic) on GDP during these years.
4. **Understanding of Timeframe:** The user explicitly refers to the years 2010 to 2020. This timeframe is clear and does not require further interpretation.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be \\"economy\\" and \\"national accounts,\\" specifically focusing on GDP.
6. **Potential Relevant Keywords:** GDP, Gross Domestic Product, Norway, economic growth, national accounts, economic performance, 2010-2020."`,
        expectedCorrectTables: ['10261'],
        selectionBenchmarks: [
            {
                tableId: '10261',
                parameters: {
                    ContentsCode: ['PasientSomatSykeh'],
                    Tid: ['2023'],
                }
            }
        ]
    },
    {
        userPrompt: 'Vis meg utviklingen i elektrisitetspriser for husholdningene fra 2015-2020',
        difficulty: 'medium',
        reasoningPrompt:
            `1. **Translation of Request:** What was Norway's GDP from 2010-2020?
2. **Interpretation of the Request:** The request is likely about obtaining data on Norway's Gross Domestic Product (GDP) for the years 2010 to 2020. The user is interested in understanding the economic performance of Norway over this specific period.
3. **Possible Interpretations:** The request could also imply a desire for insights into trends in GDP, such as growth rates, comparisons to other countries, or the impact of specific events (like the COVID-19 pandemic) on GDP during these years.
4. **Understanding of Timeframe:** The user explicitly refers to the years 2010 to 2020. This timeframe is clear and does not require further interpretation.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be \\"economy\\" and \\"national accounts,\\" specifically focusing on GDP.
6. **Potential Relevant Keywords:** GDP, Gross Domestic Product, Norway, economic growth, national accounts, economic performance, 2010-2020."`,
        expectedCorrectTables: ['09007'],
        selectionBenchmarks: [
            {
                tableId: '09007',
                parameters: {
                    ContentsCode: ['KraftOgNettIA'],
                    Tid: timeArrayGenerator(2015, 2020),
                }
            }
        ]
    },
    {
        userPrompt: 'Gi meg kvartalsvise tall for verdipapirfond de siste åtte kvartalene.',
        difficulty: 'medium',
        reasoningPrompt:
            `1. **Translation of Request:** What was Norway's GDP from 2010-2020?
2. **Interpretation of the Request:** The request is likely about obtaining data on Norway's Gross Domestic Product (GDP) for the years 2010 to 2020. The user is interested in understanding the economic performance of Norway over this specific period.
3. **Possible Interpretations:** The request could also imply a desire for insights into trends in GDP, such as growth rates, comparisons to other countries, or the impact of specific events (like the COVID-19 pandemic) on GDP during these years.
4. **Understanding of Timeframe:** The user explicitly refers to the years 2010 to 2020. This timeframe is clear and does not require further interpretation.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be \\"economy\\" and \\"national accounts,\\" specifically focusing on GDP.
6. **Potential Relevant Keywords:** GDP, Gross Domestic Product, Norway, economic growth, national accounts, economic performance, 2010-2020."`,
        expectedCorrectTables: ['09470'],
        technicallyCorrectTables: ['09446'],
        selectionBenchmarks: [
            {
                tableId: '09470',
                parameters: {
                    ContentsCode: ['Markedsverdi'],
                    Utstedersektor: ['4300'],
                    Finansobjekt5: ['560'],
                    Tid: ['2023K1, 2023K2', '2023K3', '2023K4', '2024K1', '2024K2', '2024K3', '2024K4'],
                }
            }
        ]
    },
    {
        userPrompt: 'Hent ut renteutviklingen i banker og kredittforetak for de siste fem årene for nedbetalingslån',
        difficulty: 'medium',
        reasoningPrompt:
            `1. **Translation of Request:** What was Norway's GDP from 2010-2020?
2. **Interpretation of the Request:** The request is likely about obtaining data on Norway's Gross Domestic Product (GDP) for the years 2010 to 2020. The user is interested in understanding the economic performance of Norway over this specific period.
3. **Possible Interpretations:** The request could also imply a desire for insights into trends in GDP, such as growth rates, comparisons to other countries, or the impact of specific events (like the COVID-19 pandemic) on GDP during these years.
4. **Understanding of Timeframe:** The user explicitly refers to the years 2010 to 2020. This timeframe is clear and does not require further interpretation.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be \\"economy\\" and \\"national accounts,\\" specifically focusing on GDP.
6. **Potential Relevant Keywords:** GDP, Gross Domestic Product, Norway, economic growth, national accounts, economic performance, 2010-2020."`,
        expectedCorrectTables: ['10738'],
        technicallyCorrectTables: ['10729'],
        selectionBenchmarks: [
            {
                tableId: '10738',
                parameters: {
                    ContentsCode: ['RenterNyeNedBet'],
                    Utlanstype: ['02'],
                    Tid: ['2018M01', '2018M02', '2018M03', '2018M04', '2018M05', '2018M06', '2018M07', '2018M08', '2018M09', '2018M10', '2018M11', '2018M12', '2019M01', '2019M02', '2019M03', '2019M04', '2019M05', '2019M06', '2019M07', '2019M08', '2019M09', '2019M10', '2019M11', '2019M12', '2020M01', '2020M02', '2020M03', '2020M04', '2020M05', '2020M06', '2020M07', '2020M08', '2020M09', '2020M10', '2020M11', '2020M12', '2021M01', '2021M02', '2021M03', '2021M04', '2021M05', '2021M06', '2021M07', '2021M08', '2021M09', '2021M10', '2021M11', '2021M12', '2022M01', '2022M02', '2022M03', '2022M04', '2022M05', '2022M06', '2022M07', '2022M08', '2022M09', '2022M10', '2022M11', '2022M12', '2023M01', '2023M02', '2023M03', '2023M04']
                }
            }
        ]
    },
    {
        userPrompt: 'Vis meg sesongjusterte tall for arbeidsledighet for alle aldre fra 2024',
        difficulty: 'easy',
        reasoningPrompt:
            `1. **Translation of Request:** What was Norway's GDP from 2010-2020?
2. **Interpretation of the Request:** The request is likely about obtaining data on Norway's Gross Domestic Product (GDP) for the years 2010 to 2020. The user is interested in understanding the economic performance of Norway over this specific period.
3. **Possible Interpretations:** The request could also imply a desire for insights into trends in GDP, such as growth rates, comparisons to other countries, or the impact of specific events (like the COVID-19 pandemic) on GDP during these years.
4. **Understanding of Timeframe:** The user explicitly refers to the years 2010 to 2020. This timeframe is clear and does not require further interpretation.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be \\"economy\\" and \\"national accounts,\\" specifically focusing on GDP.
6. **Potential Relevant Keywords:** GDP, Gross Domestic Product, Norway, economic growth, national accounts, economic performance, 2010-2020."`,
        expectedCorrectTables: ['14483'],
        selectionBenchmarks: [
            {
                tableId: '14483',
                parameters: {
                    ContentsCode: ['Arbeidsledige'],
                    Kjonn: ['0'],
                    Justering: ['S'],
                    Tid: ['2024K1', '2024K2', '2024K3', '2024K4'],
                }
            }
        ]
    },
    {
        userPrompt: 'Hva er sykefraværsprosenten for fulltidsansatte menn i industri?',
        difficulty: 'medium',
        reasoningPrompt:
            `1. **Translation of Request:** What was Norway's GDP from 2010-2020?
2. **Interpretation of the Request:** The request is likely about obtaining data on Norway's Gross Domestic Product (GDP) for the years 2010 to 2020. The user is interested in understanding the economic performance of Norway over this specific period.
3. **Possible Interpretations:** The request could also imply a desire for insights into trends in GDP, such as growth rates, comparisons to other countries, or the impact of specific events (like the COVID-19 pandemic) on GDP during these years.
4. **Understanding of Timeframe:** The user explicitly refers to the years 2010 to 2020. This timeframe is clear and does not require further interpretation.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be \\"economy\\" and \\"national accounts,\\" specifically focusing on GDP.
6. **Potential Relevant Keywords:** GDP, Gross Domestic Product, Norway, economic growth, national accounts, economic performance, 2010-2020."`,
        expectedCorrectTables: ['13935'],
        technicallyCorrectTables: ['13760'],
        selectionBenchmarks: [
            {
                tableId: '13935',
                parameters: {
                    ContentsCode: ['SykefravProsent'],
                    NACE2007: ['C'],
                    Kjonn: ['1'],
                    Justering: ['S'],
                    Tid: ['2024K4'],
                }
            }
        ]
    },
    {
        userPrompt: 'Utviklingen i antall ledige stillinger i undervisning i 2024',
        difficulty: 'hard',
        reasoningPrompt:
            `1. **Translation of Request:** What was Norway's GDP from 2010-2020?
2. **Interpretation of the Request:** The request is likely about obtaining data on Norway's Gross Domestic Product (GDP) for the years 2010 to 2020. The user is interested in understanding the economic performance of Norway over this specific period.
3. **Possible Interpretations:** The request could also imply a desire for insights into trends in GDP, such as growth rates, comparisons to other countries, or the impact of specific events (like the COVID-19 pandemic) on GDP during these years.
4. **Understanding of Timeframe:** The user explicitly refers to the years 2010 to 2020. This timeframe is clear and does not require further interpretation.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be \\"economy\\" and \\"national accounts,\\" specifically focusing on GDP.
6. **Potential Relevant Keywords:** GDP, Gross Domestic Product, Norway, economic growth, national accounts, economic performance, 2010-2020."`,
        expectedCorrectTables: ['14306'],
        selectionBenchmarks: [
            {
                tableId: '14306',
                parameters: {
                    ContentsCode: ['LedigeStillinger'],
                    NACE2007: ['85'],
                    Tid: ['2024K1', '2024K2', '2024K3', '2024K4'],
                }
            }
        ]
    },


]