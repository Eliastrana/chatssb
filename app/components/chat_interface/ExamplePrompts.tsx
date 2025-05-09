"use client";
import React, { useState, useEffect } from "react";

interface ExamplePromptsProps {
    onSelectPrompt: (prompt: string) => void;
}

export default function ExamplePrompts({ onSelectPrompt }: ExamplePromptsProps) {
    const prompts = [
        "Hvor mange bevere ble skutt i sesongen 23/24?",
        "Hvor mange mennesker het Trygve i 2024?",
        "Hva var Norges BNP fra 2010-2020?",
        "Hvor mange mennesker bor i Oslo?",
        "Hva var gjennomsnittlig årslønn i 2020?",
        "Hvor mange elektriske biler ble solgt i april?",
    ];

    // start empty so server and client render the same thing
    const [displayedPrompts, setDisplayedPrompts] = useState<string[]>([]);

    useEffect(() => {
        // only runs on client, after hydration
        const shuffled = [...prompts].sort(() => Math.random() - 0.5);
        setDisplayedPrompts(shuffled.slice(0, 3));
    }, []);

    // you can return null or a tiny skeleton/loading state here
    if (displayedPrompts.length === 0) {
        return (
            <div className="flex flex-col items-center mt-4 w-full max-w-3xl mx-auto">
                <h2 className="text-md md:text-xl font-semibold text-gray-800">
                    Forslag:
                </h2>
                <div className="grid grid-cols-3 gap-2 mt-4">
                    {/* simple blank boxes */}
                    {Array(3)
                        .fill(null)
                        .map((_, i) => (
                            <div
                                key={i}
                                className="h-8 md:h-10 bg-gray-200 rounded-lg animate-pulse"
                            />
                        ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center mt-4 w-full max-w-3xl mx-auto">
            <h2 className="text-md md:text-xl font-semibold text-gray-800">
                Forslag:
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4 mt-4">
                {displayedPrompts.map((prompt, index) => (
                    <button
                        key={index}
                        className="bg-[#274247] rounded-lg text-white px-2 md:px-4 py-1 md:py-2 shadow-lg text-xs md:text-lg hover:bg-[#1b3134] transition-colors"
                        onClick={() => onSelectPrompt(prompt)}
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
}
