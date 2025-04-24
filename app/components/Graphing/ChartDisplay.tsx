import React, { useMemo, useState } from "react";
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
import DimensionSelector from "@/app/components/Graphing/util/DimensionSelector";

const customColors = ["#274247", "#7E5EE8", "#00824d", ...d3.schemeCategory10.slice(3)];
type ChartType = "bar" | "line" | "pie" | "bubble";

interface ChartDisplayProps {
    pxData: PxWebData;
    width?: number;
    height?: number;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({
                                                       pxData,
                                                       width = 600,
                                                       height = 400,
                                                   }) => {
    /* chart-type selector */
    const [chartType, setChartType] = useState<ChartType>("bar");
    const chartOptions = [
        { label: "Søylediagram", value: "bar" },
        { label: "Linjediagram", value: "line" },
        { label: "Sektordiagram", value: "pie" },
        { label: "Boblediagram", value: "bubble" },
    ] as const;

    /* heavy data hook */
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

    /* helpers */
    const statVarDim = useMemo(
        () =>
            nonTimeDimensions.find((d) => d.label.toLowerCase() === "statistikkvariabel") ??
            nonTimeDimensions[0],
        [nonTimeDimensions],
    );
    const statVarDimName = statVarDim?.name;
    const statVarColorScale = useMemo(
        () =>
            d3
                .scaleOrdinal<string>()
                .domain(statVarDim ? statVarDim.categoryKeys : [])
                .range(customColors),
        [statVarDim],
    );

    /* bundle for stable dependency */
    const chartInput = useMemo(
        () => ({
            chartType,
            barLineSeriesData,
            pieBubbleData,
            statVarDimName,
            statVarColorScale,
            width,
            height,
        }),
        [
            chartType,
            barLineSeriesData,
            pieBubbleData,
            statVarDimName,
            statVarColorScale,
            width,
            height,
        ],
    );

    const chartElement = useMemo(() => {
        switch (chartInput.chartType) {
            case "bar":
                return (
                    <BarChart
                        width={chartInput.width}
                        height={chartInput.height}
                        data={chartInput.barLineSeriesData}
                        colorDim={chartInput.statVarDimName}
                        customColorScale={chartInput.statVarColorScale}
                    />
                );
            case "line":
                return (
                    <LineChart
                        width={chartInput.width}
                        height={chartInput.height}
                        data={chartInput.barLineSeriesData}
                        colorDim={chartInput.statVarDimName}
                        customColorScale={chartInput.statVarColorScale}
                    />
                );
            case "pie":
                return (
                    <PieChart
                        width={chartInput.width}
                        height={chartInput.height}
                        data={chartInput.pieBubbleData}
                        dimension={pxData.dimension}
                        colorDim={chartInput.statVarDimName}
                        customColorScale={chartInput.statVarColorScale}
                    />
                );
            case "bubble":
            default:
                return (
                    <BubbleChart
                        width={chartInput.width}
                        height={chartInput.height}
                        data={chartInput.pieBubbleData}
                        colorDim={chartInput.statVarDimName}
                        customColorScale={chartInput.statVarColorScale}
                    />
                );
        }
    }, [chartInput, pxData.dimension]);

    /* title helper */
    const [numberPart, ...restParts] = pxData.label.split(":");
    const textPart = restParts.join(":").trim();

    /* render */
    return (
        <div className="mt-2 p-2 relative">
            {/* chart type selector */}
            <CustomDropdown options={chartOptions} selectedValue={chartType} onSelect={setChartType} />

            {/* dimension selectors */}
            <div className="mt-4 mb-4">
                <h3 className="font-bold text-base mb-2">Dimensjoner:</h3>
                <div className="flex flex-wrap gap-4">
                    {nonTimeDimensions.map((dim) => (
                        <DimensionSelector
                            key={dim.name}
                            dim={dim}
                            isStatVar={dim.name === statVarDimName}
                            statVarColorScale={statVarColorScale}
                            selectedCategories={selectedCategories}
                            toggleCategory={toggleCategory}
                        />
                    ))}
                </div>
            </div>

            {/* title + link */}
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
                    <span className="material-symbols-outlined text-gray-400">open_in_new</span>
                </div>
                <h1 className="md:text-2xl font-bold">{textPart}</h1>
            </div>

            {/* chart */}
            <div className="z-10">{chartElement}</div>

            {/* time controls */}
            <div className="mb-4">
                {chartType === "bar" || chartType === "line" ? (
                    <DualRangeSlider
                        min={0}
                        max={timeKeys.length - 1}
                        startValue={startIndex}
                        endValue={endIndex}
                        onChange={(s, e) => setRange(s, e)}
                        timeCategoryLabels={timeLabels}
                        timeCategoryKeys={timeKeys}
                    />
                ) : (
                    <SingleRangeSlider
                        min={0}
                        max={timeKeys.length - 1}
                        value={timeIndex}
                        onChange={setTimeIndex}
                        timeCategoryLabels={timeLabels}
                        timeCategoryKeys={timeKeys}
                    />
                )}
            </div>
        </div>
    );
};

export default ChartDisplay;
