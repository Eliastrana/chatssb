// PxWebBarChartFullscreen.tsx
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { PxWebData } from "@/app/types";
import DualRangeSlider from "@/app/components/Graphing/DualRangeSlider"; // Adjust the path as needed

interface BarChartProps {
    data: PxWebData;
    width?: number;
    height?: number;
}

export const PxWebBarChartFullscreen: React.FC<BarChartProps> = ({
                                                           data,
                                                           width = 900,
                                                           height = 500,
                                                       }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    // ---- 1) Identify which dimension is time, which are others ----
    const dimensionEntries = Object.entries(data.dimension);

    let timeDimName: string | undefined = undefined;
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

    // Identify non-time dimensions for filtering
    const nonTimeDimensions = dimensionEntries
        .filter(([dimName]) => dimName !== timeDimName)
        .map(([dimName, dim]) => ({ name: dimName, ...dim }));

    // ---- 2) State for which categories are selected for each non-time dimension ----
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

    // ---- 3) Build a function to retrieve `value` from the data.value array ----
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

    // ---- 4) Build the list of "series" (combos) to plot (cross-product) ----
    type Combo = { [dimName: string]: string };
    const combos: Combo[] = cartesianProduct(
        nonTimeDimensions.map((dim) => [...selectedCategories[dim.name]]),
        nonTimeDimensions.map((dim) => dim.name)
    );

    const seriesData = combos.map((combo) => {
        const series = timeCategoryKeys.map((timeKey) => {
            const fullCoords = { ...combo, [timeDimName]: timeKey };
            const yVal = getValue(fullCoords);
            return {
                x: timeCategoryLabels[timeKey] || timeKey,
                y: yVal,
            };
        });
        return { combo, series };
    });

    // ---- 5) Add state for the visible time range ----
    const [startIndex, setStartIndex] = useState(0);
    const [endIndex, setEndIndex] = useState(timeCategoryKeys.length - 1);

    const visibleSeriesData = seriesData.map((sd) => {
        const slicedSeries = sd.series.slice(startIndex, endIndex + 1);
        return { ...sd, series: slicedSeries };
    });

    // ---- 6) Render the D3 chart in a useEffect ----
    useEffect(() => {
        if (!svgRef.current) return;
        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const svg = svgEl
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const allPoints = visibleSeriesData.flatMap((sd) => sd.series);
        const xDomain =
            visibleSeriesData.length > 0
                ? visibleSeriesData[0].series.map((d) => d.x)
                : [];
        const xScale = d3
            .scaleBand<string>()
            .domain(xDomain)
            .range([0, innerWidth])
            .padding(0.2);
        const xSubgroup = d3
            .scaleBand<number>()
            .domain(d3.range(visibleSeriesData.length))
            .range([0, xScale.bandwidth()])
            .padding(0.05);
        const [minY, maxY] = d3.extent(allPoints, (d) => d.y);
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

        const color = d3
            .scaleOrdinal(d3.schemeCategory10)
            .domain(d3.range(visibleSeriesData.length).map(String));

        const timeGroups = svg
            .selectAll<SVGGElement, string>(".time-group")
            .data(xDomain)
            .enter()
            .append("g")
            .attr("class", "time-group")
            .attr("transform", (d) => `translate(${xScale(d)},0)`);

        const bars = timeGroups
            .selectAll<SVGRectElement, string>("rect")
            .data((timeLabel) => {
                return visibleSeriesData.map((sd, i) => {
                    const point = sd.series.find((pt) => pt.x === timeLabel);
                    return {
                        comboIndex: i,
                        timeLabel,
                        value: point?.y ?? 0,
                    };
                });
            })
            .enter()
            .append("rect")
            .attr("x", (d) => xSubgroup(d.comboIndex)!)
            .attr("width", xSubgroup.bandwidth())
            .attr("fill", (d) => color(String(d.comboIndex))!)
            .attr("y", innerHeight)
            .attr("height", 0)
            .on("mouseover", function (event, d) {
                tooltip.style("display", "block");
                tooltip.html(
                    `<strong>${d.timeLabel}</strong><br/>Verdi: ${d.value}`
                );
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY + 10 + "px");
            })
            .on("mouseleave", function () {
                tooltip.style("display", "none");
            });
        bars
            .transition()
            .duration(400)
            .attr("y", (d) => yScale(d.value))
            .attr("height", (d) => innerHeight - yScale(d.value));
        return () => {
            tooltip.remove();
        };
    }, [visibleSeriesData, width, height, startIndex, endIndex]);

    const [numberPart, ...textParts] = data.label.split(":");
    const textPart = textParts.join(":").trim();

    return (
        <div className="flex flex-row">
            <div className="w-1/6  flex flex-col space-y-4">
                {nonTimeDimensions.map((dim) => (
                    <div
                        key={dim.name}
                        className="rounded-lg shadow-lg border-[#274247] p-2 bg-white max-h-48 overflow-auto  w-full bg-clip-padding "
                    >
                        <h3 className="font-bold text-lg mb-1">
                            {dim.label.charAt(0).toUpperCase() + dim.label.slice(1)}
                        </h3>
                        <div className="flex flex-col space-y-1">
                            {Object.entries(dim.category.label).map(
                                ([catKey, catLabel]) => {
                                    const isChecked = selectedCategories[dim.name].has(catKey);
                                    return (
                                        <label
                                            key={catKey}
                                            className="inline-flex items-center gap-1"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() =>
                                                    handleToggleCategory(dim.name, catKey)
                                                }
                                                className="peer hidden"
                                            />
                                            <div
                                                className="w-4 h-4 border-2 border-[#274247] rounded-full flex items-center justify-center
                                                        peer-checked:bg-[#274247] peer-checked:border-[#274247] transition-all relative"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    height="24px"
                                                    viewBox="0 -960 960 960"
                                                    width="24px"
                                                    fill="#F0F8F9"
                                                >
                                                    <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                                                </svg>
                                            </div>
                                            <span className="text-xs">{catLabel}</span>
                                        </label>
                                    );
                                }
                            )}
                        </div>
                    </div>
                ))}
            </div>


            <div className="w-[60%] flex flex-col space-y-4 ml-12 bg-white p-4 border-[#274247] rounded-2xl shadow-lg">
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

                        <span className="material-symbols-outlined text-gray-400">open_in_new</span>
                    </div>
                    <h1 className="md:text-2xl">{textPart}</h1>
                </div>

                <div className="flex justify-center">
                    <svg
                        ref={svgRef}
                    />
                </div>


                {/* Dual range slider */}
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
            </div>

        </div>
    );
};

function cartesianProduct(
    arraysOfKeys: string[][],
    dimensionNames: string[]
): Array<{ [dimName: string]: string }> {
    if (arraysOfKeys.length === 0) return [];
    let result: Array<Record<string, string>> = [{}];
    arraysOfKeys.forEach((keys, dimIndex) => {
        const tmp: Array<Record<string, string>> = [];
        for (const comboSoFar of result) {
            for (const k of keys) {
                tmp.push({
                    ...comboSoFar,
                    [dimensionNames[dimIndex]]: k,
                });
            }
        }
        result = tmp;
    });
    return result;
}
