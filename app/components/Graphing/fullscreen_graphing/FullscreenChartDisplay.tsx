// FullscreenChartDisplay.tsx
import React, { useState } from "react";
import { PxWebBarChartFullscreen } from "@/app/components/Graphing/fullscreen_graphing/PxWebBarChartFullscreen";

import { PxWebData } from "@/app/types";
import { CustomDropdown } from "@/app/components/Graphing/CustomDropdown";
import {PxWebLineChart} from "@/app/components/Graphing/PxWebLineChart";
import {PxWebBubbleChart} from "@/app/components/Graphing/PxWebBubbleChart";
import {PxWebPieChart} from "@/app/components/Graphing/PxWebPieChart";

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
        bar: <PxWebBarChartFullscreen data={pxData} width={width} height={height} />,
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
        <div className=" p-10 relative">


            {chartMap[chartType]}

            <div className="hidden fixed top-10 right-32 text-xl">
                <CustomDropdown
                    options={chartOptions}
                    selectedValue={chartType}
                    onSelect={(newValue) => setChartType(newValue)}
                />

            </div>
        </div>
    );
};

export default ChartDisplay;
