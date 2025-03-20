export interface Message {
    sender: 'user' | 'bot';
    text: string;
    jsonUrl?: string;
    type?: 'json';
    jsonData?: unknown;
    pxData?: PxWebData;

}

export interface PxWebData {
    label: string;
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