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
