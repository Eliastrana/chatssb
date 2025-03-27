// PxWebLineChartFullscreen.tsx
import React, {useEffect, useRef, useState} from "react";
import * as d3 from "d3";
import {PxWebData} from "@/app/types";
import DualRangeSlider from "@/app/components/Graphing/util/DualRangeSlider";
import {cartesianProduct} from "@/app/components/Graphing/fullscreen_graphing/cartesianProduct"; // Adjust path as needed

interface LineChartProps {
    data: PxWebData;
    width?: number;
    height?: number;
}

type Combo = { [dimName: string]: string };

interface RegressionPoint {
    x: number;
    y: number;
}

interface RegressionMetrics {
    slope: number;
    intercept: number;
    rSquared: number;
    rmse: number;
}

interface PredictionSeries {
    combo: Combo;
    regressionLine: RegressionPoint[];
    metrics: RegressionMetrics;
}

export const PxWebLineChartFullscreen: React.FC<LineChartProps> = ({
                                                                       data,
                                                                       width = 900,
                                                                       height = 500,
                                                                   }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    const customColors = [
        "#274247",
        "#7E5EE8",
        "#00824d",
        ...d3.schemeCategory10.slice(1),
    ];

    const dimensionEntries = Object.entries(data.dimension);
    let timeDimName: string | undefined;
    if (data.role?.time && data.role.time.length > 0) {
        timeDimName = data.role.time[0];
    } else {
        timeDimName = dimensionEntries.find(
            ([key]) => key.toLowerCase() === "tid"
        )?.[0];
    }
    if (!timeDimName) {
        throw new Error("Could not find time dimension in the PX-Web JSON.");
    }

    const timeDimension = data.dimension[timeDimName];
    const timeCategoryKeys = Object.keys(timeDimension.category.index);
    const timeCategoryLabels = timeDimension.category.label;

    const nonTimeDimensions = dimensionEntries
        .filter(([dimName]) => dimName !== timeDimName)
        .map(([dimName, dim]) => ({ name: dimName, ...dim }));

    const [selectedCategories, setSelectedCategories] = useState<
        Record<string, Set<string>>
    >(() => {
        const initial: Record<string, Set<string>> = {};
        nonTimeDimensions.forEach((dim) => {
            initial[dim.name] = new Set(Object.keys(dim.category.index));
        });
        return initial;
    });

    const handleToggleCategory = (dimName: string, catKey: string) => {
        setSelectedCategories((prev) => {
            const next = { ...prev };
            const oldSet = new Set(next[dimName]);
            if (oldSet.has(catKey)) {
                oldSet.delete(catKey);
            } else {
                oldSet.add(catKey);
            }
            next[dimName] = oldSet;
            return next;
        });
    };

    const dimensionNamesInOrder = Object.keys(data.dimension);
    const dimensionSizesInOrder = data.size;
    const getValue = (coords: Record<string, string>) => {
        let index1D = 0;
        let stride = 1;
        for (let d = dimensionNamesInOrder.length - 1; d >= 0; d--) {
            const dimName = dimensionNamesInOrder[d];
            const catKey = coords[dimName];
            const dimObj = data.dimension[dimName];
            if (!catKey || !dimObj) {
                throw new Error(`Missing coordinate for dimension "${dimName}"`);
            }
            const catIndex = dimObj.category.index[catKey];
            index1D += catIndex * stride;
            stride *= dimensionSizesInOrder[d];
        }
        return data.value[index1D];
    };

    const combos: Combo[] = cartesianProduct(
        nonTimeDimensions.map((dim) => [...selectedCategories[dim.name]]),
        nonTimeDimensions.map((dim) => dim.name)
    );

    const seriesData = combos.map((combo) => {
        const series = timeCategoryKeys.map((timeKey) => {
            const fullCoords = { ...combo, [timeDimName!]: timeKey };
            const yVal = getValue(fullCoords);
            return {
                x: timeCategoryLabels[timeKey] || timeKey,
                y: yVal,
            };
        });
        return { combo, series };
    });

    const [startIndex, setStartIndex] = useState(0);
    const [endIndex, setEndIndex] = useState(timeCategoryKeys.length - 1);

    const visibleSeriesData = seriesData.map((sd) => {
        const slicedSeries = sd.series.slice(startIndex, endIndex + 1);
        return { ...sd, series: slicedSeries };
    });

    const [predictionData, setPredictionData] = useState<PredictionSeries[]>([]);

    function linearRegression(
        points: { x: number; y: number }[]
    ): { slope: number; intercept: number } {
        const n = points.length;
        const sumX = points.reduce((sum, p) => sum + p.x, 0);
        const sumY = points.reduce((sum, p) => sum + p.y, 0);
        const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
        const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

        const denom = n * sumX2 - sumX * sumX;
        const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
        const intercept = (sumY - slope * sumX) / n;
        return { slope, intercept };
    }

    function computeRegressionMetrics(
        points: { x: number; y: number }[],
        slope: number,
        intercept: number
    ): RegressionMetrics {
        const predicted = points.map((p) => slope * p.x + intercept);
        const residuals = points.map((p, i) => p.y - predicted[i]);
        const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
        const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        const ssTot = points.reduce(
            (sum, p) => sum + Math.pow(p.y - meanY, 2),
            0
        );
        const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
        const rmse = Math.sqrt(ssRes / points.length);
        return { slope, intercept, rSquared, rmse };
    }

    const handlePredict = () => {
        const predictionSteps = 5; // number of future steps to predict
        const newPredictionData: PredictionSeries[] = visibleSeriesData.map((sd) => {
            const historicalPoints = sd.series.map((d, i) => ({ x: i, y: d.y }));
            const { slope, intercept } = linearRegression(historicalPoints);
            const metrics = computeRegressionMetrics(historicalPoints, slope, intercept);
            const totalPoints = historicalPoints.length + predictionSteps;
            const regressionLine = Array.from({ length: totalPoints }, (_, i) => ({
                x: i,
                y: slope * i + intercept,
            }));

            return { combo: sd.combo, regressionLine, metrics };
        });
        setPredictionData(newPredictionData);
    };

    const colorScale = d3
        .scaleOrdinal(customColors)
        .domain(d3.range(visibleSeriesData.length).map(String));

    useEffect(() => {
        if (!svgRef.current) return;
        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const originalInnerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const historicalLabels =
            visibleSeriesData.length > 0
                ? visibleSeriesData[0].series.map((d) => d.x)
                : [];

        let extendedDomain = historicalLabels;
        let extraWidth = 0;
        let extendedInnerWidth = originalInnerWidth;

        if (predictionData.length > 0 && historicalLabels.length > 0) {
            const predictionCount =
                predictionData[0].regressionLine.length - historicalLabels.length;
            const futureLabels = Array.from({ length: predictionCount }, (_, i) => `F${i + 1}`);
            extendedDomain = historicalLabels.concat(futureLabels);
            extraWidth =
                predictionCount * (originalInnerWidth / historicalLabels.length);
            extendedInnerWidth = originalInnerWidth + extraWidth;
        }

        const totalSvgWidth = margin.left + margin.right + extendedInnerWidth;
        svgEl.attr("viewBox", `0 0 ${totalSvgWidth} ${height}`);

        const tooltip = d3
            .select("body")
            .append("div")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("padding", "6px 8px")
            .style("background", "#F0F8F9")
            .style("border", "2px solid #274247")
            .style("border-radius", "none")
            .style("font-size", "14px")
            .style("display", "none");

        const svg = svgEl
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3
            .scaleBand<string>()
            .domain(extendedDomain)
            .range([0, extendedInnerWidth])
            .padding(0.2);

        const allHistoricalPoints = visibleSeriesData.flatMap((sd) => sd.series);
        const [minY, maxY] = d3.extent(allHistoricalPoints, (d) => d.y);
        const yScale = d3
            .scaleLinear()
            .domain([Math.min(0, minY ?? 0), maxY ?? 10])
            .range([innerHeight, 0])
            .nice();

        const xAxis = d3.axisBottom<string>(xScale).tickSizeOuter(0);
        svg
            .append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("font-size", "20px")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        const yAxis = d3.axisLeft<number>(yScale);
        svg.append("g").call(yAxis);

        visibleSeriesData.forEach((sd, seriesIndex) => {
            const lineGen = d3
                .line<{ x: string; y: number }>()
                .x((d) => {
                    // Place the point in the center of the band
                    const bandPos = xScale(d.x);
                    return bandPos ? bandPos + xScale.bandwidth() / 2 : 0;
                })
                .y((d) => yScale(d.y));

            svg
                .append("path")
                .datum(sd.series)
                .attr("fill", "none")
                .attr("stroke", colorScale(String(seriesIndex))!)
                .attr("stroke-width", 2)
                .attr("d", lineGen);

            svg
                .selectAll(`.circle-series-${seriesIndex}`)
                .data(sd.series)
                .enter()
                .append("circle")
                .attr("r", 4)
                .attr("cx", (d) => {
                    const bandPos = xScale(d.x);
                    return bandPos ? bandPos + xScale.bandwidth() / 2 : 0;
                })
                .attr("cy", (d) => yScale(d.y))
                .attr("fill", colorScale(String(seriesIndex))!)
                .on("mouseover", function (event, d) {
                    tooltip
                        .style("display", "block")
                        .html(`<strong>${d.x}</strong><br/>Verdi: ${d.y}`);
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", event.pageX + 10 + "px")
                        .style("top", event.pageY + 10 + "px");
                })
                .on("mouseleave", function () {
                    tooltip.style("display", "none");
                });
        });

        if (predictionData.length > 0) {
            predictionData.forEach((pd, seriesIndex) => {
                const seriesLine = d3
                    .line<RegressionPoint>()
                    .x((d) => {
                        const label = extendedDomain[d.x];
                        const bandPos = xScale(label);
                        return bandPos ? bandPos + xScale.bandwidth() / 2 : 0;
                    })
                    .y((d) => yScale(d.y));

                svg
                    .append("path")
                    .datum(pd.regressionLine)
                    .attr("fill", "none")
                    .attr("stroke", colorScale(String(seriesIndex))!)
                    .attr("stroke-width", 2)
                    .attr("stroke-dasharray", "4 2")
                    .attr("d", seriesLine);
            });
        }

        return () => {
            tooltip.remove();
        };
    }, [visibleSeriesData, width, height, startIndex, endIndex, predictionData, colorScale]);

    const [numberPart, ...textParts] = data.label.split(":");
    const textPart = textParts.join(":").trim();

    return (
        <div className="flex flex-row">
            <div className="w-1/6 flex flex-col space-y-4">
                {nonTimeDimensions.map((dim) => {
                    const catKeys = Object.keys(dim.category.label);
                    const catColorMapping = catKeys.reduce((acc, key, index) => {
                        acc[key] = customColors[index % customColors.length];
                        return acc;
                    }, {} as Record<string, string>);

                    return (
                        <div
                            key={dim.name}
                            className="rounded-lg shadow-lg border border-[#C3DCDC] p-2 bg-white max-h-48 overflow-auto w-full bg-clip-padding"
                        >
                            <h3 className="font-bold text-lg mb-1">
                                {dim.label.charAt(0).toUpperCase() + dim.label.slice(1)}
                            </h3>
                            <div className="flex flex-col space-y-1">
                                {Object.entries(dim.category.label).map(([catKey, catLabel]) => {
                                    const isChecked = selectedCategories[dim.name].has(catKey);
                                    const color = catColorMapping[catKey];
                                    return (
                                        <label
                                            key={catKey}
                                            className="inline-flex items-center gap-1"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleCategory(dim.name, catKey)}
                                                className="peer hidden"
                                            />
                                            <div
                                                className="w-4 h-4 border-2 rounded-full flex items-center justify-center transition-all relative"
                                                style={{
                                                    borderColor: color,
                                                    backgroundColor: isChecked ? color : "transparent",
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
                                            <span className="text-xs">{catLabel}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                <h1 className="text-lg font-bold">Verktøy:</h1>

                <button
                    onClick={handlePredict}
                    className="mt-4 px-4 py-2 bg-[#274247] text-white rounded shadow-lg justify-center flex items-center gap-1"
                >
                    <span className="material-symbols-outlined">query_stats</span>
                    <p>Lineær regresjon</p>
                </button>
            </div>

            <div className="w-[60%] flex flex-col space-y-4 ml-12 bg-white p-4 border border-[#C3DCDC] rounded-2xl shadow-lg">
                <div>
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
                    <h1 className="md:text-2xl">{textPart}</h1>
                </div>

                <div className="flex justify-center">
                    <svg ref={svgRef} />
                </div>

                <DualRangeSlider
                    min={0}
                    max={timeCategoryKeys.length - 1}
                    startValue={startIndex}
                    endValue={endIndex}
                    onChange={(newStart, newEnd) => {
                        setStartIndex(newStart);
                        setEndIndex(newEnd);
                    }}
                    timeCategoryLabels={timeCategoryLabels}
                    timeCategoryKeys={timeCategoryKeys}
                />

                {/* Regression summary panel */}
                {predictionData.length > 0 && (
                    <div className="mt-2 p-2 rounded">
                        <h2 className="text-md font-bold mb-2">Regresjonsresultater:</h2>
                        <div className="flex flex-row gap-4 text-xs">
                            {predictionData.map((pd, i) => {
                                const seriesColor = colorScale(String(i));
                                return (
                                    <div
                                        key={i}
                                        className="flex flex-col p-2 border rounded"
                                        style={{ borderLeft: `4px solid ${seriesColor}` }}
                                    >
                                        <h3
                                            className="font-semibold"
                                            style={{ color: seriesColor }}
                                        >
                                            {(() => {
                                                const entries = Object.entries(pd.combo);
                                                const [dimName, catKey] = entries[entries.length - 1];
                                                return data.dimension[dimName].category.label[catKey];
                                            })()}
                                        </h3>
                                        <p>
                                            <span className="font-bold">Likning:</span>{" "}
                                            {`y = ${pd.metrics.slope.toFixed(2)}x + ${pd.metrics.intercept.toFixed(2)}`}
                                        </p>
                                        <p>
                                            <span className="font-bold">R²:</span>{" "}
                                            {pd.metrics.rSquared.toFixed(2)}
                                        </p>
                                        <p>
                                            <span className="font-bold">RMSE:</span>{" "}
                                            {pd.metrics.rmse.toFixed(2)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


