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

interface ParsedLinkItem {
    title: string;
    url: string;
}

function parseMarkdownUrlList(text: string) {
    const regex = /^\d+\.\s+\*\*(.+?)\*\*\s*:\s*-\s*(https?:\/\/\S+)/gm;
    const matches = [...text.matchAll(regex)];
    return matches.map((match) => ({
        title: match[1].trim(),
        url: match[2].trim(),
    }));
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
                // ─────────────────────────────────────────────────────────────────
                // 1) If this is a JSON message, show a new bubble with the data
                // ─────────────────────────────────────────────────────────────────
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

                // ─────────────────────────────────────────────────────────────────
                // 2) If from bot (normal text), check for multiple/single item
                // ─────────────────────────────────────────────────────────────────
                if (msg.sender === 'bot') {
                    const parsedItems = parseMarkdownUrlList(msg.text);

                    // a) Multiple items → show list of "Vis JSON" buttons
                    if (parsedItems.length > 1) {
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
                                    <p className="mb-2 font-bold">Her er flere tabeller du kan klikke på:</p>
                                    <div className="flex flex-col gap-2">
                                        {parsedItems.map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
                                            >
                                                <button
                                                    className="inline-block px-3 py-2 bg-[#274247] text-white hover:bg-[#1b2f30] text-left hover:cursor-pointer rounded"

                                                    onClick={() => handleActivateJson(item.url)}

                                                >
                                                    {item.title}
                                                </button>

                                                {/*<button*/}
                                                {/*    className="inline-block px-2 py-1 bg-[#274247] text-white hover:bg-[#1b2f30] rounded"*/}
                                                {/*    onClick={() => handleUserSelectedLink(item.url)}*/}
                                                {/*>*/}
                                                {/*    Link*/}
                                                {/*</button>*/}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // b) Single item → show one "Vis JSON"
                    if (parsedItems.length === 1) {
                        const [item] = parsedItems;
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
                                    <p className="mb-2 font-bold">{item.title}</p>
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline break-all mr-4"
                                    >
                                        {item.url}
                                    </a>
                                    <button
                                        onClick={() => handleActivateJson(item.url)}
                                        className="inline-block ml-0 mt-2 sm:mt-0 sm:ml-2 px-2 py-1 bg-[#274247] text-white hover:bg-[#1b2f30] rounded"
                                    >
                                        Vis JSON
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // c) No items (normal text only)
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

                // ─────────────────────────────────────────────────────────────────
                // 3) User message
                // ─────────────────────────────────────────────────────────────────
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
