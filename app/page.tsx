"use client";
import { useState, useEffect, useRef } from 'react';
import { find } from 'linkifyjs';
import ChatMessages from './components/chat_interface/ChatMessages';
import ChatInput from './components/chat_interface/ChatInput';
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
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ───────────────────────────────────────────────────────────────────────────
    // 1) Called if we want to show JSON data for a URL (either auto or via button)
    //    Instead of a full-screen JSON, we add a new BOT message with JSON data.
    // ───────────────────────────────────────────────────────────────────────────
    const handleActivateJson = async (url: string) => {
        console.log('Fetching JSON for:', url);
        setIsLoading(true);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Feil ved henting av JSON. Status: ${response.status}`);
            }
            const data = await response.json();

            // Insert a new bot message with the JSON
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    type: 'json',
                    text: '', // not used since type= json
                    jsonData: data,
                },
            ]);
        } catch (err) {
            console.error('Error fetching JSON:', err);
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: 'Whoops, her fant vi ikke det du lette etter 😩',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // ───────────────────────────────────────────────────────────────────────────
    // 2) Send user message to the backend, handle single-URL auto JSON
    // ───────────────────────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!input.trim()) return;

        setMessages((prev) => [...prev, { sender: 'user', text: input }]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setMessages((prev) => [
                    ...prev,
                    {
                        sender: 'bot',
                        text: errorData.error || 'Beklager, noe gikk galt. Prøv igjen senere.',
                    },
                ]);
                setError(errorData.error || 'An unexpected error occurred.');
            } else {
                const data = await response.json();
                // Show the bot's text
                setMessages((prev) => [...prev, { sender: 'bot', text: data.message }]);

                // Extract & check URLs
                const extractedUrls = extractUrls(data.message);
                if (extractedUrls.length > 0) {
                    // Among them, see which are JSON
                    const jsonLinks = await filterJsonLinks(extractedUrls);

                    // If exactly one JSON link, auto display it in a new bot message
                    if (jsonLinks.length === 1) {
                        handleActivateJson(jsonLinks[0]);
                    }
                    // If multiple, the ChatMessages UI will show “Vis JSON” buttons for each
                }
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('En uventet feil oppstod.');
            }
            setMessages((prev) => [
                ...prev,
                { sender: 'bot', text: 'Beklager, noe gikk galt. Prøv igjen senere.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // ───────────────────────────────────────────────────────────────────────────
    // 3) Standard link extraction & JSON link filtering (unchanged)
    // ───────────────────────────────────────────────────────────────────────────
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
                    headers: { 'Content-Type': 'application/json' },
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
                    // We don't need jsonUrls anymore (unless your code depends on it)
                    jsonUrls={[]}
                    isLoading={isLoading}
                    messagesEndRef={messagesEndRef}
                    // Pass in the function to fetch & create new JSON message
                    handleActivateJson={handleActivateJson}
                    // If you have multiple-URL scenario and want a “send link as message,” you can
                    // pass a function. But not strictly required for “Vis JSON.”
                    handleUserSelectedLink={(url) => {
                        // Example if you want to just put the link in the chat:
                        setMessages((prev) => [
                            ...prev,
                            { sender: 'bot', text: url },
                        ]);
                        // Then optionally auto fetch JSON
                        // handleActivateJson(url);
                    }}
                />

                {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
            </div>

            <ChatInput
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                handleSend={handleSend}
            />
        </div>
    );
}
