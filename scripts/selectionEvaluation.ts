import {evaluationBenchmark} from "./evaluationBenchmark";
import {ModelType, PxWebData, ServerLog, SSBTableMetadata} from "@/app/types";
import {modelInitializer} from "@/app/services/modelInitializer";
import 'dotenv/config';
import {
    SelectionAnswers,
    SelectionConfiguration,
    SelectionParameters
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

    const reasoning: [false] | [true] | [false, true] = [false];

    for (const model of models) {
        for (const isReasoning of reasoning) {
            configurations.push({
                model: model,
                selectionTechnique: 'expression',
                reasoning: isReasoning,
            });
            configurations.push({
                model: model,
                selectionTechnique: 'enum',
                reasoning: isReasoning,
            });
            configurations.push({
                model: model,
                selectionTechnique: 'redundant',
                reasoning: isReasoning,
            });
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
                let result: SelectionParameters;

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

                    console.log(`SSBGetUrl: ${SSBGetUrl}`);
                    const responseTableData = await fetch(SSBGetUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        }
                    });
                    
                    if (!responseTableData.ok) {
                        throw new Error(`Failed to fetch table data: ${responseTableData.statusText}`);
                    }
                    
                    const data = (await responseTableData.json()) as PxWebData;
                    
                    result = {
                        tableId: selectionBenchmark.tableId,
                        parameters: {}
                    }
                    
                    for (const dimensionKey in data.dimension) {
                        result.parameters[dimensionKey] = [];
                        for (const variableKey of Object.keys(data.dimension[dimensionKey].category.label)) {
                            result.parameters[dimensionKey].push(variableKey);
                        }
                    }
                } catch (e) {
                    result = {
                        tableId: 'error',
                        parameters: {},
                        errorUrl: SSBGetUrl
                    };
                }
                const queryTime = Date.now() - startTime;

                console.log(`Prompt: ${benchmark.userPrompt}, Result: ${JSON.stringify(result)}, Time: ${queryTime}ms, Total token usage: ${tokenUsage.totalTokens}`);

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