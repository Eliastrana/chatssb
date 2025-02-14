"use client";
import React, { useState, useEffect, memo } from 'react';
import { PxWebData } from "@/app/types";
import FullscreenChartDisplay from "@/app/components/Graphing/fullscreen_graphing/FullscreenChartDisplay";

interface FullscreenChartModalProps {
    pxData: PxWebData;
    onClose: () => void;
}

function FullscreenChartModalBase({ pxData, onClose }: FullscreenChartModalProps) {
    const [dimensions, setDimensions] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="fixed inset-0 bg-[#F0F8F9] overflow-hidden scrollbar-hide">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 text-3xl font-bold"
            >
                <span className="material-symbols-outlined">
                    collapse_content
                </span>
            </button>

            <div className="w-full h-full relative">
            <FullscreenChartDisplay
                    pxData={pxData}
                    width={dimensions.width}
                    height={dimensions.height}
                />
            </div>
        </div>
    );
}

export const FullscreenChartModal = memo(FullscreenChartModalBase, (prev, next) => {
    if (prev.pxData !== next.pxData) return false;
    return prev.onClose === next.onClose;

});

export default FullscreenChartModal;
