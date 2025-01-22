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
    handleShowTable: (tableId: string) => void;
}

export default function ChatMessages({
                                         messages,
                                         jsonUrls,
                                         isLoading,
                                         messagesEndRef,
                                         handleActivateJson,
                                         handleUserSelectedLink,
                                         handleShowTable,
                                     }: ChatMessagesProps) {
    return (
        <div className="flex-1 overflow-y-auto mb-4 z-10">
            {messages.map((msg, index) => {
                // JSON bubble:
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
                            <InlineJsonBubble
                                data={msg.jsonData}
                                parentUrl={msg.jsonUrl ?? ''}
                                onActivateJson={handleActivateJson}
                                onShowTable={handleShowTable}
                            />
                        </div>
                    );
                }

                // BOT message:
                if (msg.sender === 'bot') {
                    // Chat skal svare med linker, denne leser hver linje og viser linken
                    // frem i hver sin knapp.
                    const lines = msg.text
                        .split('\n')
                        .map((line) => line.trim())
                        .filter((l) => l.startsWith('http'));

                    // Her visualiseres de hvis den finner mer enn 1 link
                    if (lines.length > 1) {
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

                    // Her visualiserer den innholdet hvis det bare er en link,
                    // fordi da trenger den ikke å lede brukeren videre
                    if (lines.length === 1) {
                        const [url] = lines;
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

                    // Dette er vanlige tekst respons, og fungerer som "else" i denne situasjonen
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

                // Formatering av brukeren sine meldinger
                return (
                    <div key={index} className="mb-2 flex justify-end">
                        <div className="px-4 py-2 border-2 border-[#274247] bg-[#274247] text-white">
                            {msg.text}
                        </div>
                    </div>
                );
            })}

            {/* Viser "Svarer..." mens den jobber */}
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
