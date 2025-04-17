"use client";
import React, {useEffect, useState} from 'react';
import Image from 'next/image';
import {Message, PxWebData} from '@/app/types';
import {ChartDisplay} from "@/app/components/Graphing/ChartDisplay";

interface ChatMessagesProps {
    messages: Message[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onOpenFullscreen: (pxData: PxWebData) => void;
    isFullscreen: boolean;
    navLog: string;
    navLogSteps: string[];

}

interface MemoizedChartDisplayProps {
    pxData: PxWebData;
}

const ChartDisplayMemo: React.FC<MemoizedChartDisplayProps> = ({ pxData }) => {
    return <ChartDisplay pxData={pxData} width={600} height={400} />;
};

const MemoizedChartDisplay = React.memo(ChartDisplayMemo);
MemoizedChartDisplay.displayName = "MemoizedChartDisplay";

// Reusable message item
function MessageItem({ msg, isBot, onExpand }: {
    msg: Message;
    isBot: boolean;
    onExpand: () => void;
}) {

    return (
        <div
            className={`relative px-4 py-2 border border-[#C3DCDC] rounded-lg shadow-md break-words max-w-full md:max-w-xl ${
                isBot ? 'text-gray-800 bg-white' : 'bg-[#274247] text-white'
            } ${msg.value && isBot ? '!bg-[#ECFEED] rounded-none border-none' : ''
            }`}
        >
            {isBot && msg.pxData && (
                <button
                    className="hidden md:block absolute right-2 top-2 text-sm font-medium underline"
                    onClick={onExpand}
                >
                    <span className="material-symbols-outlined">
                        open_in_full
                    </span>
                </button>
            )}

            {msg.value !== undefined && (
                <div className="p-6 text-[#274247]">

                    <div className="mb-2">
                        <div className="flex items-center gap-1 text-2xl">
                            <a
                                href={`https://www.ssb.no/statbank/table/${msg.tableid?.trim()}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:underline"
                            >
                                {msg.tableid}
                            </a>

                            <span className="material-symbols-outlined text-gray-400">
                                open_in_new
                            </span>
                        </div>


                        <h3 className="text-md ">{msg.label?.split(':')[1]}</h3>

                        <h3 className="text-2xl font-bold mt-2">
                            {msg.underLabel
                                ? msg.underLabel.charAt(0).toUpperCase() + msg.underLabel.slice(1) + ':'
                                : ''}
                        </h3>

                    </div>
                    {/*<span className="text-xl font-semibold block ">{msg.text}</span>*/}

                    <div className="flex items-baseline text-[#274247]">
                        <span className="text-7xl block font-bold ">{msg.value}</span>
                        <span className="text-lg font-bold block mt-2 ml-2">
                            {msg.unit === "antall" ? "" : msg.unit}
                        </span>
                    </div>
                    
                    <h3 className="text-xl mt-4 font-bold">Variabler</h3>
                    <div className="border-y border-black" >
                        {msg.variables && msg.variables.map((variable, index) => (
                            <div key={index} className="flex justify-between border-t border-black">
                                <span className="text-md font-semibold">{Object.keys(variable)[0]}</span>
                                <span className="text-md text-right">{Object.values(variable)[0]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!msg.value && !msg.description && (
                <p>{msg.text}</p>
            )}

            {msg.pxData && (
                <MemoizedChartDisplay pxData={msg.pxData}/>
            )}


            {msg.description && (
                <div className={"mt-2"}>
                    <h1 className="text-xl font-semibold mt-2">{msg.text}</h1>
                    <div className="mt-2">
                        <p style={{whiteSpace: 'pre-line'}}>{msg.description}</p>
                    </div>
                </div>

            )
            }
        </div>
    )
        ;
}

function ChatMessagesBase({
                              messages,
                              isLoading,
                              messagesEndRef,
                              onOpenFullscreen,
                              isFullscreen,
                              navLog,
                              navLogSteps = [],

                          }: ChatMessagesProps) {

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
            {messages.map((msg, index) => {
                const isBot = (msg.sender === 'bot');
                return (
                    <div
                        key={index}
                        className={`mb-2 z-20 flex ${isBot ? 'justify-start' : 'justify-end'} max-w-full`}
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
                            msg={msg}
                            isBot={isBot}
                            onExpand={() => {
                                if (msg.pxData) {
                                    onOpenFullscreen(msg.pxData);
                                }
                            }}
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
