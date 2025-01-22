export interface Message {
    sender: 'user' | 'bot';
    text: string;
    jsonUrl?: string;       // New field
    type?: 'json';
    jsonData?: unknown;
}

export interface Link {
    href: string;
    type: string;
    value: string;
    start: number;
    end: number;
}
