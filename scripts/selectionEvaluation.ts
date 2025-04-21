import {evaluationBenchmark} from "./evaluationBenchmark";
import {ModelType, PxWebData, ServerLog, SSBTableMetadata} from "@/app/types";
import {modelInitializer} from "@/app/services/modelInitializer";
import 'dotenv/config';
import {
    SelectionAnswers,
    SelectionConfiguration,
    SelectionEvaluationParameters
} from "@/scripts/evaluationTypes";
import _ from "lodash";
import {parsingRunnableRetryWrapper} from "@/app/services/parsingRunnableRetryWrapper";
import {expressionSingle} from "@/app/services/selection/runnables/expressionSingle";
import {enumSingle} from "@/app/services/selection/runnables/enumSingle";
import {redundantSingle} from "@/app/services/selection/runnables/redundantSingle";
import {expressionSingleToURL} from "@/app/services/selection/utils/expressionSingleToURL";
import {enumSingleToURL} from "@/app/services/selection/utils/enumSingleToURL";
import {redundantSingleToURL} from "@/app/services/selection/utils/redundantSingleToURL";

const sendLog = (log: ServerLog) => {
    if (log.eventType === 'tokens') {
        //console.log(`Token usage: ${JSON.stringify(log.content)}`);
    }
};

async function run() {
    console.log('Running selection evaluation script...');

    // Setup configurations
    const models = [
        ModelType.GeminiFlash2Lite,
        //modelInitializer(ModelType.GeminiFlash2Lite, sendLog),
        //modelInitializer(ModelType.Llama3_1_8b, sendLog),
    ];

    const configurations: SelectionConfiguration[] = [];
    
    const selectionTechniques = {
        expression: false,
        enum: false,
        redundant: true,
    }
    const reasoning: [false] | [true] | [false, true] = [false];

    for (const model of models) {
        for (const isReasoning of reasoning) {
            if (selectionTechniques.expression) {
                configurations.push({
                    model: model,
                    selectionTechnique: 'expression',
                    reasoning: isReasoning,
                });
            }
            if (selectionTechniques.enum) {
                configurations.push({
                    model: model,
                    selectionTechnique: 'enum',
                    reasoning: isReasoning,
                });
            }
            if (selectionTechniques.redundant) {
                configurations.push({
                    model: model,
                    selectionTechnique: 'redundant',
                    reasoning: isReasoning,
                });
            }
        }
    }

    // Sort configurations by model and selectionTechnique
    configurations.sort((a, b) => {
        if (a.model !== b.model) {
            return a.model.localeCompare(b.model);
        }
        return a.selectionTechnique.localeCompare(b.selectionTechnique);
    });

    console.log(`All configurations\n${JSON.stringify(configurations, null, 2)}`);

    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'selectionAnswers.json');

    let answers: SelectionAnswers;

    if (fs.existsSync(filePath)) {
        answers = require(filePath) as SelectionAnswers;
    } else {
        console.warn(`File not found: ${filePath}\nFile will be created.`);
        answers = {
            configurations: []
        };
    }
    
    const tokenUsage = {
        completionTokens: 0,
        promptTokens: 0,
        totalTokens: 0
    };
    
    for (const config of configurations) {


        const model = await modelInitializer(
            config.model,
            sendLog,
            tokenUsage,
        );

        console.log(`Testing configuration: ${JSON.stringify(config, null, 0).replace(/\n/g, '')}`);

        for (const benchmark of evaluationBenchmark) {
            if (!benchmark.selectionBenchmarks) continue;

            let prompt = `${benchmark.userPrompt}\nDate: 6 Jul 2024`;
            prompt += config.reasoning ? `\n${benchmark.reasoningPrompt}` : '';

            for (const selectionBenchmark of benchmark.selectionBenchmarks) {
                let result: SelectionEvaluationParameters;

                const response = await fetch(`https://data.ssb.no/api/pxwebapi/v2-beta/tables/${selectionBenchmark.tableId}/metadata?lang=en&outputFormat=json-stat2`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                const tableMetadata = (await response.json()) as SSBTableMetadata;
                
                let SSBGetUrl = `https://data.ssb.no/api/pxwebapi/v2-beta/tables/${selectionBenchmark.tableId}/data?lang=no&format=json-stat2`;

                const startTime = Date.now();
                try {
                    
                    if (config.selectionTechnique === 'expression') {
                        const parameters = await parsingRunnableRetryWrapper(
                            model,
                            prompt,
                            expressionSingle(tableMetadata)
                        )
                        
                        SSBGetUrl = expressionSingleToURL(
                            parameters,
                            SSBGetUrl,
                        )
                    } else if (config.selectionTechnique === 'enum') {
                        const parameters = await parsingRunnableRetryWrapper(
                            model,
                            prompt,
                            enumSingle(tableMetadata)
                        )
                        
                        SSBGetUrl = enumSingleToURL(
                            parameters,
                            SSBGetUrl,
                        )
                    } else if (config.selectionTechnique === 'redundant') {
                        const parameters = await parsingRunnableRetryWrapper(
                            model,
                            prompt,
                            redundantSingle(tableMetadata)
                        )
                        
                        SSBGetUrl = redundantSingleToURL(
                            parameters,
                            SSBGetUrl,
                            tableMetadata,
                            sendLog
                        )
                    }

                    //console.log(`SSBGetUrl: ${SSBGetUrl}`);
                    
                    const responseTableData = await fetch(SSBGetUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        }
                    });
                    
                    if (!responseTableData.ok) {
                        throw new Error(`Failed to fetch table data: ${responseTableData.statusText}`);
                    }
                    
                    const selection = (await responseTableData.json()) as PxWebData;
                    
                    result = {
                        tableId: selectionBenchmark.tableId,
                        parameters: {},
                        url: SSBGetUrl
                    }

                    // Check the selected values
                    for (const dimensionKey in selection.dimension) {
                        const selectedValues = Object.keys(selection.dimension[dimensionKey].category.label);

                        const correctBenchmarkValues = selectionBenchmark.parameters[dimensionKey] || [];
                        const correctSelectedValues = correctBenchmarkValues.filter(key => selectedValues.includes(key)).length;
                        
                        result.parameters[dimensionKey] = {
                            correctValues: correctSelectedValues,
                            extraValues: selectedValues.length - correctSelectedValues,
                            missingValues: correctBenchmarkValues.length - correctSelectedValues,
                        };
                    }

                    // Add missing dimensions from the benchmark
                    for (const key of Object.keys(selectionBenchmark.parameters)) {
                        if (!result.parameters[key]) {
                            result.parameters[key] = {
                                correctValues: 0,
                                extraValues: 0,
                                missingValues: selectionBenchmark.parameters[key].length,
                            };
                        }
                    }
                } catch (e) {
                    const error = e as Error;
                    console.error(error.message);
                    
                    result = {
                        tableId: 'error',
                        parameters: {},
                        url: SSBGetUrl,
                    };
                }
                
                const queryTime = Date.now() - startTime;

                const logResult = {
                    tableId: result.tableId,
                    parameters: result.parameters,
                };
                    
                console.log(`Prompt: ${benchmark.userPrompt}, Result: ${JSON.stringify(logResult)}, Time: ${queryTime}ms, Total token usage: ${tokenUsage.totalTokens}`);

                // If this configuration and benchmark already exists, add the result to the existing list.
                const existingConfig = answers.configurations.find(configuration =>
                    _.isEqual(configuration.selectionConfiguration, config),
                );
                
                const existingAnswer = existingConfig?.benchmarkAnswers.find(answer =>
                    answer.userPrompt === benchmark.userPrompt,
                );
                
                if (existingAnswer) {
                    existingAnswer.responses.push({
                        selectedParameters: result,
                        milliseconds: queryTime,
                        tokenUsage: tokenUsage,
                    });
                } else if (existingConfig) {
                    existingConfig.benchmarkAnswers.push({
                        userPrompt: benchmark.userPrompt,
                        responses: [{
                            selectedParameters: result,
                            milliseconds: queryTime,
                            tokenUsage: tokenUsage,
                        }],
                    });
                } else {
                    answers.configurations.push({
                        selectionConfiguration: config,
                        benchmarkAnswers: [{
                            userPrompt: benchmark.userPrompt,
                            responses: [{
                                selectedParameters: result,
                                milliseconds: queryTime,
                                tokenUsage: tokenUsage,
                            }],
                        }]
                    })
                }
                
                fs.writeFileSync(filePath, JSON.stringify(answers, null, 2), 'utf-8', (err: any) => {
                    if (err) {
                        console.error('Error writing file:', err);
                    } else {
                        console.log('File written successfully');
                    }
                });

                tokenUsage.completionTokens = 0;
                tokenUsage.promptTokens = 0;
                tokenUsage.totalTokens = 0;
            }
        }
    }
}

run();