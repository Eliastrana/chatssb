"use client";
import {useCallback, useEffect, useRef, useState} from 'react';
import TitleSection from '@/app/components/chat_interface/TitleSection';
import ChatInput from '@/app/components/chat_interface/ChatInput';
import FullscreenChartModal from '@/app/components/fullscreen/FullscreenChartModal';
import ExamplePrompts from "@/app/components/chat_interface/ExamplePrompts";
import {CustomAPIParams, CustomMessage, PxWebData, SSBTableMetadata} from '@/app/types';
import HoverInfoModal from "@/app/components/InfoModal";
import CustomChatMessages from './CustomChatMessages';
import _ from "lodash";

export default function Home() {
    const [showTitle, setShowTitle] = useState(true);
    const [messages, setMessages] = useState<CustomMessage[]>([
        { sender: 'bot', text: `Hei! Jeg er en smart søkemotor som lar deg spørre om all statistikken til SSB. Hva kan jeg hjelpe deg med?` },
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
    
    
    const sendUserMessage = async (userString: string, forcedTableId?: string) => {
        if (!userString.trim()) return;
        
        setFullscreenPxData(null);
        setInput('');
        setIsLoading(true);
        setError(null);
        
        const messageHistory = _.cloneDeep(messages)
        
        
        const userMessage: CustomMessage = {
            sender: 'user',
            text: userString,
            forceTableId: forcedTableId,
        };
        
        const data: CustomAPIParams = {
            messageHistory,
            userMessage
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        const initRes = await fetch('/api/custom', {
            method:   'POST',
            headers:  { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const { sessionId } = await initRes.json();
        
        const eventSource = new EventSource(`/api/custom?sessionId=${sessionId}`)
        const replaceNewLines = (s: string) => s.replace(/\\n/g, '\n')

        setIsLoading(true)
        
        const cleanup = () => {
            setNavLog('')
            setNavLogSteps([])
            setIsLoading(false)
            eventSource.close()
        }

        eventSource.addEventListener('log', (e: MessageEvent) =>
            console.log(replaceNewLines(e.data))
        )

        eventSource.addEventListener('info', (e: MessageEvent) =>
            setMessages(prev => [...prev, { sender: 'bot', text: replaceNewLines(e.data) }])
        )

        eventSource.addEventListener('nav', (e: MessageEvent) => {
            const nav = replaceNewLines(e.data)
            setNavLog(nav)
            setNavLogSteps(prev => [...prev, nav])
        })

        eventSource.addEventListener('pxData', (e: MessageEvent) => {
            const data = JSON.parse(e.data) as PxWebData
            setMessages(prev => [...prev, { sender: 'bot', pxData: data }])
            cleanup()
        })

        eventSource.addEventListener('abort', (e: MessageEvent) => {
            const data = JSON.parse(e.data) as SSBTableMetadata[]
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: `Det ser ikke ut som SSB har statistikk for akkurat det du spør om. Vil du likevel se på en av disse mulige tabellene?`,
            }]);
            setMessages(prev => [...prev, { sender: 'bot', possibleTables: data }]);
            cleanup()
        })

        eventSource.addEventListener('error', (e: MessageEvent) => {
            console.error(e);
            setMessages(prev => [...prev, { sender: 'bot', text: "Vi klarte dessverre å finne det du lette etter"}]);

            if (!hasErrorOccurred) {
                setMessages(prev => [...prev, { sender: 'bot', type: 'error'}]);
                setHasErrorOccurred(true);
            }
            cleanup()
        })
    };
    
    const onChooseTable = (table: SSBTableMetadata) => {
        sendUserMessage(table.label, table.extension.px.tableid);
    }

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
                <CustomChatMessages
                    messages={messages}
                    isLoading={isLoading}
                    messagesEndRef={messagesEndRef}
                    onOpenFullscreen={handleOpenFullscreen}
                    isFullscreen={Boolean(fullscreenPxData)}
                    navLog={navLog}
                    navLogSteps={navLogSteps}
                    onChooseTable={onChooseTable}
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
