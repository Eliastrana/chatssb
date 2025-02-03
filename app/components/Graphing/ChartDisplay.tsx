import React, { useState } from "react";
import { PxWebLineChart } from "./PxWebLineChart";
import { PxWebBarChart } from "./PxWebBarChart";
import { PxWebPieChart } from "./PxWebPieChart";
import { PxWebBubbleChart } from "./PxWebBubbleChart";
import { PxWebData } from "@/app/types";
import { CustomDropdown } from "./CustomDropdown";

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
    const [chartType, setChartType] = useState<ChartType>("bar");

    const chartMap = {
        bar: <PxWebBarChart data={pxData} width={width} height={height} />,
        line: <PxWebLineChart data={pxData} width={width} height={height} />,
        pie: <PxWebPieChart data={pxData} width={width} height={height} />,
        bubble: <PxWebBubbleChart data={pxData} width={width} height={height} />,
    };

    const chartOptions = [
        { label: "Søylediagram", value: "bar" as ChartType },
        { label: "Linjediagram", value: "line" as ChartType },
        { label: "Sektordiagram", value: "pie" as ChartType },
        { label: "Boblediagram", value: "bubble" as ChartType },
    ];

    return (
        <div className="mt-2 p-2 relative">

            <div className=" mb-4">
            <CustomDropdown
                options={chartOptions}
                selectedValue={chartType}
                onSelect={(newValue) => setChartType(newValue)}
            />

            </div>

            {chartMap[chartType]}
        </div>
    );
};

export default ChartDisplay;
