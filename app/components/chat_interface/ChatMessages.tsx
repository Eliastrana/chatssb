"use client";
import Image from 'next/image';
import Linkify from 'linkify-react';
import { Message } from '@/app/types';
import React from 'react';

// A simple inline JSON bubble
function InlineJsonBubble({ data }: { data: unknown }) {
    return (
        <div className="px-4 py-2 border-2 border-[#274247] bg-[#F0F8F9] text-gray-800 whitespace-pre-wrap break-words max-w-xl h-96 overflow-auto">
            {JSON.stringify(data, null, 2)}
        </div>
    );
}

/**
 * Splits the message text by newlines and returns only lines that look like URLs.
 * You can customize the `startsWith('http')` to be stricter or more lenient if needed.
 */
function parseUrlLines(text: string): string[] {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('http'));
}

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
                                         jsonUrls,
                                         isLoading,
                                         messagesEndRef,
                                         handleActivateJson,
                                         handleUserSelectedLink,
                                     }: ChatMessagesProps) {
    return (
        <div className="flex-1 overflow-y-auto mb-4 z-10">
            {messages.map((msg, index) => {
                // 1) If this is a JSON message, show a JSON bubble.
                if (msg.type === 'json') {
                    return (
                        <div key={index} className="mb-2 flex justify-start">
                            <div className="flex items-center mr-2">
                                <Image
                                    src={'/ssb_logosymbol_dark.svg'}
                                    alt="Chatbot"
                                    width={50}
                                    height={50}
                                    className="min-w-[50px] min-h-[50px]"
                                />
                            </div>
                            <InlineJsonBubble data={msg.jsonData} />
                        </div>
                    );
                }

                // 2) If the message is from the bot
                if (msg.sender === 'bot') {
                    // We grab lines that are URLs:
                    const urlLines = parseUrlLines(msg.text);

                    // a) Multiple URL lines → show each as a button:
                    if (urlLines.length > 1) {
                        return (
                            <div key={index} className="mb-2 flex justify-start">
                                <div className="flex items-center mr-2">
                                    <Image
                                        src={'/ssb_logosymbol_dark.svg'}
                                        alt="Chatbot"
                                        width={50}
                                        height={50}
                                        className="min-w-[50px] min-h-[50px]"
                                    />
                                </div>
                                <div className="px-4 py-2 border-2 border-[#274247] bg-[#F0F8F9] text-gray-800 max-w-xl">
                                    <p className="mb-2 font-bold">Flere tilgjengelige lenker:</p>
                                    <div className="flex flex-col gap-2">
                                        {urlLines.map((url, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleActivateJson(url)}
                                                className="inline-block px-3 py-2 bg-[#274247] text-white hover:bg-[#1b2f30] text-left hover:cursor-pointer"
                                            >
                                                {url}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // b) Exactly one URL line → show single button:
                    if (urlLines.length === 1) {
                        const [url] = urlLines;
                        return (
                            <div key={index} className="mb-2 flex justify-start">
                                <div className="flex items-center mr-2">
                                    <Image
                                        src={'/ssb_logosymbol_dark.svg'}
                                        alt="Chatbot"
                                        width={50}
                                        height={50}
                                        className="min-w-[50px] min-h-[50px]"
                                    />
                                </div>
                                <div className="px-4 py-2 border-2 border-[#274247] bg-[#F0F8F9] text-gray-800 max-w-xl">
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

                    // c) No URL lines → plain text message:
                    return (
                        <div key={index} className="mb-2 flex justify-start">
                            <div className="flex items-center mr-2">
                                <Image
                                    src={'/ssb_logosymbol_dark.svg'}
                                    alt="Chatbot"
                                    width={50}
                                    height={50}
                                    className="min-w-[50px] min-h-[50px]"
                                />
                            </div>
                            <div className="px-4 py-2 border-2 border-[#274247] bg-[#F0F8F9] text-gray-800 max-w-xl">
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

                // 3) User message
                return (
                    <div key={index} className="mb-2 flex justify-end">
                        <div className="px-4 py-2 border-2 border-[#274247] bg-[#274247] text-white">
                            {msg.text}
                        </div>
                    </div>
                );
            })}

            {/* "Svarer..." bubble if isLoading */}
            {isLoading && (
                <div className="mb-2 flex justify-start">
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

            <div ref={messagesEndRef} />
        </div>
    );
}
