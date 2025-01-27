"use client";
import React from 'react';
import Image from 'next/image';
import { Message } from '@/app/types';

interface ChatMessagesProps {
    messages: Message[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatMessages({
                                         messages,
                                         isLoading,
                                         messagesEndRef,
                                     }: ChatMessagesProps) {
    return (
        <div className="flex-1 overflow-y-auto mb-10 z-10 text-xs md:text-base">
            {messages.map((msg, index) => {
                if (msg.sender === 'bot') {
                    return (
                        <div key={index} className="mb-2 md:flex justify-start max-w-full">
                            <div className="flex items-center mr-2">
                                <Image
                                    src={'/ssb_logosymbol_dark.svg'}
                                    alt="Chatbot"
                                    width={50}
                                    height={50}
                                    className="min-w-[50px] min-h-[50px]"
                                />
                            </div>
                            <div
                                className="px-4 py-2 border-2 border-[#274247] bg-[#F0F8F9] text-gray-800 max-w-full md:max-w-xl">
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    );
                } else return (
                    <div key={index} className="mb-2 flex justify-end max-w-full">
                        <div className="px-4 py-2 border-2 border-[#274247] bg-[#274247] text-white">
                            {msg.text}
                        </div>
                    </div>
                );
            })}

            {isLoading && (
                <div className="mb-2 flex justify-start max-w-full">
                    <Image
                        src={'/ssb_logosymbol_dark.svg'}
                        alt="Chatbot"
                        width={40}
                        height={40}
                    />
                    <div className="px-4 py-2 border-2 border-[#274247] bg-gray-200 text-gray-800 italic">
                        Svarer...
                    </div>
                </div>
            )}

            <div ref={messagesEndRef}/>
        </div>

    );
}
