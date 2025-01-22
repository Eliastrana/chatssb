"use client";
import { useState, useEffect, useRef } from 'react';
import TitleSection from './components/chat_interface/TitleSection';
import ChatMessages from './components/chat_interface/ChatMessages';
import ChatInput from './components/chat_interface/ChatInput';

import { Message } from './types';
import { extractUrls, filterJsonLinks } from '@/app/utils/urlExtraction';
import { fetchAndPostJson, fetchSsbTable } from '@/app/services/api';

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

    // Brukes når man vil vise JSON data for en URL
    const handleActivateJson = async (url: string) => {
        console.log(`handleActivateJson → ${url}`);

        try {
            const postData = await fetchAndPostJson(url);
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    type: 'json',
                    text: '',
                    jsonUrl: url,
                    jsonData: postData,
                },
            ]);
        } catch (error) {
            console.error('Error in handleActivateJson:', error);
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: 'Beklager, noe gikk galt under henting av data.',
                },
            ]);
        }
    };

    // Viser table data basert på tableID
    async function handleShowTable(tableId: string) {
        try {
            const postData = await fetchSsbTable(tableId);
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    type: 'json',
                    text: '',
                    jsonUrl: `https://data.ssb.no/api/v0/no/table/${tableId}`,
                    jsonData: postData,
                },
            ]);
        } catch (error) {
            console.error('Error in handleShowTable:', error);
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: 'Beklager, vi klarte ikke å finne frem tabellen 😔 👎',
                },
            ]);
        }
    }

    // Sender brukermelding, bruker: /api/chat/route.ts
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
                throw new Error(errorData.error || 'Noe gikk galt.');
            }

            const data = await response.json();
            setMessages((prev) => [...prev, { sender: 'bot', text: data.message }]);

            const extractedUrls = extractUrls(data.message);
            if (extractedUrls.length > 0) {
                const jsonLinks = await filterJsonLinks(extractedUrls);
                if (jsonLinks.length === 1) {
                    handleActivateJson(jsonLinks[0]);
                }
            }
        } catch (error: unknown) {
            let errMsg = 'En uventet feil oppstod.';
            if (error instanceof Error) {
                errMsg = error.message;
            }
            setError(errMsg);
            setMessages((prev) => [
                ...prev,
                { sender: 'bot', text: 'Beklager, noe gikk galt. Prøv igjen senere.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Bare veldig clean komponentbasert layout
    return (
        <div className="relative flex items-center justify-center min-h-screen p-4  mb-10">
            <TitleSection showTitle={showTitle} setShowTitle={setShowTitle}/>

            <div
                className={`w-full md:w-1/2 flex flex-col transition-opacity duration-500 ${
                    showTitle ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                }`}
            >
                <ChatMessages
                    messages={messages}
                    handleShowTable={handleShowTable}
                    jsonUrls={[]} // Denne brukes ikke nå fordi jeg prøver å omstille fetchen.
                    isLoading={isLoading}
                    messagesEndRef={messagesEndRef}
                    handleActivateJson={handleActivateJson}
                    handleUserSelectedLink={(url) => {
                        setMessages((prev) => [...prev, {sender: 'bot', text: url}]);
                        // Denne kan utkommenteres hvis ønsket:
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
