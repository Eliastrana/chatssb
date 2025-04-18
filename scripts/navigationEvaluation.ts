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
};

async function run() {
    console.log('Running navigation evaluation script...');
    
    // Setuo configurations
    const models = [
        ModelType.GPT4oMini,
        //modelInitializer(ModelType.GeminiFlash2Lite, sendLog),
        //modelInitializer(ModelType.Llama3_1_8b, sendLog),
    ]
    
    const numFolderNavigation = { start: 1, end: 1, step: 1 };
    const numKeywordSearch = { start: 1, end: 1, step: 1 };
    
    const configurations: NavigationConfiguration[] = []
    
    for (const model of models) {
        for (let i = numFolderNavigation.start; i <= numFolderNavigation.end; i += numFolderNavigation.step) {
            configurations.push({
                model: model,
                navigationTechnique: 'folderNavigation',
                navigationValue: i,
                reasoning: false,
            });
        }
        
        for (let i = numKeywordSearch.start; i <= numKeywordSearch.end; i += numKeywordSearch.step) {
            configurations.push({
                model: model,
                navigationTechnique: 'keywordSearch',
                navigationValue: i,
                reasoning: false,
            });
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
            configBenchmarkPairs: []
        };
    }
    
    for (const config of configurations) {
        const model = await modelInitializer(config.model, sendLog);
        console.log(`Testing configuration: ${JSON.stringify(config, null, 0).replace(/\n/g, '')}`);
        
        for (const benchmark of evaluationBenchmark.slice(-1)) {
            let result;
            
            const startTime = Date.now();
            try {
                const table = config.navigationTechnique === 'folderNavigation' ?
                    await folderNavigationToTableId(
                    model,
                    benchmark.userPrompt,
                    config.navigationValue,
                    sendLog
                ) :
                    await keywordSearchToTableId(
                    model,
                    benchmark.userPrompt,
                    config.navigationValue,
                    sendLog
                );
                
                result = table.id;
            } catch (e) {
                result = 'error';
            }
            const queryTime = Date.now() - startTime;
            
            console.log(`Prompt: ${benchmark.userPrompt}, Result: ${result}, Time: ${queryTime}ms`);

            // If this configuration and benchmark already exists, add the result to the
            // existing list.
            const existingAnswer = answers.configBenchmarkPairs.find(a =>
                _.isEqual(a.configuration, config) &&
                a.answers.benchmark.userPrompt === benchmark.userPrompt
            );

            if (existingAnswer) {
                existingAnswer.answers.responses.push({
                    tableId: result,
                    milliseconds: queryTime
                });
            } else {
                answers.configBenchmarkPairs.push({
                    configuration: config,
                    answers: {
                        benchmark: benchmark,
                        responses: [{
                            tableId: result,
                            milliseconds: queryTime,
                        }],
                    }
                })
            }
            
            fs.writeFileSync(filePath, JSON.stringify(answers, null, 2), 'utf-8', (err: any) => {
                if (err) {
                    console.error('Error writing file:', err);
                } else {
                    console.log('File written successfully');
                }
            });
        }
    }
}

run()