"use client";
import React, {useEffect, useState} from 'react';
import Image from 'next/image';
import {CustomMessage, PxWebData, SSBTableMetadata} from '@/app/types';
import ChartDisplay from "@/app/components/Graphing/ChartDisplay";

interface MemoizedChartDisplayProps {
    pxData: PxWebData;
}

const ChartDisplayMemo: React.FC<MemoizedChartDisplayProps> = ({ pxData }) => {
    return <ChartDisplay pxData={pxData} width={600} height={400} />;
};

const MemoizedChartDisplay = React.memo(ChartDisplayMemo);
MemoizedChartDisplay.displayName = "MemoizedChartDisplay";

// inside app/custom/CustomChatMessages.tsx

function MessageItem({ message, onExpand, onChooseTable }: { message: CustomMessage; onExpand: () => void, onChooseTable?: (table: SSBTableMetadata) => void }) {
    const isBot = message.sender === 'bot';
    const pxData = message.pxData;
    const singleValue = pxData && pxData.value.length === 1 ? pxData.value[0] : null;

    // collect pieces
    const children: React.ReactNode[] = [];

    if (pxData) {
        children.push(
            <button
                key="expand"
                className="hidden md:block absolute right-2 top-2 text-sm font-medium underline"
                onClick={onExpand}
            >
                <span className="material-symbols-outlined">open_in_full</span>
            </button>
        );

        if (singleValue) {
            const {
                extension: { px: { tableid } },
                label,
                role = {},
                dimension
            } = pxData;

            const metricKey = role.metric?.[0];
            const timeKey = role.time?.[0];

            const metricDim = metricKey ? dimension[metricKey] : undefined;
            const unit = metricDim
                ? Object.values(metricDim.category.unit)[0].base
                : '';

            const groupKey = Object
                .keys(dimension)
                .find(key => key !== metricKey && key !== timeKey) || '';
            const underlabel = groupKey ? dimension[groupKey].label : '';

            const variables = Object
                .values(dimension)
                .map(dim => ({ [dim.label]: Object.values(dim.category.label)[0] }));

            children.push(
                <div key="single" className="p-6 text-[#274247]">
                    <div className="mb-2">
                        <div className="flex items-center gap-1 text-2xl">
                            <a
                                href={`https://www.ssb.no/statbank/table/${tableid.trim()}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:underline"
                            >
                                {tableid}
                            </a>
                            <span className="material-symbols-outlined text-gray-400">
                                open_in_new
                            </span>
                        </div>
                        <h3 className="text-md">{label.split(':')[1]}</h3>
                        <h3 className="text-2xl font-bold mt-2">
                            {underlabel
                                ? `${underlabel.charAt(0).toUpperCase()}${underlabel.slice(1)}:`
                                : ''}
                        </h3>
                    </div>
                    <div className="flex items-baseline text-[#274247]">
                        <span className="text-7xl block font-bold">{singleValue}</span>
                        <span className="text-lg font-bold block mt-2 ml-2">{unit === 'antall' ? '' : unit}</span>
                    </div>
                    <h3 className="text-xl mt-4 font-bold">Variabler</h3>
                    <div className="border-y border-black">
                        {variables.map((variable, index) => (
                            <div key={index} className="flex justify-between border-t border-black">
                                <span className="text-md font-semibold">{Object.keys(variable)[0].charAt(0).toUpperCase() + Object.keys(variable)[0].slice(1)}</span>
                                <span className="text-md text-right">{Object.values(variable)[0]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        } else {
            children.push(<MemoizedChartDisplay key="chart" pxData={pxData} />);
        }
    } else if (message.possibleTables) {
        children.push(
            <div key="possible-tables" className="flex flex-col p-2 text-[#274247] gap-2">
                {message.possibleTables.map((table, index) => (
                    <div key={index} className="flex items-center gap-4 border border-gray-300 rounded-lg p-3">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center">
                                <a
                                    href={`https://www.ssb.no/statbank/table/${table.extension.px.tableid}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-gray-400 hover:underline text-xl"
                                >
                                    {table.extension.px.tableid}
                                </a>
                                <span className="material-symbols-outlined text-gray-400">
                                    open_in_new
                                </span>
                            </div>
                            <button className="bg-gray-500 text-white p-1 w-24 rounded-md hover:bg-gray-600 transition-colors"
                                onClick={() => onChooseTable?.(table)}
                            >
                                Velg tabell
                            </button>
                        </div>
                        <p className="text-md">
                            {table.label.split(':')[1]}
                        </p>
                        <p>
                            {Object.values(table.dimension['Tid']?.category.label).slice(-1)[0] || 'Ingen tid'}
                            <br/>
                            {Object.values(table.dimension['Tid']?.category.label)[0] || 'Ingen tid'}
                        </p>
                    </div>
                ))}
            </div>
        );
    } else if (message.type == 'error') {
        children.push(
            <div key="desc" className="mt-2">
                <h1 className="text-xl font-semibold mt-2">Tips til å finne det du leter etter:</h1>
                <p style={{ whiteSpace: 'pre-line' }}>
                    1. Spissere spørsmål gir spissere svar<br/>
                    2. Inkluder årstall, enten det er et eller flere<br/>
                    3. Sett parametre i spørsmålet
                </p>
            </div>
        );
    } else {
        children.push(<p key="plain">{message.text}</p>);
    }

    return (
        <div
            className={`relative px-4 py-2 border border-[#C3DCDC] rounded-lg shadow-md break-words max-w-full md:max-w-xl ${
                isBot ? 'text-gray-800 bg-white' : 'bg-[#274247] text-white'
            } ${singleValue ? '!bg-[#ECFEED] rounded-none border-none' : ''}`}
        >
            {children}
        </div>
    );
}


function ChatMessagesBase({
    messages,
    isLoading,
    messagesEndRef,
    onOpenFullscreen,
    isFullscreen,
    navLog,
    navLogSteps = [],
    onChooseTable
                          }:{
    messages: CustomMessage[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onOpenFullscreen: (pxData: PxWebData) => void;
    isFullscreen: boolean;
    navLog: string;
    navLogSteps: string[];
    onChooseTable: (table: SSBTableMetadata) => void;
}) {
    
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (navLogSteps.length === 0) {
            setShowDropdown(false);
        }
    }, [navLogSteps]);


    // Dette gjør at den ikke renderer vanlig melding når den er i fullscreen
    // Extreme efficienty Elias

    if (isFullscreen) {
        return null;
    }

    return (
        <div className="flex-1 overflow-y-auto mb-10 md:text-base text-white">
            {messages.map((message, index) => {
                const isBot = (message.sender === 'bot');

                return (
                    <div
                        key={index}
                        className={`mb-2 z-20 md:flex ${isBot ? 'justify-start' : 'justify-end'} max-w-full`}
                    >
                        {isBot && (
                            <div className="flex items-center mr-2 border-none">
                                <Image
                                    src="/ssb_logosymbol_dark.svg"
                                    alt="Chatbot"
                                    width={50}
                                    height={50}
                                    className="min-w-[50px] min-h-[50px]"
                                />
                            </div>
                        )}
                        <MessageItem
                            message={message}
                            onExpand={() => {
                                if (message.pxData) {
                                    onOpenFullscreen(message.pxData);
                                }
                            }}
                            onChooseTable={onChooseTable}
                        />
                    </div>
                );
            })}

            {isLoading && (
                <div className="mb-2 flex justify-start max-w-full items-center">
                    <Image
                        src="/ssb_logosymbol_dark.svg"
                        alt="Chatbot"
                        width={50}
                        height={50}
                    />
                    {/*<span className="loading-dots"></span>*/}

                    <div className="flex-col">

                        <div onClick={() => setShowDropdown(prev => !prev)} className="justify-center items-center">
                            <h1
                                className="text-md glowing-text cursor-pointer"
                                data-text={navLog}
                            >
                                {navLog}
                            </h1>

                            <span
                                className={`material-symbols-outlined transition-transform duration-300 ml-2 text-[#9cb1b1] ${showDropdown ? 'rotate-90' : ''}`}
                                style={{fontSize: '16px'}}
                            >
                                arrow_forward_ios
                            </span>

                        </div>


                        {showDropdown && navLogSteps.length > 0 && (
                            <div className="text-[#9cb1b1] p-2 mt-2 z-10">
                                {navLogSteps.map((step, idx) => (
                                    <div
                                        key={idx}
                                        className="text-sm last:border-0 py-1 glide-in"
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        {step}
                                    </div>
                                ))}
                            </div>
                        )}


                    </div>
                </div>
            )}


            <div ref={messagesEndRef}/>
        </div>
    );
}

const ChatMessages = React.memo(ChatMessagesBase, (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.messages !== nextProps.messages) return false;
    if (prevProps.onOpenFullscreen !== nextProps.onOpenFullscreen) return false;
    if (prevProps.navLog !== nextProps.navLog) return false;
    if (prevProps.navLogSteps !== nextProps.navLogSteps) return false;
    return prevProps.isFullscreen === nextProps.isFullscreen;
});


export default ChatMessages;
