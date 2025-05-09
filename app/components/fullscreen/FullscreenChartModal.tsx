"use client";
import React, {memo, useEffect, useState} from 'react';
import {PxWebData} from "@/app/types";
import FullscreenChartDisplay
    from "@/app/components/Graphing/fullscreen_graphing/FullscreenChartDisplay";

interface FullscreenChartModalProps {
    pxData: PxWebData;
    onClose: () => void;
}

function FullscreenChartModalBase({ pxData, onClose }: FullscreenChartModalProps) {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);


    useEffect(() => {
        const frame = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    const handleClose = () => {
        setClosing(true);
        setVisible(false);

        setTimeout(() => onClose(), 500);
    };

    return (
        <div
            className={`
        fixed inset-0
        transition-all duration-500 
        flex items-center justify-center
        ${
                visible && !closing
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-90'
            }
      `}
            style={{ pointerEvents: "auto" }}
        >
            <button
                onClick={handleClose}
                className="absolute top-2 right-16 z-50 font-bold cursor-pointer"
            >
        <span className="material-symbols-outlined h-8 w-8">
          collapse_content
        </span>
            </button>

            <div className="w-full h-full relative">
                <FullscreenChartDisplay
                    pxData={pxData}
                    width={window.innerWidth}
                    height={window.innerHeight}
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
