"use client";
import React from 'react';
import Image from 'next/image';
import {Message, PxWebData} from '@/app/types';
import ChartDisplay from "@/app/components/Graphing/ChartDisplay";

interface ChatMessagesProps {
    messages: Message[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    onOpenFullscreen: (pxData: PxWebData) => void;
    isFullscreen: boolean;
}

// Reusable message item
function MessageItem({ msg, isBot, onExpand }: {
    msg: Message;
    isBot: boolean;
    onExpand: () => void;
}) {
    return (
        <div
            className={`relative px-4 py-2 border-2 border-[#274247] break-words max-w-full md:max-w-xl ${
                isBot ? 'bg-white text-gray-800' : 'bg-[#274247] text-white'
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
            <p>{msg.text}</p>
            {msg.pxData && (
                <ChartDisplay pxData={msg.pxData} width={600} height={400}/>
            )}
        </div>
    );
}

function ChatMessagesBase({
                              messages,
                              isLoading,
                              messagesEndRef,
                              onOpenFullscreen,
                                isFullscreen
                          }: ChatMessagesProps) {

    // Dette gjør at den ikke renderer vanlig melding når den er i fullscreen
    // Extreme efficienty Elias

    if (isFullscreen) {
        return null;
    }

    return (
        <div className="flex-1 overflow-y-auto mb-10 text-xs md:text-base text-white">
            {messages.map((msg, index) => {
                const isBot = (msg.sender === 'bot');
                return (
                    <div
                        key={index}
                        className={`mb-2 z-20 flex ${isBot ? 'justify-start' : 'justify-end'} max-w-full`}
                    >
                        {isBot && (
                            <div className="flex items-center mr-2">
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
                    <span className="loading-dots"></span>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}

const ChatMessages = React.memo(ChatMessagesBase, (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.messages !== nextProps.messages) return false;
    if (prevProps.onOpenFullscreen !== nextProps.onOpenFullscreen) return false;
    return prevProps.isFullscreen === nextProps.isFullscreen;
});

export default ChatMessages;
