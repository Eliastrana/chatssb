"use client";
import React from 'react';
import Image from 'next/image';
import { Message } from '@/app/types';
import { PxWebLineChart } from '@/app/components/Graphing/PxWebLineChart';

interface ChatMessagesProps {
    messages: Message[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatMessages({ messages, isLoading, messagesEndRef }: ChatMessagesProps) {
    return (
        <div className="flex-1 overflow-y-auto mb-10 z-10 text-xs md:text-base text-white">
            {messages.map((msg, index) => {
                const isBot = msg.sender === 'bot';

                return (
                    <div key={index} className={`mb-2 flex ${isBot ? 'justify-start' : 'justify-end'} max-w-full`}>
                        {isBot && (
                            <div className="flex items-center mr-2">
                                <Image src="/ssb_logosymbol_dark.svg" alt="Chatbot" width={50} height={50} className="min-w-[50px] min-h-[50px]" />
                            </div>
                        )}

                        <div className={`px-4 py-2 border-2 border-[#274247] break-words max-w-full md:max-w-xl ${isBot ? 'bg-[#F0F8F9] text-gray-800' : 'bg-[#274247] text-white'}`}>
                            <p>{msg.text}</p>

                            {msg.pxData && (
                                <div className="mt-2 bg-white border border-gray-300 p-2 rounded">
                                    <PxWebLineChart data={msg.pxData} width={600} height={400} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {isLoading && (
                <div className="mb-2 flex justify-start max-w-full items-center">
                    <Image src="/ssb_logosymbol_dark.svg" alt="Chatbot" width={50} height={50} />
                    <span className="loading-dots"></span>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}
