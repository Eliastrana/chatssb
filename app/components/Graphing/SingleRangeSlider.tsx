// SingleRangeSlider.tsx
import React, { useEffect, useRef, useState } from "react";

export interface SingleRangeSliderProps {
    min: number;
    max: number;
    value: number;
    onChange: (value: number) => void;
    // These props are used for displaying labels.
    timeCategoryLabels: { [key: string]: string };
    timeCategoryKeys: string[];
}

const SingleRangeSlider: React.FC<SingleRangeSliderProps> = ({
                                                                 min,
                                                                 max,
                                                                 value,
                                                                 onChange,
                                                                 timeCategoryLabels,
                                                                 timeCategoryKeys,
                                                             }) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<boolean>(false);

    // Convert a clientX (pixels) to a slider value between min and max.
    const getValueFromPosition = (clientX: number) => {
        if (!sliderRef.current) return min;
        const rect = sliderRef.current.getBoundingClientRect();
        const relative = clientX - rect.left;
        const percent = Math.min(Math.max(relative / rect.width, 0), 1);
        return Math.round(min + percent * (max - min));
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(true);
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!dragging) return;
        const newValue = getValueFromPosition(e.clientX);
        onChange(newValue);
    };

    const handlePointerUp = () => {
        setDragging(false);
    };

    useEffect(() => {
        if (dragging) {
            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp);
        } else {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        }
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [dragging, value]);

    const valuePercent = ((value - min) / (max - min)) * 100;

    return (
        <div className="flex flex-col bg-[#F0F8F9] p-2">
            <div
                className="relative w-full h-8"
                ref={sliderRef}
                onPointerDown={handlePointerDown}
            >
                {/* Background Track */}
                <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-300 rounded"></div>
                {/* Handle */}
                <div
                    className="absolute top-1/2 w-4 h-4 bg-[#274247] border border-[#274247] rounded-full cursor-pointer"
                    style={{ left: `${valuePercent}%`, transform: "translate(-50%, -50%)" }}
                ></div>
            </div>
            <div className="flex justify-center text-xs font-medium mt-2">
        <span>
          {timeCategoryLabels[timeCategoryKeys[value]]}
        </span>
            </div>
        </div>
    );
};

export default SingleRangeSlider;
