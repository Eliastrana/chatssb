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
        ModelType.GeminiFlash2Lite,
        //modelInitializer(ModelType.GeminiFlash2Lite, sendLog),
        //modelInitializer(ModelType.Llama3_1_8b, sendLog),
    ]
    
    const numFolderNavigation = { start: 3, end: 2, step: 1 };
    const numKeywordSearch = { start: 3, end: 3, step: 1 };
    
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
    
    for (const config of configurations) {
        
        const model = await modelInitializer(
            config.model,
            sendLog,
            tokenUsage,
        );
        
        console.log(`Testing configuration: ${JSON.stringify(config, null, 0).replace(/\n/g, '')}`);
        
        for (const benchmark of evaluationBenchmark) {
            let result;
            
            let prompt = `${benchmark.userPrompt}\nDate: 6 Jul 2024`;
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
                
                result = table.id;
            } catch (e) {
                result = 'error';
            }
            const queryTime = Date.now() - startTime;
            
            console.log(`Prompt: ${benchmark.userPrompt}, Result: ${result}, Time: ${queryTime}ms, Total token usage: ${tokenUsage.totalTokens}`);

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
                    tableId: result,
                    milliseconds: queryTime,
                    tokenUsage: tokenUsage,
                });
            } else if (existingConfig) {
                existingConfig.benchmarkAnswers.push({
                    userPrompt: benchmark.userPrompt,
                    responses: [{
                        tableId: result,
                        milliseconds: queryTime,
                        tokenUsage: tokenUsage,
                    }],
                });
            } else {
                answers.configurations.push({
                    navigationConfiguration: config,
                    benchmarkAnswers: [{
                        userPrompt: benchmark.userPrompt,
                        responses: [{
                            tableId: result,
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
            })

            tokenUsage.completionTokens = 0;
            tokenUsage.promptTokens = 0;
            tokenUsage.totalTokens = 0;
        }
    }
}

run()