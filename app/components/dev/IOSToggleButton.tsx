'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const IOSToggleButton = () => {
    const router = useRouter();
    const pathname = usePathname();
    // Set the initial state based on the current path
    const [enabled, setEnabled] = useState(pathname === '/dev');

    // Update the toggle state if the pathname changes
    useEffect(() => {
        setEnabled(pathname === '/dev');
    }, [pathname]);

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
                enabled ? 'bg-[#274247]' : 'bg-gray-300'
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
