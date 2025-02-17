// DualRangeSlider.tsx
import React, { useEffect, useRef, useState } from "react";

export interface DualRangeSliderProps {
    min: number;
    max: number;
    startValue: number;
    endValue: number;
    onChange: (start: number, end: number) => void;
    timeCategoryLabels: { [key: string]: string };
    timeCategoryKeys: string[];
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
                                                             min,
                                                             max,
                                                             startValue,
                                                             endValue,
                                                             onChange,
                                                             timeCategoryLabels,
                                                             timeCategoryKeys,
                                                         }) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<"start" | "end" | null>(null);

    const getValueFromPosition = (clientX: number) => {
        if (!sliderRef.current) return min;
        const rect = sliderRef.current.getBoundingClientRect();
        const relative = clientX - rect.left;
        const percent = Math.min(Math.max(relative / rect.width, 0), 1);
        return Math.round(min + percent * (max - min));
    };

    const handlePointerDown = (
        e: React.PointerEvent<HTMLDivElement>,
        handle: "start" | "end"
    ) => {
        e.preventDefault();
        setDragging(handle);
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!dragging) return;
        const newValue = getValueFromPosition(e.clientX);
        if (dragging === "start") {
            if (newValue < endValue) {
                onChange(newValue, endValue);
            }
        } else if (dragging === "end") {
            if (newValue > startValue) {
                onChange(startValue, newValue);
            }
        }
    };

    const handlePointerUp = () => {
        setDragging(null);
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
    }, [dragging, startValue, endValue]);

    const startPercent = ((startValue - min) / (max - min)) * 100;
    const endPercent = ((endValue - min) / (max - min)) * 100;

    return (
        <div className="flex flex-col">
            <div className="relative w-full h-8" ref={sliderRef}>
                <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-300 rounded"></div>
                <div
                    className="absolute top-1/2 transform -translate-y-1/2 h-1 bg-[#274247] rounded"
                    style={{
                        left: `${startPercent}%`,
                        width: `${endPercent - startPercent}%`,
                    }}
                ></div>
                <div
                    className="absolute top-1/2 w-4 h-4 bg-white border border-[#274247] rounded-full cursor-pointer"
                    style={{ left: `${startPercent}%`, transform: "translate(-50%, -50%)" }}
                    onPointerDown={(e) => handlePointerDown(e, "start")}
                ></div>
                <div
                    className="absolute top-1/2 w-4 h-4 bg-white border border-[#274247] rounded-full cursor-pointer"
                    style={{ left: `${endPercent}%`, transform: "translate(-50%, -50%)" }}
                    onPointerDown={(e) => handlePointerDown(e, "end")}
                ></div>
            </div>
            <div className="flex justify-between text-xs font-medium">
                <div>
                    <strong>Start:</strong> {timeCategoryLabels[timeCategoryKeys[startValue]]}
                </div>
                <div>
                    <strong>Slutt:</strong> {timeCategoryLabels[timeCategoryKeys[endValue]]}
                </div>
            </div>
        </div>
    );
};

export default DualRangeSlider;
