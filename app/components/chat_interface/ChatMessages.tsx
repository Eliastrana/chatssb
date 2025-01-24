"use client";
import React from 'react';
import Linkify from 'linkify-react';
import Image from 'next/image';
import { Message } from '@/app/types';
import InlineJsonBubble from './InlineJsonBubble';

interface ChatMessagesProps {
    messages: Message[];
    jsonUrls: string[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    handleActivateJson: (url: string) => void;
    handleUserSelectedLink: (url: string) => void;
}

export default function ChatMessages({
                                         messages,
                                         isLoading,
                                         messagesEndRef,
                                         handleActivateJson,
                                     }: ChatMessagesProps) {
    return (
        <div className="flex-1 overflow-y-auto mb-10 z-10 text-xs md:text-base">
            {messages.map((msg, index) => {
                
                if (msg.sender === 'bot') {
                    const lines = msg.text
                        .split('\n')
                        .map((line) => line.trim())
                        .filter((l) => l.startsWith('http'));

                    if (lines.length > 1) {
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
                                    <h1 className="mb-2">Ser dette ut som noe du leter etter?</h1>
                                    <div className="flex flex-col gap-2">
                                        {lines.map((url, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleActivateJson(url)}
                                                className="inline-block px-3 py-2 bg-[#274247] text-white hover:bg-[#1b2f30] text-left hover:cursor-pointer rounded"
                                            >
                                                {url}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    if (lines.length === 1) {
                        const [url] = lines;
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
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline break-all mr-4"
                                    >
                                        {url}
                                    </a>
                                    <button
                                        onClick={() => handleActivateJson(url)}
                                        className="inline-block ml-0 mt-2 sm:mt-0 sm:ml-2 px-2 py-1 bg-[#274247] text-white hover:bg-[#1b2f30] rounded"
                                    >
                                        Vis JSON
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={index} className="mb-2 md:flex  justify-start max-w-full">
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
                                <Linkify
                                    options={{
                                        defaultProtocol: 'https',
                                        target: '_blank',
                                        className: 'text-blue-600 underline',
                                    }}
                                >
                                    {msg.text}
                                </Linkify>
                            </div>
                        </div>
                    );
                }

                return (
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
