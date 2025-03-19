'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const IOSToggleButton = () => {
    const [enabled, setEnabled] = useState(false);
    const router = useRouter();

    const togglePages = () => {
        const newEnabled = !enabled;
        setEnabled(newEnabled);
        if (newEnabled) {
            router.push('/dev');
        } else {
            router.push('/');
        }
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={togglePages}
            className={`relative inline-flex items-center h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
                enabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
        >
            <span className="sr-only">Toggle switch</span>
            <span
                className={`inline-block w-5 h-5 bg-white rounded-full shadow transform ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
    );
};

export default IOSToggleButton;
