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
    eventType: 'log' | 'nav' | 'final' | 'error';
}