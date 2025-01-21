"use client";
import Image from 'next/image';
import Linkify from 'linkify-react';
import {Message} from "@/app/types";


interface ChatMessagesProps {
    messages: Message[];
    jsonUrls: string[];
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    handleActivateJson: (url: string) => void;
}

export default function ChatMessages({
                                         messages,
                                         jsonUrls,
                                         isLoading,
                                         messagesEndRef,
                                         handleActivateJson,
                                     }: ChatMessagesProps) {
    return (
        <div className="flex-1 overflow-y-auto mb-4">
            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={`mb-2 flex ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                    {msg.sender === 'bot' && (
                        <div className="flex items-center mr-2">
                            <Image
                                src={'/ssb_logosymbol_dark.svg'}
                                alt="Chatbot"
                                width={50}
                                height={50}
                                className="min-w-[50px] min-h-[50px]"
                            />
                        </div>
                    )}
                    <div
                        className={`px-4 py-2 border-2 border-[#274247] ${
                            msg.sender === 'user'
                                ? 'bg-[#274247] text-white'
                                : 'bg-[#F0F8F9] text-gray-800'
                        }`}
                    >
                        <Linkify
                            options={{
                                defaultProtocol: 'https',
                                target: '_blank',
                                className: 'text-blue-600 underline',
                            }}
                        >
                            {msg.text}
                        </Linkify>
                        {jsonUrls.map((url) => (
                            <div key={url}>
                                <button
                                    className="text-sm text-blue-600 underline mt-2"
                                    onClick={() => handleActivateJson(url)}
                                >
                                    Vis JSON
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

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
