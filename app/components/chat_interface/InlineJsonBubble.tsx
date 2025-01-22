"use client";
import React from 'react';
import { parseLinksFromJson, parseSsbSubItems } from '@/app/utils/jsonParsing';

interface InlineJsonBubbleProps {
    data: unknown;
    parentUrl: string;
    onActivateJson: (url: string) => void;
    onShowTable: (tableId: string) => void;
}

export default function InlineJsonBubble({
                                             data,
                                             //parentUrl,
                                             onActivateJson,
                                             onShowTable,
                                         }: InlineJsonBubbleProps) {
    const rawLinks = parseLinksFromJson(data);
    const subItems = parseSsbSubItems(data);

    return (
        <div className="px-4 py-2 border-2 border-[#274247] bg-[#F0F8F9]
                        text-gray-800 whitespace-pre-wrap break-words max-w-xl h-96 overflow-auto">

            {/* 1) Show raw links found in the JSON */}
            {rawLinks.length > 0 && (
                <div className="mt-4">
                    <p className="font-bold">Klikk for å hente dypere lenker:</p>
                    <div className="flex flex-col gap-2 mt-2">
                        {rawLinks.map((url, i) => (
                            <button
                                key={i}
                                onClick={() => onActivateJson(url)}
                                className="px-3 py-2 bg-[#274247] text-white hover:bg-[#1b2f30] text-left"
                            >
                                {url}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 2) Show sub-items if any */}
            {subItems.length > 0 && (
                <div className="mt-4">
                    <h1 className="">Vi trenger litt flere detaljer:</h1>
                    <div className="flex flex-col gap-2 mt-2">
                        {subItems.map((item, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    if (item.tableId) {
                                        onShowTable(item.tableId);
                                    } else {
                                        console.log('No tableId found – fallback handling?');
                                    }
                                }}
                                className="px-3 py-2 bg-[#274247] text-white hover:bg-[#1b2f30] rounded text-left"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
