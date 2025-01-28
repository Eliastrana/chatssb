export interface Message {
    sender: 'user' | 'bot';
    text: string;
    jsonUrl?: string;       // New field
    type?: 'json';
    jsonData?: unknown;
}