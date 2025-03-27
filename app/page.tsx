"use client";
import {useCallback, useEffect, useRef, useState} from 'react';
import TitleSection from './components/chat_interface/TitleSection';
import ChatMessages from './components/chat_interface/ChatMessages';
import ChatInput from './components/chat_interface/ChatInput';
import FullscreenChartModal from '@/app/components/fullscreen/FullscreenChartModal';
import ExamplePrompts from "@/app/components/chat_interface/ExamplePrompts";
import {BackendAPIParams, Message, ModelType, NavType, PxWebData, SelType} from './types';
import HoverInfoModal from "@/app/components/InfoModal";

export default function Home() {
    const [showTitle, setShowTitle] = useState(true);
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'bot', text: 'Hei! Jeg er en smart søkemotor som lar deg spørre om all statistikken til SSB. Hva kan jeg hjelpe deg med?' },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fullscreenPxData, setFullscreenPxData] = useState<PxWebData | null>(null);
    const [hasErrorOccurred, setHasErrorOccurred] = useState(false);

    const [navLog, setNavLog] = useState("");
    const [navLogSteps, setNavLogSteps] = useState<string[]>([]);



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
            const tableData: PxWebData = await new Promise((resolve, reject) => {
                console.log(`Client sending userMessage:\n`, userMessage);



                const params: BackendAPIParams = {
                    userMessage,
                    dev: true,
                    nav: NavType.Parallell,
                    sel: SelType.EnumSingleThreaded,
                    modelType: ModelType.GPT4oMini
                };

                // Convert params to query string
                const queryString = Object.entries(params)
                    .filter(([, value]) => value !== undefined)
                    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
                    .join('&');
                
                const eventSource = new EventSource(`/api/stream?${queryString}`);

                const replaceNewLines = (data: string) => data.replace(/\\n/g, '\n');

                eventSource.addEventListener('log', (e: MessageEvent) => {
                    console.log("Terminal log:\n", replaceNewLines(e.data));
                });

                eventSource.addEventListener('nav', (e: MessageEvent) => {
                    const newLog = replaceNewLines(e.data);
                    setNavLog(newLog);
                    setNavLogSteps(prev => [...prev, newLog]); // accumulate steps
                    console.log("Navigation log:\n", newLog);
                });


                // Listen for the final event that carries the complete JSON result
                eventSource.addEventListener('final', (e: MessageEvent) => {
                    setNavLog("");  // Clear the live feed
                    setNavLogSteps([]);      // Clear the history (which will hide the dropdown)
                    resolve(JSON.parse(e.data) as PxWebData);
                    eventSource.close();
                });
                
                eventSource.addEventListener('error', (e: MessageEvent) => {
                    reject(e.data);
                    eventSource.close();
                });
            });
            
            console.log("Recieved data:", tableData);
            
            // Litt skitten chat kode som klarer å hente ut prosent
            const metricKey = tableData.role?.metric?.[0];
            let baseUnit = '';
            let categoryLabels: Record<string, string> = {};

            if (metricKey) {
                const metricDimension = tableData.dimension[metricKey];
                if (metricDimension) {
                    const units = metricDimension.category.unit;
                    const firstUnitKey = Object.keys(units)[0];
                    baseUnit = units[firstUnitKey].base;
                    console.log("Base Unit:", baseUnit);

                    categoryLabels = metricDimension.category.label;
                    const firstCategoryKey = Object.keys(categoryLabels)[0];
                    const firstCategoryLabel = categoryLabels[firstCategoryKey];
                    console.log("First Category Label:", firstCategoryLabel);
                } else {
                    console.log("Metric dimension not found");
                }
            } else {
                console.log("Metric key not defined");
            }

            const timeKey = tableData.role?.time?.[0];
            const allDimensionKeys = Object.keys(tableData.dimension);
            const groupDimensionKeys = allDimensionKeys.filter(
                key => key !== metricKey && key !== timeKey
            );

            const groupKey = groupDimensionKeys[0] || '';
            let groupLabel = '';
            if (groupKey) {
                const groupDimension = tableData.dimension[groupKey];
                groupLabel = groupDimension.label;
                console.log("Group Dimension Label:", groupLabel);
            } else {
                console.error("No group dimension found");
            }

            if (Array.isArray(tableData.value) && tableData.value.length === 1) {
                setMessages(prev => [
                    ...prev,
                    {
                        sender: 'bot',
                        text: `Svaret er: `,
                        underLabel: groupLabel,
                        label: tableData.label,
                        tableid: tableData.extension.px.tableid,
                        value: tableData.value[0],
                        unit: baseUnit
                    },
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
            setMessages(prev => [
                ...prev,
                { sender: 'bot', text: "Vi klarte dessverre å finne det du lette etter"
                }
            ]);

            if (!hasErrorOccurred) {
                setMessages(prev => [
                    ...prev,
                    {
                        sender: 'bot',
                        text: "Tips til å finne det du leter etter:",
                        description: "1. Spissere spørsmål gir spissere svar \n2. Inkluder årstall, enten det er et eller flere \n3. Sett parametre i spørsmålet "}
                ]);
                setHasErrorOccurred(true);
            }
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
                    navLog={navLog}
                    navLogSteps={navLogSteps}

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
