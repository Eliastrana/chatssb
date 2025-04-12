export interface Message {
    sender: 'user' | 'bot';
    text: string;
    label?: string;
    underLabel?: string;
    value?: number;
    title?: string;
    description?: string;
    tableid?: string;
    unit?: string;
    jsonUrl?: string;
    type?: 'json';
    jsonData?: unknown;
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
        extension: { elimination: boolean; };
    }>;
    extension: {
        px: {
            tableid: string;
        }
    };
}

export interface SSBNavigationResponse {
    folderContents: {
        type: string;
        id: string;
        label: string;
    }[];
}

export interface ServerLog {
    content: string;
    eventType: 'log' | 'nav' | 'tokens' | 'final' | 'error';
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
    resonate: boolean;
    resonateModel: ModelType;
    navigationTechnique: NavType;
    navigationModel: ModelType;
    selectionTechnique: SelType;
    selectionModel: ModelType;
    useQAURL: boolean;
}

export enum NavType {
    Parallell_1 = 'parallell_1',
    Parallell_2 = 'parallell_2',
    Parallell_3 = 'parallell_3',
}

export enum SelType {
    Singlethreaded = 'singlethreaded',
    Multithreaded = 'multithreaded',
    EnumMultithreaded = 'enumMultithreaded',
    EnumSinglethreaded = 'enumSinglethreaded',
    SchemaSinglethreaded = 'schemaSinglethreaded',
}

export enum ModelType {
    GPT4oMini = 'gpt-4o-mini',
    GPTo3Mini = 'o3-mini-2025-01-31',
    GeminiFlash2Lite = 'gemini-2.0-flash-lite',
    Gemini2_5ProExp = 'gemini-2.5-pro-exp-03-25',
    Llama33_70b = 'llama-3.3-70b-versatile',
    Llama32_1b = 'llama-3.2-1b-preview',
    DeepseekR1_70b = 'deepseek-r1-distill-llama-70b',
}