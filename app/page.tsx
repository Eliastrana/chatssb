// app/page.tsx

"use client";
import { useState, useEffect, useRef } from 'react';
import Linkify from 'linkify-react';
import { find } from 'linkifyjs';
import JsonVisualizer from './components/JsonVisualizer';

// Define the Link interface based on linkifyjs's link structure
interface Link {
    href: string;
    type: string;
    value: string;
    start: number;
    end: number;
    // Add other properties if necessary
}

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

export default function Home() {
    const [showTitle, setShowTitle] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: 'Hei! Hvordan kan jeg hjelpe deg?' },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const [jsonUrls, setJsonUrls] = useState<string[]>([]); // Store JSON URLs to visualize
    const [error, setError] = useState<string | null>(null); // Error state

    // Ref to handle auto-scrolling
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTitle(false);
        }, 3000); // 3 seconds

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Scroll to the bottom whenever messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '') return;

        // Add user's message
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: 'user', text: input },
        ]);

        // Clear input field
        setInput('');
        setIsLoading(true); // Start loading
        setError(null); // Reset error

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
                    { sender: 'bot', text: errorData.error || 'Beklager, noe gikk galt. Prøv igjen senere.' },
                ]);
                setError(errorData.error || 'An unexpected error occurred.');
            } else {
                const data = await response.json();
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { sender: 'bot', text: data.message },
                ]);

                // Extract URLs from the bot's message
                const extractedUrls = extractUrls(data.message);
                if (extractedUrls.length > 0) {
                    // Filter URLs that point to JSON resources
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
                { sender: 'bot', text: 'Beklager, noe gikk galt. Prøv igjen senere.' },
            ]);
        } finally {
            setIsLoading(false); // End loading
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    // Function to extract URLs from text using linkifyjs
    const extractUrls = (text: string): string[] => {
        const links = find(text, 'url');
        return links.map((link: Link) => link.href); // Typed parameter
    };

    const filterJsonLinks = async (urls: string[]): Promise<string[]> => {
        const jsonUrls: string[] = [];
        for (const url of urls) {
            try {
                const response = await fetch('/api/check-json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(`API Error for URL ${url}:`, errorData.error);
                    continue; // Skip this URL and proceed to the next
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
        <div className="relative flex items-center justify-center min-h-screen p-8 sm:p-20 bg-gray-100 font-[family-name:var(--font-geist-sans)]">
            {/* Title Section with Fade-Out */}
            {showTitle && (
                <div
                    className={`absolute flex flex-col items-center transition-opacity duration-1000 ${
                        showTitle ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <h1 className="text-8xl text-center text-glow">ChatSSB</h1>
                    {/* Optional Loader */}
                    <div className="mt-4">
                        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
                    </div>
                </div>
            )}

            {/* Chatbot Interface with Fade-In */}
            <div
                className={`w-full max-w-lg bg-white rounded-lg shadow-lg p-6 flex flex-col transition-opacity duration-1000 ${
                    showTitle ? 'opacity-0' : 'opacity-100'
                }`}
                style={{ pointerEvents: showTitle ? 'none' : 'auto' }}
            >
                <div className="flex-1 overflow-y-auto mb-4">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`mb-2 flex ${
                                msg.sender === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            <div
                                className={`px-4 py-2 rounded-lg ${
                                    msg.sender === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-800'
                                }`}
                            >
                                <Linkify
                                    options={{
                                        defaultProtocol: 'https',
                                        target: '_blank',
                                        className: 'text-blue-600 underline',
                                    }}
                                >
                                    {msg.text}
                                </Linkify>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="mb-2 flex justify-start">
                            <div className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 italic">
                                Svarer...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="flex">
                    <input
                        type="text"
                        className="flex-1 border border-gray-300 text-gray-800 rounded-l-lg px-4 py-2 focus:outline-none"
                        placeholder="Hva leter du etter?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={isLoading}
                    />
                    <button
                        className={`bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none ${
                            isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={handleSend}
                        disabled={isLoading}
                    >
                        Send
                    </button>
                </div>
                {/* Display error message */}
                {error && (
                    <div className="mt-2 text-red-500 text-sm">
                        {error}
                    </div>
                )}
            </div>

            {/* Render JsonVisualizer components for each JSON URL */}
            <div className="w-full max-w-lg mt-8">
                {jsonUrls.map((url, index) => (
                    <div key={index} className="mb-8">
                        <h2 className="text-xl mb-2">
                            Visualization for:{' '}
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                            >
                                {url}
                            </a>
                        </h2>
                        {/* Pass the SSB API URL directly */}
                        <JsonVisualizer url={url} />
                    </div>
                ))}
            </div>

            {/* Loader Styles */}
            <style jsx>{`
                .loader {
                    border-top-color: #3498db;
                    animation: spin 1s infinite linear;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
}
