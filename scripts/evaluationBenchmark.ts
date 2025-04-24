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

export const evaluationBenchmark: EvaluationBenchmark[] = [
    {
        userPrompt: 'Hva var befolkningstallet i Norge i 2022?', // Befolkning
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
        userPrompt: 'Hvor mange het Trygve til fornavn i 2024?', // Befolkning
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
        userPrompt: 'Hva var Norges BNP fra 2010-2020?', // Nasjonalregnskap
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
                    Makrost: ['bnpb.nr23_9'],
                    ContentsCode: ['BNP'],
                    Tid: timeArrayGenerator(2010, 2020),
                }
            }
        ]
    },
    {
        userPrompt: 'Gi meg antall pasienter på sykehus i 2023', // Helse
        difficulty: 'medium',
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
        userPrompt: 'Vis meg utviklingen i elektrisitetspriser for husholdningene fra 2015-2020', // Energi og industri
        difficulty: 'medium',
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
    { // Arbeid og lønn
        userPrompt: 'Vis meg sesongjusterte tall for arbeidsledighet for alle aldre fra 2024',
        difficulty: 'easy',
        expectedCorrectTables: ['14483'],
        technicallyCorrectTables: ['13760'],
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
        userPrompt: 'Hvor mye ferk oppalen laks ble eksportert mellom i 2004 mellom uke 6 og 30?', // Utenrikshandel
        difficulty: 'medium',
        expectedCorrectTables: ['03024'],
        selectionBenchmarks: [
            {
                tableId: '03024',
                parameters: {
                    VareGrupper2: ['01'],
                    ContentsCode: ['Vekt'],
                    Tid: timeArrayGenerator(2004, 2004, { start: 6, end: 30, interval: 1, prefix: 'U' }),
                }
            }
        ]
    },
    {
        userPrompt: 'Hva var Hærens totale utgifter og lønnskostnader i 2010?',
        difficulty: 'hard',
        expectedCorrectTables: ['08354'],
        selectionBenchmarks: [
            {
                tableId: '08354',
                parameters: {
                    Tjenesteomrade: ['01'],
                    ContentsCode: ['Lonn', 'Totalut'],
                    Tid: ['2010'],
                }
            }
        ]
    },
    {
        userPrompt: 'Hva er det vernede landarealet i Svalbard i 2024?',
        difficulty: 'medium',
        expectedCorrectTables: ['08936'],
        selectionBenchmarks: [
            {
                tableId: '08936',
                parameters: {
                    Region: ['21'],
                    ContentsCode: ['VernetAreal'],
                    Tid: ['2024'],
                }
            }
        ]
    },
    {
        userPrompt: 'Hvor mye sprit, øl og vin ble solgt i det 20. århundret?',
        difficulty: 'hard',
        expectedCorrectTables: ['04188'],
        selectionBenchmarks: [
            {
                tableId: '04188',
                parameters: {
                    Alkohol: ['01', '02', '03'],
                    ContentsCode: ['ForbrukVareliter'],
                    Tid: timeArrayGenerator(1900, 1999),
                }
            }
        ]
    }
    // {
    //     userPrompt: 'Gi meg kvartalsvise tall for verdipapirfond de siste åtte kvartalene.', // Bank og finansmarked
    //     difficulty: 'medium',
    //     expectedCorrectTables: ['09470'],
    //     technicallyCorrectTables: ['09446'],
    //     selectionBenchmarks: [
    //         {
    //             tableId: '09470',
    //             parameters: {
    //                 ContentsCode: ['Markedsverdi'],
    //                 Utstedersektor: ['4300'],
    //                 Finansobjekt5: ['560'],
    //                 Tid: timeArrayGenerator(2023, 2024, { start: 1, end: 4, interval: 1, prefix: 'K' }),
    //             }
    //         }
    //     ]
    // },
    // { // Bank og finansmarked
    //     userPrompt: 'Hent ut renteutviklingen i banker og kredittforetak for de siste fem årene for nedbetalingslån?',
    //     difficulty: 'medium',
    //     expectedCorrectTables: ['10738'],
    //     technicallyCorrectTables: ['10729'],
    //     selectionBenchmarks: [
    //         {
    //             tableId: '10738',
    //             parameters: {
    //                 ContentsCode: ['RenterNyeNedBet'],
    //                 Utlanstype: ['02'],
    //                 Tid: timeArrayGenerator(2018, 2023, { start: 1, end: 12, interval: 1, prefix: 'M' }),
    //             }
    //         }
    //     ]
    // },
    // { // Arbeid og lønn
    //     userPrompt: 'Hva er sykefraværsprosenten for fulltidsansatte menn i industri?',
    //     difficulty: 'medium',
    //     expectedCorrectTables: ['13935'],
    //     technicallyCorrectTables: ['13760', '12441', '12442'],
    //     selectionBenchmarks: [
    //         {
    //             tableId: '13935',
    //             parameters: {
    //                 ContentsCode: ['SykefravProsent'],
    //                 NACE2007: ['C'],
    //                 Kjonn: ['1'],
    //                 Justering: ['S'],
    //                 Tid: ['2024K4'],
    //             }
    //         }
    //     ]
    // },
    // { // Arbeid og lønn
    //     userPrompt: 'Utviklingen i antall ledige stillinger i undervisning i 2024',
    //     difficulty: 'hard',
    //     expectedCorrectTables: ['14306'],
    //     selectionBenchmarks: [
    //         {
    //             tableId: '14306',
    //             parameters: {
    //                 ContentsCode: ['LedigeStillinger'],
    //                 NACE2007: ['85'],
    //                 Tid: ['2024K1', '2024K2', '2024K3', '2024K4'],
    //             }
    //         }
    //     ]
    // },
    
]