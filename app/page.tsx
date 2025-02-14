"use client";
import {useState, useEffect, useRef, useCallback} from 'react';
import TitleSection from './components/chat_interface/TitleSection';
import ChatMessages from './components/chat_interface/ChatMessages';
import ChatInput from './components/chat_interface/ChatInput';
import FullscreenChartModal from '@/app/components/fullscreen/FullscreenChartModal';
import ExamplePrompts from "@/app/components/chat_interface/ExamplePrompts";
import { Message, PxWebData } from './types';
import HoverInfoModal from "@/app/components/InfoModal";

export default function Home() {
    const [showTitle, setShowTitle] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: 'Hei! Hvordan kan jeg hjelpe deg?' },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fullscreenPxData, setFullscreenPxData] = useState<PxWebData | null>(null);

    const handleCloseModal = useCallback(() => {
        setFullscreenPxData(null);

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 0);
    }, []);

    const handleOpenFullscreen = useCallback((pxData: PxWebData) => {
        setFullscreenPxData(pxData);
    }, []);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendUserMessage = async (userMessage: string) => {
        if (!userMessage.trim()) return;
        setFullscreenPxData(null);

        setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || response.statusText);
            }

            const tableData: PxWebData = await response.json();
            console.log("Raw API Response (tableData):", tableData);

            if (Array.isArray(tableData.value) && tableData.value.length === 1) {
                setMessages(prev => [
                    ...prev,
                    { sender: 'bot', text: `Svaret er: ${tableData.value[0]}` },
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        sender: 'bot',
                        text: "Her er dataen basert på din forespørsel:",
                        pxData: tableData,
                    },
                ]);
            }
        } catch (err) {
            console.error(err);
            setError("Vi klarte dessverre ikke å finne det du var ute etter!");
            setMessages(prev => [
                ...prev,
                { sender: 'bot', text: "Vi klarte dessverre ikke å finne det du var ute etter!" }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen p-4 mb-10">
            {fullscreenPxData && (
                <FullscreenChartModal
                    pxData={fullscreenPxData}
                    onClose={handleCloseModal}
                />
            )}

            <HoverInfoModal />



            <TitleSection showTitle={showTitle} setShowTitle={setShowTitle} />

            <div
                className={`w-full md:w-1/2 flex flex-col transition-opacity duration-500 ${
                    showTitle ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                }`}
            >
                <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    messagesEndRef={messagesEndRef}
                    onOpenFullscreen={handleOpenFullscreen}
                    isFullscreen={Boolean(fullscreenPxData)}
                />

                {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}

                {messages.filter(msg => msg.sender === "user").length === 0 && (
                    <ExamplePrompts onSelectPrompt={sendUserMessage} />
                )}
            </div>

            <ChatInput
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                handleSend={sendUserMessage}
                onSend={handleCloseModal}
            />
        </div>
    );
}
