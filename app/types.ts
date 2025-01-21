export interface Message {
    sender: 'user' | 'bot';
    text: string;
}

export interface Link {
    href: string;
    type: string;
    value: string;
    start: number;
    end: number;
}
