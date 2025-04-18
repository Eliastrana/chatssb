import {evaluationBenchmark} from "./evaluationBenchmark";
import {ModelType, ServerLog} from "@/app/types";
import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {modelInitializer} from "@/app/services/modelInitializer";
import 'dotenv/config'
import {folderNavigationToTableId} from "@/app/services/navigation/folderNavigationToTableId";
import {keywordSearchToTableId} from "@/app/services/navigation/keywordSearchToTableId";

const sendLog = (log: ServerLog) => {
    //console.log(log.content)
};

async function run() {
    console.log('Running navigation evaluation script...');
    
    const models: BaseChatModel[] = [
        modelInitializer(ModelType.GPT4oMini, sendLog),
        //modelInitializer(ModelType.GeminiFlash2Lite, sendLog),
        //modelInitializer(ModelType.Llama3_1_8b, sendLog),
    ]
    
    const numFolderNavigation = { start: 1, end: 1, step: 1 };
    const numKeywordSearch = { start: 1, end: 1, step: 1 };
    
    const navigationResults = [];
    const keywordResults = [];
    
    for (const model of models) {
        for (const test of evaluationBenchmark) {
            for (let i = numFolderNavigation.start; i <= numFolderNavigation.end; i += numFolderNavigation.step) {
                try {
                    console.log(`Model: ${model.name}, Folder Navigation: ${i}, Prompt: ${test.userPrompt}`);
                    
                    const result = await folderNavigationToTableId(
                        model,
                        test.userPrompt,
                        i,
                        sendLog
                    );
                    
                    navigationResults.push(result.id);
                } catch (e) {
                    //console.error('Error in folder navigation test:', e);
                    navigationResults.push('error');
                }
            }
            
            for (let i = numKeywordSearch.start; i <= numKeywordSearch.end; i += numKeywordSearch.step) {
                try {
                    console.log(`Model: ${model.name}, Keyword Search: ${i}, Prompt: ${test.userPrompt}`);
                    const result = await keywordSearchToTableId(
                        model,
                        test.userPrompt,
                        i,
                        sendLog
                    )
                    
                    keywordResults.push(result.id);
                } catch (e) {
                    keywordResults.push('error');
                }
            }
        }
    }
    
    console.log('Navigation Results:', navigationResults);
    console.log('Keyword Search Results:', keywordResults);
}

run()