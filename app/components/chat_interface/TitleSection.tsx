"use client";
import Image from 'next/image';
import { useEffect } from 'react';
import "./chat.css"


interface TitleSectionProps {
    showTitle: boolean;
    setShowTitle: (value: boolean) => void;
}

export default function TitleSection({ showTitle, setShowTitle }: TitleSectionProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTitle(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [setShowTitle]);

    return (
        <>
            {showTitle && (
                <div
                    className={`absolute flex flex-col items-center transition-opacity duration-1000 ${
                        showTitle ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <Image
                        src="/ssb_logo_dark.svg"
                        alt="Chatbot"
                        width={600}
                        height={200}
                        className="mt-8"
                    />
                    <div className="mt-4">
                        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12"></div>
                    </div>
                </div>
            )}
        </>
    );
}
