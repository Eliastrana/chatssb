"use client";
import React from 'react';

interface ExamplePromptsProps {
    onSelectPrompt: (prompt: string) => void;
}

export default function ExamplePrompts({ onSelectPrompt }: ExamplePromptsProps) {
    const prompts = [
        "Hva var inflasjonsraten i Norge fra 2007-2011?",
        "Hvor mye tjente folk i gjennomsnitt fra 2010-2020?",
        "Hvor mange folk var det i norge fra 2000-2010 per år?"
    ];

    return (
        <div className="flex flex-col items-center mt-4">
            <h2 className="text-xl font-semibold text-gray-800">Vi kan hjelpe deg med:</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {prompts.map((prompt, index) => (
                    <button
                        key={index}
                        className="bg-[#274247] text-white px-4 py-2 shadow-lg text-lg hover:bg-[#1b3134] transition-colors"
                        onClick={() => onSelectPrompt(prompt)}
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
}
