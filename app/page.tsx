"use client";
import { useState, useEffect, useRef } from 'react';
import { find } from 'linkifyjs';
import ChatMessages from './components/chat_interface/ChatMessages';
import ChatInput from './components/chat_interface/ChatInput';
import JsonDisplay from './components/chat_interface/JsonDisplay';
import TitleSection from './components/chat_interface/TitleSection';
import { Message, Link } from './types';
import './styles/chat.css';

export default function Home() {
    const [showTitle, setShowTitle] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: 'Hei! Hvordan kan jeg hjelpe deg?' },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [jsonUrls, setJsonUrls] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleActivateJson = (url: string) => {
        console.log('Activating JSON display for:', url);
    };

    const handleSend = async () => {
        if (input.trim() === '') return;

        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: 'user', text: input },
        ]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: input }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        sender: 'bot',
                        text:
                            errorData.error || 'Beklager, noe gikk galt. Prøv igjen senere.',
                    },
                ]);
                setError(errorData.error || 'An unexpected error occurred.');
            } else {
                const data = await response.json();
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: 'bot', text: data.message },
                ]);

                const extractedUrls = extractUrls(data.message);
                if (extractedUrls.length > 0) {
                    const jsonLinks = await filterJsonLinks(extractedUrls);
                    setJsonUrls((prevUrls) => [...prevUrls, ...jsonLinks]);
                }
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Fetch Error:', error.message);
                setError(error.message);
            } else {
                console.error('Fetch Error:', error);
                setError('An unexpected error occurred.');
            }
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    sender: 'bot',
                    text: 'Beklager, noe gikk galt. Prøv igjen senere.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const extractUrls = (text: string): string[] => {
        const links = find(text, 'url');
        return links.map((link: Link) => link.href);
    };

    const filterJsonLinks = async (urls: string[]): Promise<string[]> => {
        const jsonUrls: string[] = [];
        for (const url of urls) {
            try {
                const encodedUrl = encodeURIComponent(url);
                const response = await fetch(`/api/check-json?url=${encodedUrl}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`API Error for URL ${url}:`, errorData.error);
                    continue;
                }

                const data = await response.json();
                if (data.isJson) {
                    jsonUrls.push(url);
                }
            } catch (err) {
                console.error(`Failed to check JSON for URL ${url}:`, err);
            }
        }
        return jsonUrls;
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen p-8 sm:p-20 mb-10">
            <TitleSection showTitle={showTitle} setShowTitle={setShowTitle} />

            <div
                className={`w-[50rem] p-6 flex flex-col transition-opacity duration-500 ${
                    showTitle ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                }`}
                style={{ pointerEvents: showTitle ? 'none' : 'auto' }}
            >
                <ChatMessages
                    messages={messages}
                    jsonUrls={jsonUrls}
                    isLoading={isLoading}
                    messagesEndRef={messagesEndRef}
                    handleActivateJson={handleActivateJson}
                />

                {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
            </div>

            <ChatInput
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                handleSend={handleSend}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center mx-auto overflow-y-auto p-4">
                {jsonUrls.map((url, index) => (
                    <div key={index} className="mb-8 bg-[#C3DCDC] w-full p-4 rounded shadow-md">
                        <h2 className="text-3xl font-bold mb-2">Valgt API:</h2>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                        >
                            {url}
                        </a>
                        <JsonDisplay url={url} />
                    </div>
                ))}
            </div>
        </div>
    );
}