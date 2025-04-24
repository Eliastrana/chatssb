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


// 1 juni 2024 er datoen brukt for testning
export const evaluationBenchmark: EvaluationBenchmark[] = [
    {
        userPrompt: 'Hva var befolkningstallet i Norge i 2022?', // Befolkning
        reasoningPrompt: 
`1. **Translation of Request:** What was the population number in Norway in 2022?
2. **Interpretation of the Request:** The request is likely about obtaining the total population figure for Norway for the year 2022. The user is interested in demographic statistics.
3. **Possible Interpretations:** The request could also imply an interest in trends over time, such as how the population has changed from previous years or projections for future years. Additionally, the user might be interested in specific demographic breakdowns (e.g., age, gender, region).
4. **Understanding of Timeframe:** The user is explicitly asking for data from the year 2022.
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
        reasoningPrompt:
`1. **Translation of Request:** How many people had the first name Trygve in 2024?
2. **Interpretation of the Request:** The request is likely about the total number of people currently named Trygve in the year 2024. The user is interested in name statistics, specifically focusing on the popularity or frequency of this particular name.
3. **Possible Interpretations:** The request could also be interpreted in a few ways:
   - The user might be interested in the trend of the name Trygve over several years, not just 2024.
   - The user could be asking for a comparison of the name Trygve with other names in 2024.
   - The user might want to know the total number of people born with the name Trygve in 2024, rather than the total number of people currently named Trygve.
4. **Understanding of Timeframe:** The user explicitly refers to the year 2024. The user is looking for data that is already available for the year 2024.
5. **Suggested Themes/Categories:** The relevant statistical domains for this request would include:
   - Population statistics
   - Name statistics (specifically first names)
   - Demographic trends
6. **Potential Relevant Keywords:** 
   - Trygve
   - First names
   - Name statistics
   - Popularity of names
   - Demographics"`,
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
                    ContentsCode: ['Priser'],
                    Tid: timeArrayGenerator(2010, 2020),
                }
            }
        ]
    },
    {
        userPrompt: 'Gi meg antall pasienter på sykehus i 2023', // Helse
        reasoningPrompt:
`1. **Translation of Request:** \\"Give me the number of patients in hospitals in 2023.\\"
2. **Interpretation of the Request:** The user is asking for the total number of patients who were admitted to hospitals in Norway during the year 2023. 
3. **Possible Interpretations:** The request could also be interpreted in several ways:
   - The user might be interested in the number of patients at a specific type of hospital (e.g., general hospitals, specialized hospitals).
   - The user could be looking for data on hospital admissions versus total patients present at hospitals at any given time.
   - The request might also pertain to specific demographics, such as age groups or types of illnesses.
4. **Understanding of Timeframe:** The user is explicitly referring to the year 2023.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be:
   - Health
   - Hospital services
   - Patient statistics
6. **Potential Relevant Keywords:** 
   - hospital patients
   - patient admissions
   - hospital statistics 2023
   - healthcare data
   - Norwegian hospitals
   - patient numbers`,
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
        userPrompt: 'Vis meg utviklingen i elektrisitetspriser uten strømstøtte for husholdningene fra 2015-2020', // Energi og industri
        reasoningPrompt:
`1. **Translation of Request:** Show me the development of electricity prices without electricity support for households from 2015-2020.
2. **Interpretation of the Request:** The user is asking for data on how electricity prices for households in Norway have changed over the period from 2015 to 2020, specifically excluding any government support or subsidies that may have affected these prices.
3. **Possible Interpretations:** 
   - The user may be interested in a comparison of electricity prices with and without support.
   - They might also be looking for trends or patterns in electricity pricing over the specified years.
   - The request could imply an interest in understanding the impact of market conditions on electricity prices during that timeframe.
4. **Understanding of Timeframe:** The user explicitly refers to the years 2015 to 2020.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be:
   - Energy
   - Economy
   - Household expenditures
6. **Potential Relevant Keywords:** 
   - Electricity prices
   - Household electricity costs
   - Energy support schemes
   - Price development
   - Norway electricity market
   - Historical electricity prices`,
        difficulty: 'medium',
        expectedCorrectTables: ['09007'],
        technicallyCorrectTables: ['09367'],
        selectionBenchmarks: [
            {
                tableId: '09007',
                parameters: {
                    ContentsCode: ['KraftOgNettIAUStrSt'],
                    Tid: timeArrayGenerator(2015, 2020),
                }
            }
        ]
    },
    { // Arbeid og lønn
        userPrompt: 'Vis meg sesongjusterte antall og prosentandel for arbeidsledighet for alle aldre fra i 2023',
        reasoningPrompt:
`1. **Translation of Request:** \\"Show me seasonally adjusted numbers and percentages for unemployment for all ages from 2023.\\"
2. **Interpretation of the Request:** The user is asking for statistics related to unemployment rates in Norway, specifically focusing on seasonally adjusted figures and percentages for all age groups, with a particular interest in data from the year 2023.
3. **Possible Interpretations:** The request could also imply a need for comparisons with previous years, trends over the year 2023, or specific months within that year. The user might be interested in how unemployment rates have changed seasonally or how they compare to other demographic factors.
4. **Understanding of Timeframe:** The user is explicitly referring to the year 2023. The user may be looking for finalized data for the entirety of 2023 or specific quarterly data from that year.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be \\"labor\\" (specifically unemployment statistics) and possibly \\"economy\\" if the user is interested in broader economic implications of unemployment.
6. **Potential Relevant Keywords:** 
   - Unemployment
   - Seasonally adjusted
   - Unemployment rate
   - All ages
   - 2023
   - Labor market statistics
   - Employment statistics`,
        difficulty: 'easy',
        expectedCorrectTables: ['14483', '13760'],
        selectionBenchmarks: [
            {
                tableId: '14483',
                parameters: {
                    ContentsCode: ['Arbeidsledige', 'ArbledProsArbstyrk'],
                    Justering: ['S'],
                    Tid: timeArrayGenerator(2023, 2023, { start: 1, end: 4, interval: 1, prefix: 'K' }),
                }
            }
        ]
    },
    {
        userPrompt: 'Hvor mye ferk oppalen laks ble eksportert mellom i 2004 mellom uke 6 og 30?', // Utenrikshandel
        reasoningPrompt:
`1. **Translation of Request:** How much farmed salmon was exported between week 6 and week 30 in 2004?
2. **Interpretation of the Request:** The request is likely about the export volume of farmed salmon from Norway during a specific time frame in 2004. The user is interested in understanding the quantity of salmon that was exported during those weeks.
3. **Possible Interpretations:** The user may also be interested in:
   - The value of the exported salmon, not just the volume.
   - Comparisons with other years or weeks.
   - Trends in salmon exports over time.
4. **Understanding of Timeframe:** The user is explicitly referring to the year 2004 and the weeks 6 to 30. Week 6 typically falls in early February, and week 30 would be in late July. Therefore, the timeframe is from early February 2004 to late July 2004.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be:
   - Economy (specifically related to exports)
   - Agriculture/Fisheries (specifically aquaculture)
6. **Potential Relevant Keywords:** 
   - farmed salmon export 2004
   - salmon export volume
   - Norwegian salmon export statistics
   - aquaculture export data
   - weekly export statistics`,     
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
        reasoningPrompt:
`1. **Translation of Request:** What were the Army's total expenses and salary costs in 2010?
2. **Interpretation of the Request:** The request is likely about the financial data related to the Norwegian Army, specifically focusing on total expenditures and salary costs for the year 2010.
3. **Possible Interpretations:** The user may also be interested in understanding how these costs compare to other years, or they might be looking for trends in military spending over time. Additionally, they could be interested in the breakdown of these costs (e.g., operational costs vs. personnel costs).
4. **Understanding of Timeframe:** The user explicitly refers to the year 2010, which is a specific timeframe. There are no relative expressions that would suggest a different period.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would be “defense spending,” “government expenditures,” and “public sector salaries.”
6. **Potential Relevant Keywords:** Keywords that could be useful for searching in SSB’s database include \\"military expenditures,\\" \\"defense budget,\\" \\"salary costs,\\" \\"Hæren,\\" \\"total expenses,\\" and \\"2010.\\"`,
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
        reasoningPrompt:
`1. **Translation of Request:** What is the protected land area in Svalbard in 2024?
2. **Interpretation of the Request:** The user is inquiring about the specific area of land in Svalbard that is designated as protected in the year 2024. This likely pertains to conservation areas, national parks, or other forms of land protection.
3. **Possible Interpretations:** The request could also be interpreted in several ways:
   - The user might be interested in the total area of protected land specifically in Svalbard, or they could be looking for a breakdown of different types of protected areas (e.g., national parks, nature reserves).
   - The user may want to know how this area compares to previous years or future projections.
4. **Understanding of Timeframe:** The user is asking for data specifically for the year 2024.
5. **Suggested Themes/Categories:** The relevant statistical domains for this request would include:
   - Environment
   - Land use
   - Conservation
6. **Potential Relevant Keywords:** 
   - Protected land area
   - Svalbard
   - Conservation areas
   - National parks
   - Nature reserves
   - Land use statistics
   - Environmental statistics`,
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
        reasoningPrompt:
`1. **Translation of Request:** How much spirits, beer, and wine were sold in the 20th century?
2. **Interpretation of the Request:** The request is likely about the total sales figures for alcoholic beverages (spirits, beer, and wine) in Norway during the 20th century. The user is interested in understanding the consumption trends or sales volumes of these beverages over that specific time period.
3. **Possible Interpretations:** The request could also be interpreted in several ways:
   - The user might be looking for annual sales data rather than total sales for the entire century.
   - They could be interested in comparing the sales of different types of alcoholic beverages (spirits vs. beer vs. wine).
   - The user may want to know about the impact of specific events (like prohibition or changes in laws) on alcohol sales during that time.
4. **Understanding of Timeframe:** The timeframe explicitly mentioned is the 20th century, which spans from 1901 to 2000. The user is likely interested in data covering this entire period.
5. **Suggested Themes/Categories:** The most relevant statistical domains for this request would include:
   - Economy (specifically related to sales and consumption)
   - Health (considering the implications of alcohol consumption)
   - Social statistics (to understand cultural aspects of alcohol consumption)
6. **Potential Relevant Keywords:** 
   - Alcohol sales
   - Spirits consumption
   - Beer sales statistics
   - Wine sales data
   - 20th century alcohol consumption
   - Norwegian alcohol statistics
   - Historical beverage sales`,
        difficulty: 'hard',
        expectedCorrectTables: ['04188'],
        selectionBenchmarks: [
            {
                tableId: '04188',
                parameters: {
                    Alkohol: ['01', '02', '03'],
                    ContentsCode: ['ForbrukVareliter'],
                    Tid: timeArrayGenerator(1901, 2000),
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