"use client";
import {useCallback, useEffect, useRef, useState} from 'react';

import FullscreenChartModal from '@/app/components/fullscreen/FullscreenChartModal';
import ExamplePrompts from "@/app/components/chat_interface/ExamplePrompts";

import HoverInfoModal from "@/app/components/InfoModal";
import {BackendAPIParams, Message, ModelType, NavType, PxWebData, SelType} from "@/app/types";
import TitleSection from "@/app/components/chat_interface/TitleSection";
import ChatMessages from "@/app/components/chat_interface/ChatMessages";
import ChatInput from "@/app/components/chat_interface/ChatInput";
import ModelPicker from "@/app/components/dev/ModelPicker";
import SelectionPicker from "@/app/components/dev/SelectionPicker";
import NavigationLog from "@/app/components/dev/NavigationLog";
import StatisticsPanel from "@/app/components/dev/StatisticsPanel";
import NavigationPicker from "@/app/components/dev/NavigationPicker";
import BaseURLPicker from "@/app/components/dev/BaseURLPicker";
import ReasoningPicker from "@/app/components/dev/ReasoningPicker";

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


    const [currentInputTokenUsage, setCurrentInputTokenUsage] = useState(0);
    const [currentOutputTokenUsage, setCurrentOutputTokenUsage] = useState(0);
    // Cumulative totals:
    const [totalInputTokenUsage, setTotalInputTokenUsage] = useState(0);
    const [totalOutputTokenUsage, setTotalOutputTokenUsage] = useState(0);
    
    const [tempNavLogSteps, setTempNavLogSteps] = useState<string[]>([]);
    const [persistentNavLogSteps, setPersistentNavLogSteps] = useState<string[]>([]);
    const [persistentAllLogSteps, setPersistentAllLogSteps] = useState<string[]>([]);
    const [showAllLogs, setShowAllLogs] = useState(false); // toggle state

    const [liveResponseTime, setLiveResponseTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    const [baseURL, setBaseURL] = useState<boolean>(false);
    useEffect(() => {
        const stored = localStorage.getItem('baseURL');
        if (stored) {
            setBaseURL(stored === 'true');
        }
    }, []);
    
    const [reasoning, setReasoning] = useState(true);
    useEffect(() => {
        const stored = localStorage.getItem('reasoning');
        if (stored) {
            setReasoning(stored === 'true');
        }
    }, []);
    
    const [reasoningModel, setReasoningModel] = useState<ModelType>(ModelType.GPT4oMini);
    useEffect(() => {
        const stored = localStorage.getItem('reasoningModel');
        if (stored) {
            setReasoningModel(stored as ModelType);
        }
    }, []);
    
    
    const [navigationTechnique, setNavigationTechnique] = useState<NavType>(NavType.FolderNavigation_3);
    useEffect(() => {
        const stored = localStorage.getItem('navigationTechnique');
        if (stored) {
            setNavigationTechnique(stored as NavType);
        }
    }, []);
    
    const [navigationModel, setNavigationModel] = useState<ModelType>(ModelType.GPT4oMini);
    useEffect(() => {
        const stored = localStorage.getItem('navigationModel');
        if (stored) {
            setNavigationModel(stored as ModelType);
        }
    }, []);

    
    const [selectionTechnique, setSelectionTechnique] = useState<SelType>(SelType.RedundantSingle);
    useEffect(() => {
        const stored = localStorage.getItem('selectionTechnique');
        if (stored) {
            setSelectionTechnique(stored as SelType);
        }
    }, []);
    
    const [selectionModel, setSelectionModel] = useState<ModelType>(ModelType.GPT4oMini);
    useEffect(() => {
        const stored = localStorage.getItem('selectionModel');
        if (stored) {
            setSelectionModel(stored as ModelType);
        }
    }, []);


    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [persistentNavLogSteps, persistentAllLogSteps, showAllLogs]);

    useEffect(() => {
        localStorage.setItem('baseURL', String(baseURL));
    }, [baseURL]);
    
    useEffect(() => {
        localStorage.setItem('reasoning', String(reasoning))
    }, [reasoning]);
    useEffect(() => {
        localStorage.setItem('reasoningModel', reasoningModel)
    }, [reasoningModel]);
    
    useEffect(() => {
        localStorage.setItem('navigationTechnique', navigationTechnique)
    }, [navigationTechnique]);
    useEffect(() => {
        localStorage.setItem('navigationModel', navigationModel)
    }, [navigationModel]);

    useEffect(() => {
        localStorage.setItem('selectionTechnique', selectionTechnique)
    }, [selectionTechnique]);
    useEffect(() => {
        localStorage.setItem('selectionModel', selectionModel)
    }, [selectionModel]);

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

        setCurrentInputTokenUsage(0);
        setCurrentOutputTokenUsage(0);
        setTotalInputTokenUsage(0);
        setTotalOutputTokenUsage(0);
        
        setLiveResponseTime(0);
        const startTime = Date.now();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setLiveResponseTime(Date.now() - startTime);
        }, 100);

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
                    reasoning: reasoning,
                    reasoningModel: reasoningModel,
                    navigationTechnique: navigationTechnique,
                    navigationModel: navigationModel,
                    selectionTechnique: selectionTechnique,
                    selectionModel: selectionModel,
                    useQAURL: baseURL
                };

                // Convert params to query string
                const queryString = Object.entries(params)
                    .filter(([, value]) => value !== undefined)
                    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
                    .join('&');

                const eventSource = new EventSource(`/api/stream?${queryString}`);

                const replaceNewLines = (data: string) => data.replace(/\\n/g, '\n');

                eventSource.addEventListener('log', (e: MessageEvent) => {
                    const newLog = replaceNewLines(e.data);
                    console.log("Terminal log:\n", newLog);
                    setPersistentAllLogSteps(prev => [...prev, newLog]);
                });

                eventSource.addEventListener('nav', (e: MessageEvent) => {
                    const newLog = replaceNewLines(e.data);
                    setNavLog(newLog);
                    setTempNavLogSteps(prev => [...prev, newLog]);
                    setPersistentNavLogSteps(prev => [...prev, newLog]);
                    setPersistentAllLogSteps(prev => [...prev, newLog]);
                    console.log("Navigation log:\n", newLog);
                });

                eventSource.addEventListener('tokens', (e: MessageEvent) => {
                    try {
                        const tokenData = JSON.parse(e.data);
                        // tokenData example: { promptTokens: 419, completionTokens: 22, totalTokens: 441 }
                        // Update live token counters with the freshest event values:
                        setCurrentInputTokenUsage(tokenData.promptTokens);
                        setCurrentOutputTokenUsage(tokenData.completionTokens);
                        // Also add these values to the cumulative totals:
                        setTotalInputTokenUsage(prev => prev + tokenData.promptTokens);
                        setTotalOutputTokenUsage(prev => prev + tokenData.completionTokens);
                        console.log("Updated tokens:", tokenData);
                    } catch (error) {
                        console.error("Token parsing error:", error);
                    }
                });

                eventSource.addEventListener('final', (e: MessageEvent) => {

                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    setLiveResponseTime(Date.now() - startTime);

                    setNavLog("");
                    setTempNavLogSteps([]);
                    resolve(JSON.parse(e.data) as PxWebData);
                    eventSource.close();
                });
                
                eventSource.addEventListener('wildcard', (e: MessageEvent) => {
                    const newLog = replaceNewLines(e.data);
                    setMessages(prev => [
                        ...prev,
                        {
                            sender: 'bot',
                            text: newLog,
                        },
                    ]);
                });

                eventSource.onerror = (error) => {
                    reject(new Error(error.toString()));
                    eventSource.close();
                };
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
                const variableList: Record<string, string>[] = Object.values(tableData.dimension).map(dimension => {
                    return { [dimension.label]: Object.values(dimension.category.label)[0] }
                });
                
                console.log(JSON.stringify(variableList))
                
                setMessages(prev => [
                    ...prev,
                    {
                        sender: 'bot',
                        text: `Svaret er: `,
                        underLabel: groupLabel,
                        label: tableData.label,
                        tableid: tableData.extension.px.tableid,
                        value: tableData.value[0],
                        unit: baseUnit,
                        variables: variableList
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
                { sender: 'bot', text: "Vi klarte dessverre ikke å finne det du var ute etter!" }
            ]);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setLiveResponseTime(Date.now() - startTime);

            if (!hasErrorOccurred) {
                setMessages(prev => [
                    ...prev,
                    {
                        sender: 'bot',
                        text: "Tips til å finne det du leter etter:",
                        description: "1. Spissere spørsmål gir spissere svar \n2. Inkluder årstall, enten det er et eller flere \n3. Sett parametre i spørsmålet "
                    }
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
                <FullscreenChartModal pxData={fullscreenPxData} onClose={handleCloseModal}/>
            )}

            {!fullscreenPxData && (

                <div className="fixed top-0 left-0 w-full h-14 bg-[#F0F8F9] z-40 hidden md:block ">
                    <div className="flex items-center justify-start ml-20 space-x-2 h-full mt-5">
                        <HoverInfoModal/>
                        
                        <BaseURLPicker 
                            selectedBaseURL={baseURL} 
                            onSelectBaseURL={setBaseURL}
                        />
                        
                        <div className="flex flex-col gap-2">
                            <ReasoningPicker 
                                selectedReasoning={reasoning} 
                                onSelectedReasoning={setReasoning}
                            />
                            <ModelPicker
                                selectedModel={reasoningModel}
                                onSelectModel={setReasoningModel}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <NavigationPicker
                                selectedNavigation={navigationTechnique}
                                onSelectNavigation={setNavigationTechnique}
                            />
                            <ModelPicker
                                selectedModel={navigationModel}
                                onSelectModel={setNavigationModel}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <SelectionPicker
                                selectedSelection={selectionTechnique}
                                onSelectSelection={setSelectionTechnique}
                            />
                            <ModelPicker
                                selectedModel={selectionModel}
                                onSelectModel={setSelectionModel}
                            />
                        </div>
                    </div>

                </div>
            )}

            <TitleSection showTitle={showTitle} setShowTitle={setShowTitle}/>

            <div
                className={`w-full md:w-1/2 flex flex-col transition-opacity duration-500 ${
                    showTitle ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                }`}
            >

                <div className="max-h-[80%] mt-20">
                    <ChatMessages
                        messages={messages}
                        isLoading={isLoading}
                        messagesEndRef={messagesEndRef}
                        onOpenFullscreen={handleOpenFullscreen}
                        isFullscreen={Boolean(fullscreenPxData)}
                        navLog={navLog}
                        navLogSteps={tempNavLogSteps}
                    />
                </div>

                {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}

                {messages.filter(msg => msg.sender === "user").length === 0 && (
                    <ExamplePrompts onSelectPrompt={sendUserMessage}/>
                )}

                {!fullscreenPxData && (
                    <>
                        <NavigationLog
                            showAllLogs={showAllLogs}
                            toggleShowAllLogs={() => setShowAllLogs((prev) => !prev)}
                            persistentAllLogSteps={persistentAllLogSteps}
                            persistentNavLogSteps={persistentNavLogSteps}
                            logContainerRef={logContainerRef}
                        />
                        <StatisticsPanel
                            liveResponseTime={liveResponseTime}
                            liveInputTokenUsage={currentInputTokenUsage}
                            liveOutputTokenUsage={currentOutputTokenUsage}
                            totalInputTokenUsage={totalInputTokenUsage}
                            totalOutputTokenUsage={totalOutputTokenUsage}
                        />                    </>
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
