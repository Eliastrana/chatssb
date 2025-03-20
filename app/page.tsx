"use client";
import {useState, useEffect, useRef, useCallback} from 'react';
import TitleSection from './components/chat_interface/TitleSection';
import ChatMessages from './components/chat_interface/ChatMessages';
import ChatInput from './components/chat_interface/ChatInput';
import FullscreenChartModal from '@/app/components/fullscreen/FullscreenChartModal';
import ExamplePrompts from "@/app/components/chat_interface/ExamplePrompts";
import { Message, PxWebData } from './types';
import HoverInfoModal from "@/app/components/InfoModal";
import { userRequestToLLMResponse } from "@/app/services/userRequestToLLMResponse";

export default function Home() {
    const [showTitle, setShowTitle] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: 'Hei! Jeg er en smart søkemotor som lar deg spørre om all statistikken til SSB. Søk i vei!' },
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
            const tableData = await userRequestToLLMResponse(input) as PxWebData;

            console.log("Raw API Response (tableData):", tableData);

            // Litt skitten chat kode som klarer å hente ut prosent
            const metricKey = tableData.role?.metric?.[0];
            let baseUnit = '';

            if (metricKey) {
                const metricDimension = tableData.dimension[metricKey];
                if (metricDimension) {
                    const units = metricDimension.category.unit;
                    const firstUnitKey = Object.keys(units)[0];
                    baseUnit = units[firstUnitKey].base;
                    console.log("Base Unit:", baseUnit);
                } else {
                    console.error("Metric dimension not found");
                }
            } else {
                console.error("Metric key not defined");
            }

            if (Array.isArray(tableData.value) && tableData.value.length === 1) {
                setMessages(prev => [
                    ...prev,
                    { sender: 'bot',
                        text: `Svaret er: `,
                        tableid: tableData.extension.px.tableid,
                        value: tableData.value[0],
                        unit: baseUnit},
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
