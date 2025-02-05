export interface Message {
    sender: 'user' | 'bot';
    text: string;
    jsonUrl?: string;       // New field
    type?: 'json';
    jsonData?: unknown;
    pxData?: PxWebData;    // <-- optional chart data

}

export interface PxWebData {
    dimension: {
        [dimName: string]: {
            label: string;
            category: {
                index: Record<string, number>;
                label: Record<string, string>;
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
}

export interface SSBNavigationResponse {
    folderContents: {
        type: string;
        id: string;
        label: string;
    }[];
}