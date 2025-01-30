"use client";
import { useState, useEffect, useRef } from 'react';
import TitleSection from './components/chat_interface/TitleSection';
import ChatMessages from './components/chat_interface/ChatMessages';
import ChatInput from './components/chat_interface/ChatInput';

import { Message } from './types';

export default function Home() {
    const [showTitle, setShowTitle] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: 'Hei! Hvordan kan jeg hjelpe deg?' },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null!);



    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    const sendUserMessage = async () => {
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
                throw new Error(errorData.error || response.statusText);
            }

            const tableData = await response.json();
            console.log("Raw API Response (tableData):", tableData);

            // Denne sjekker om det er en tabell eller en enkeltverdi

            if (Array.isArray(tableData.value) && tableData.value.length === 1) {
                setMessages((prev) => [
                    ...prev,
                    { sender: 'bot', text: `Svaret er: ${tableData.value[0]}` }
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { sender: 'bot', text: "Her er grafen basert på dine data:", pxData: tableData }
                ]);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };


    // Bare veldig clean komponentbasert layout
    return (
        <div className="relative flex items-center justify-center min-h-screen p-4  mb-10">
            
            <div className="fixed top-4 left-4 md:w-1/6 w-1/2">
                <p className="text-sm opacity-50">Denne nettsiden er under utvikling, SSB står ikke for de oppgitte svarene.</p>
            </div>
            <TitleSection showTitle={showTitle} setShowTitle={setShowTitle}/>

            <div
                className={`w-full md:w-1/2 flex flex-col transition-opacity duration-500 ${
                    showTitle ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                }`}
            >



                <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    messagesEndRef={messagesEndRef}

                    //Denne sletta Trygve i den andre fila så derfor er det kommentert ut her.

                    // handleUserSelectedLink={(url) => {
                    //     setMessages((prev) => [...prev, {sender: 'bot', text: url}]);
                    //     // Denne kan utkommenteres hvis ønsket:
                    //     // handleActivateJson(url);
                    // }}
                />

                {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
            </div>


            <ChatInput
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                handleSend={sendUserMessage}
            />
        </div>
    );
}
