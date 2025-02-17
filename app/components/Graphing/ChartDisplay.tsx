import React, { useState } from "react";
import * as d3 from "d3";
import { BarChart } from "./charts/BarChart";
import { LineChart } from "./charts/LineChart";
import { PieChart } from "./charts/PieChart";
import { BubbleChart } from "./charts/BubbleChart";
import DualRangeSlider from "./util/DualRangeSlider";
import SingleRangeSlider from "./util/SingleRangeSlider";
import { PxWebData } from "@/app/types";
import { usePxWebData } from "@/app/components/Graphing/usePxWebData";
import { CustomDropdown } from "@/app/components/Graphing/util/CustomDropdown";

const customColors = [
    "#274247",
    "#7E5EE8",
    "#00824d",
    ...d3.schemeCategory10.slice(3),
];

type ChartType = "bar" | "line" | "pie" | "bubble";

interface ChartDisplayProps {
    pxData: PxWebData;
    width?: number;
    height?: number;
}

export const ChartDisplay: React.FC<ChartDisplayProps> = ({
                                                              pxData,
                                                              width = 600,
                                                              height = 400,
                                                          }) => {
    const {
        timeKeys,
        timeLabels,
        startIndex,
        endIndex,
        setRange,
        timeIndex,
        setTimeIndex,
        nonTimeDimensions,
        selectedCategories,
        toggleCategory,
        barLineSeriesData,
        pieBubbleData,
    } = usePxWebData(pxData);

    const [chartType, setChartType] = useState<ChartType>("bar");

    const chartOptions = [
        { label: "Søylediagram", value: "bar" },
        { label: "Linjediagram", value: "line" },
        { label: "Sektordiagram", value: "pie" },
        { label: "Boblediagram", value: "bubble" },
    ] as const;

    const [numberPart, ...restParts] = pxData.label.split(":");
    const textPart = restParts.join(":").trim();
    const statVarDim = nonTimeDimensions.find(
        (dim) => dim.label.toLowerCase() === "statistikkvariabel"
    ) || nonTimeDimensions[0];

    const statVarDimName = statVarDim?.name;

    const domainKeys = statVarDim ? statVarDim.categoryKeys : [];
    const statVarColorScale = d3
        .scaleOrdinal<string>()
        .domain(domainKeys)
        .range(customColors);

    return (
        <div className="mt-2 p-2 relative">

            <CustomDropdown
                options={chartOptions}
                selectedValue={chartType}
                onSelect={(newValue) => setChartType(newValue)}
            />

            <div className="mt-4 mb-4">
                <h3 className="font-bold text-base mb-2">Dimensjoner:</h3>
                <div className="flex flex-wrap gap-4">
                    {nonTimeDimensions.map((dim) => {

                        const isStatVar = dim.name === statVarDimName;

                        return (
                            <div
                                key={dim.name}
                                className="border border-[#C3DCDC] rounded-md shadow-sm p-2 bg-white max-h-48 overflow-auto"
                            >
                                <h4 className="font-semibold text-base mb-1">
                                    {dim.label.charAt(0).toUpperCase() + dim.label.slice(1)}
                                </h4>
                                <div className="flex flex-col space-y-1">
                                    {dim.categoryKeys.map((catKey, idx) => {
                                        const isChecked = selectedCategories[dim.name].has(catKey);


                                        const fillColor = isStatVar
                                            ? statVarColorScale(catKey)
                                            : customColors[idx % customColors.length]; // fallback

                                        return (
                                            <label
                                                key={catKey}
                                                className="inline-flex items-center gap-1"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleCategory(dim.name, catKey)}
                                                    className="peer hidden"
                                                />
                                                <div
                                                    className="w-4 h-4 border-2 rounded-full flex items-center justify-center transition-all relative"
                                                    style={{
                                                        borderColor: fillColor,
                                                        backgroundColor: isChecked ? fillColor : "transparent",
                                                    }}
                                                >
                                                    {isChecked && (
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            height="24px"
                                                            viewBox="0 -960 960 960"
                                                            width="24px"
                                                            fill="#F0F8F9"
                                                        >
                                                            <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className="text-xs">{dim.categoryLabels[catKey]}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Link + Title */}
            <div className="mb-4">
                <div className="flex items-center gap-1">
                    <a
                        href={`https://www.ssb.no/statbank/table/${numberPart.trim()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 text-xl hover:underline"
                    >
                        {numberPart.trim()}
                    </a>
                    <span className="material-symbols-outlined text-gray-400">
            open_in_new
          </span>
                </div>
                <h1 className="md:text-2xl font-bold">{textPart}</h1>
            </div>

            <div className="z-10">
                {chartType === "bar" && (
                    <BarChart
                        width={width}
                        height={height}
                        data={barLineSeriesData}
                        colorDim={statVarDimName}
                        customColorScale={statVarColorScale}
                    />
                )}
                {chartType === "line" && (
                        <LineChart
                            width={width}
                            height={height}
                            data={barLineSeriesData}
                            colorDim={statVarDimName}
                            customColorScale={statVarColorScale}
                        />
                )}
                {chartType === "pie" && (
                    <PieChart
                        width={width}
                        height={height}
                        data={pieBubbleData}
                        dimension={pxData.dimension}
                        colorDim={statVarDimName}
                        customColorScale={statVarColorScale}
                    />
                )}
                {chartType === "bubble" && (
                        <BubbleChart
                            width={width}
                            height={height}
                            data={pieBubbleData}
                            colorDim={statVarDimName}
                            customColorScale={statVarColorScale}
                        />
                )}
            </div>

            <div className="mb-4">
                {chartType === "bar" || chartType === "line" ? (
                    <DualRangeSlider
                        min={0}
                        max={timeKeys.length - 1}
                        startValue={startIndex}
                        endValue={endIndex}
                        onChange={(newStart, newEnd) => setRange(newStart, newEnd)}
                        timeCategoryLabels={timeLabels}
                        timeCategoryKeys={timeKeys}
                    />
                ) : (
                    <SingleRangeSlider
                        min={0}
                        max={timeKeys.length - 1}
                        value={timeIndex}
                        onChange={(val) => setTimeIndex(val)}
                        timeCategoryLabels={timeLabels}
                        timeCategoryKeys={timeKeys}
                    />
                )}
            </div>
        </div>
    );
};
