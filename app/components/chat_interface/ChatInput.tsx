"use client";

import React from 'react';

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    handleSend: (userMessage: string) => void;
    onSend?: () => void;
}

export default function ChatInput({
                                      input,
                                      setInput,
                                      isLoading,
                                      handleSend,
                                      onSend,
                                  }: ChatInputProps) {

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleLocalSend();
        }
    };

    const handleLocalSend = () => {
        if (!input.trim()) return;
        handleSend(input);
        setInput('');
        if (onSend) {
            onSend();
        }
    };

    return (
        <div className="fixed bottom-10 w-full flex justify-center items-center px-4 z-20">
            <div className="w-full md:w-1/2 flex items-center">
                <input
                    type="text"
                    className="flex-grow border-2 border-[#274247] bg-[#F0F8F9] text-gray-800 px-4 py-2 focus:outline-none"
                    placeholder="Hva leter du etter?"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isLoading}
                />
                <button
                    className={`bg-[#274247] text-white px-4 py-2 border-2 border-[#274247] border-l-0 focus:outline-none ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={handleLocalSend}
                    disabled={isLoading}
                >
                    Send
                </button>
            </div>
        </div>
    );
}
