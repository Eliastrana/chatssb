// FullscreenChartDisplay.tsx
import React, {useState} from "react";
import {
    PxWebBarChartFullscreen
} from "@/app/components/Graphing/fullscreen_graphing/PxWebBarChartFullscreen";

import {PxWebData} from "@/app/types";
import {CustomDropdown} from "@/app/components/Graphing/util/CustomDropdown";
import {
    PxWebLineChartFullscreen
} from "@/app/components/Graphing/fullscreen_graphing/PxWebLineChartFullscreen";
import {
    PxWebPieChartFullscreen
} from "@/app/components/Graphing/fullscreen_graphing/PxWebPieChartFullscreen";
import {
    PxWebBubbleChartFullscreen
} from "@/app/components/Graphing/fullscreen_graphing/PxWebBubbleChartFullscreen";
import PxWebTableFullscreen from "@/app/components/Graphing/fullscreen_graphing/PxTableFullscreen";

type ChartType = "bar" | "line" | "pie" | "bubble" | "table";

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
        line: <PxWebLineChartFullscreen data={pxData} width={width} height={height} />,
        pie: <PxWebPieChartFullscreen data={pxData} width={width} height={height} />,
        bubble: <PxWebBubbleChartFullscreen data={pxData} width={width} height={height} />,
        table: <PxWebTableFullscreen data={pxData} />,
    };

    const chartOptions = [
        { label: "Søylediagram", value: "bar" as ChartType },
        { label: "Linjediagram", value: "line" as ChartType },
        { label: "Sektordiagram", value: "pie" as ChartType },
        { label: "Boblediagram", value: "bubble" as ChartType },
        { label: "Tabell", value: "table" as ChartType },
    ];

    return (
        <div className=" p-10 relative">

            {chartMap[chartType]}

            <div className="fixed top-10 right-32 text-xl">
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
