import {ZodSchema} from "zod";

export interface CustomMessage {
    sender: 'user' | 'bot';
    text?: string;
    pxData?: PxWebData;
    type?: 'normal' | 'warning' | 'error';
}

export interface Message {
    sender: 'user' | 'bot';
    text: string;
    label?: string;
    underLabel?: string;
    value?: number;
    variables?: Record<string, string>[];
    description?: string;
    tableid?: string;
    unit?: string;
    pxData?: PxWebData;
}

export interface PxWebData {
    label: string;
    extension: {
        px: {
            tableid: string;
        }
        timeUnit: string;
    }
    dimension: {
        [dimName: string]: {
            label: string;
            category: {
                index: Record<string, number>;
                label: Record<string, string>;
                unit: Record<string, { base: string; decimals: number }>;
            };
            totalValues?: number;
        };
    };
    size: number[];
    value: number[];
    role?: {
        time?: string[];
        metric?: string[];
    };
}

export interface SSBTableMetadata {
    label: string;
    note: string[];
    dimension: Record<string, {
        label: string;
        category: {
            label: Record<string, string>;
            unit?: Record<string, { base: string; decimals: number; }>;
        };
        extension: { 
            elimination: boolean; 
            codeLists: {
                id: string;
                label: string;
                type: 'Aggregation' | 'Valueset'
            }[]
        };
    }>;
    extension: {
        px: {
            tableid: string;
        }
    };
}

export interface SSBCodeList {
    id: string;
    label: string;
    values: {
        code: string;
        label: string;
    }[];
}


export interface SSBEntry {
    type: string;
    id: string;
    label: string;
    firstPeriod?: string;
    lastPeriod?: string;
    variableNames?: string[];
    timeUnit?: string;
}

export interface SSBNavigationResponse {
    folderContents: SSBEntry[];
}

export interface SSBSearchResponse {
    tables: SSBEntry[];
}

export interface ServerLog {
    content: string;
    eventType: 'log' | 'nav' | 'tokens' | 'final' | 'error' | 'info';
}

export interface SelectionParamaters {
    itemSelection?: string[];
    selectionExpression?: string[];
    wildcard?: string;
    exactMatch?: string;
    top?: {
        n: number;
        offset?: number;
    };
    bottom?: {
        n: number;
        offset?: number;
    };
    range?: {
        start: string;
        end: string;
    };
    from?: string;
    to?: string;
}

export interface BackendAPIParams {
    userMessage: string;
    dev: boolean;
    reasoning: boolean;
    reasoningModel: ModelType;
    navigationTechnique: NavType;
    navigationModel: ModelType;
    selectionTechnique: SelType;
    selectionModel: ModelType;
    useQAURL: boolean;
}

export enum NavType {
    FolderNavigation_1 = 'folder_navigation_1',
    FolderNavigation_2 = 'folder_navigation_2',
    FolderNavigation_3 = 'folder_navigation_3',
    FolderNavigation_4 = 'folder_navigation_4',
    FolderNavigation_5 = 'folder_navigation_5',
    KeywordSearch_1 = 'keyword_search_1',
    KeywordSearch_2 = 'keyword_search_2',
    KeywordSearch_3 = 'keyword_search_3',
    KeywordSearch_4 = 'keyword_search_4',
    KeywordSearch_5 = 'keyword_search_5',
}

export enum SelType {
    ExpressionSingle = 'expression_single',
    ExpressionMulti = 'expression_multi',
    EnumMulti = 'enum_multi',
    EnumSingle = 'enum_single',
    RedundantSingle = 'redundant_single',
}

export enum ModelType {
    GPT4oMini = 'gpt-4o-mini',
    GPT4_1Nano = 'gpt-4.1-nano-2025-04-14',
    GPT4_1Mini = 'gpt-4.1-mini-2025-04-14',
    GPT4_1 = 'gpt-4.1-2025-04-14',
    GPTo3Mini = 'o3-mini-2025-01-31',
    GPTo4Mini = 'o4-mini-2025-04-16',
    GeminiFlash2Lite = 'gemini-2.0-flash-lite',
    GeminiFlash2 = 'gemini-2.0-flash',
    Gemini2_5ProExp = 'gemini-2.5-pro-exp-03-25',
    Llama3_3_70b = 'llama-3.3-70b-versatile',
    Llama3_1_8b = 'llama-3.1-8b-instant',
    Llama4Maverick = 'meta-llama/llama-4-maverick-17b-128e-instruct',
    Llama4Scout = 'meta-llama/llama-4-scout-17b-16e-instruct',
    DeepseekR1_70b = 'deepseek-r1-distill-llama-70b',
    Qwen_QwQ_32b = 'qwen-qwq-32b'
}

export interface DecoupledRunnable {
    schema: ZodSchema,
    systemPrompt: string,
}

// --- CUSTOM SOLUTION ---

export interface CustomAPIParams {
    messageHistory: CustomMessage[];
    userMessage: string;
    userMessageReflection?: string;
}