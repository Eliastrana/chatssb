import {evaluationBenchmark} from "./evaluationBenchmark";
import {ModelType, ServerLog} from "@/app/types";
import {modelInitializer} from "@/app/services/modelInitializer";
import 'dotenv/config'
import {folderNavigationToTableId} from "@/app/services/navigation/folderNavigationToTableId";
import {keywordSearchToTableId} from "@/app/services/navigation/keywordSearchToTableId";
import {NavigationAnswers, NavigationConfiguration} from "@/scripts/evaluationTypes";
import _ from "lodash";

const sendLog = (log: ServerLog) => {
    //console.log(log.content)
    if (log.eventType === 'tokens') {
        //console.log(`Token usage: ${JSON.stringify(log.content)}`);
    }
};

async function run() {
    console.log('Running navigation evaluation script...');
    
    // Setuo configurations
    const models = [
        ModelType.GPT4_1Nano,
        ModelType.GPT4_1Mini,
    ]
    
    const numFolderNavigation = { start: 1, end: 5, step: 2 };
    const numKeywordSearch = { start: 1, end: 5, step: 2 };
    
    // Reasoning can only be one of these three
    // [false], [true], [false, true]
    const reasoning: [false] | [true] | [false, true] = [true];
    
    const configurations: NavigationConfiguration[] = [];
    
    for (const model of models) {
        for (const isReasoning of reasoning) {
            for (let i = numFolderNavigation.start; i <= numFolderNavigation.end; i += numFolderNavigation.step) {
                configurations.push({
                    model: model,
                    navigationTechnique: 'folderNavigation',
                    navigationValue: i,
                    reasoning: isReasoning,
                });
            }

            for (let i = numKeywordSearch.start; i <= numKeywordSearch.end; i += numKeywordSearch.step) {
                configurations.push({
                    model: model,
                    navigationTechnique: 'keywordSearch',
                    navigationValue: i,
                    reasoning: isReasoning,
                });
            }
        }
    }
    
    // sort by models, then by navigationTechnique, then by navigationValue
    configurations.sort((a, b) => {
        if (a.model !== b.model) {
            return a.model.localeCompare(b.model);
        }
        if (a.navigationTechnique !== b.navigationTechnique) {
            return a.navigationTechnique.localeCompare(b.navigationTechnique);
        }
        return a.navigationValue - b.navigationValue;
    });

    console.log(`All configurations\n${JSON.stringify(configurations, null, 2)}`);
    
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'navigationAnswers.json');

    let answers: NavigationAnswers;
    
    if (fs.existsSync(filePath)) {
        answers = require(filePath) as NavigationAnswers;
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
    
    const initTime = Date.now();
    
    for (const config of configurations) {
        
        const model = modelInitializer(
            config.model,
            sendLog,
            tokenUsage,
        );

        const elapsedTime = Date.now() - initTime;
        const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
        const seconds = Math.floor((elapsedTime / 1000) % 60);

        const remainingConfigs = configurations.length - configurations.indexOf(config) - 1;
        const estimatedTime = Math.floor((elapsedTime / (configurations.indexOf(config) + 1)) * remainingConfigs);
        const remainingHours = Math.floor((estimatedTime / (1000 * 60 * 60)) % 24);
        const remainingMinutes = Math.floor((estimatedTime / (1000 * 60)) % 60);
        const remainingSeconds = Math.floor((estimatedTime / 1000) % 60);

        console.log(`Elapsed time: ${hours}h ${minutes}m ${seconds}s | Estimated time remaining: ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s | Testing configuration: ${JSON.stringify(config, null, 0).replace(/\n/g, '')}`);
        
        for (const benchmark of evaluationBenchmark) {
            let tableId;
            let errorMessage;
            
            let prompt = `${benchmark.userPrompt}\nDate: 1 Jul 2024`;
            prompt += config.reasoning ? `\n${benchmark.reasoningPrompt}` : '';
            
            const startTime = Date.now();
            try {
                const table = config.navigationTechnique === 'folderNavigation' ?
                    await folderNavigationToTableId(
                    model,
                        prompt,
                    config.navigationValue,
                    sendLog
                ) :
                    await keywordSearchToTableId(
                    model,
                        prompt,
                    config.navigationValue,
                    sendLog
                );
                
                tableId = table.id;
            } catch (e) {
                tableId = 'error';
                errorMessage = (e as Error).message;
            }
            
            const queryTime = Date.now() - startTime;
            
            let result: 'correct' | 'technicallyCorrect' | 'incorrect' | 'error' = 'incorrect';
            if (tableId === 'error') {
                result = 'error';
            } else if (benchmark.expectedCorrectTables.includes(tableId)) {
                result = 'correct';
            } else if (benchmark.technicallyCorrectTables?.includes(tableId)) {
                result = 'technicallyCorrect';
            }

            console.log(`Prompt: ${benchmark.userPrompt}, Id: ${tableId}, Result: ${result}, Time: ${queryTime}ms, Total token usage: ${tokenUsage.totalTokens}`);

            // If this configuration and benchmark already exists, add the result to the
            // existing list.
            
            const existingConfig = answers.configurations.find(configuration =>
                _.isEqual(configuration.navigationConfiguration, config)
            );
            
            const existingAnswer = existingConfig?.benchmarkAnswers.find(answer =>
                answer.userPrompt === benchmark.userPrompt
            );
            
            if (existingAnswer) {
                existingAnswer.responses.push({
                    tableId: tableId,
                    result: result,
                    milliseconds: queryTime,
                    tokenUsage: {
                        completionTokens: tokenUsage.completionTokens,
                        promptTokens: tokenUsage.promptTokens,
                        totalTokens: tokenUsage.totalTokens,
                    },
                    errorMessage: errorMessage,
                });
            } else if (existingConfig) {
                existingConfig.benchmarkAnswers.push({
                    userPrompt: benchmark.userPrompt,
                    responses: [{
                        tableId: tableId,
                        result: result,
                        milliseconds: queryTime,
                        tokenUsage: {
                            completionTokens: tokenUsage.completionTokens,
                            promptTokens: tokenUsage.promptTokens,
                            totalTokens: tokenUsage.totalTokens,
                        },
                        errorMessage: errorMessage,
                    }],
                });
            } else {
                answers.configurations.push({
                    navigationConfiguration: config,
                    benchmarkAnswers: [{
                        userPrompt: benchmark.userPrompt,
                        responses: [{
                            tableId: tableId,
                            result: result,
                            milliseconds: queryTime,
                            tokenUsage: {
                                completionTokens: tokenUsage.completionTokens,
                                promptTokens: tokenUsage.promptTokens,
                                totalTokens: tokenUsage.totalTokens,
                            },
                            errorMessage: errorMessage,
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
            })

            tokenUsage.completionTokens = 0;
            tokenUsage.promptTokens = 0;
            tokenUsage.totalTokens = 0;
        }
    }
}

run()