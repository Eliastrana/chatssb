"use client";
import React from 'react';

interface ExamplePromptsProps {
    onSelectPrompt: (prompt: string) => void;
}

export default function ExamplePrompts({ onSelectPrompt }: ExamplePromptsProps) {
    const prompts = [
        "Hvor mye CO₂ slipper Norge ut per innbygger?",
        "Hvor mye tjente kvinner fra 2000-2010?",
        "Hva var Norges BNP fra 2010-2020?"
    ];

    return (
        <div className="flex flex-col items-center mt-4">
            <h2 className="text-md md:text-xl font-semibold text-gray-800">Vi kan hjelpe deg med:</h2>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4 mt-4">
                {prompts.map((prompt, index) => (
                    <button
                        key={index}
                        className="bg-[#274247] text-white px-2 md:px-4 py-1 md:py-2 shadow-lg text-xs md:text-lg hover:bg-[#1b3134] transition-colors"
                        onClick={() => onSelectPrompt(prompt)}
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
}
