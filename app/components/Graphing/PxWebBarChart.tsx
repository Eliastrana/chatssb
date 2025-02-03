import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {PxWebData} from "@/app/types";


interface BarChartProps {
    data: PxWebData;
    width?: number;
    height?: number;
}

export const PxWebBarChart: React.FC<BarChartProps> = ({
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
        // Fallback: try to guess it's named "tid"
        timeDimName = dimensionEntries.find(([key]) => key.toLowerCase() === "tid")
            ?.[0];
    }

    if (!timeDimName) {
        throw new Error("Could not find time dimension in the PX-Web JSON.");
    }

    // Gather time dimension details
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
            // All categories selected by default
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

        // The last dimension changes fastest
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

    /**
     * Each combo corresponds to one group of bars across all time points.
     * For each time category, we get the y-value.
     *
     * linesData (here "seriesData") will be an array of:
     * {
     *   combo: { <dimName>: <catKey>, ... },
     *   series: Array<{ x: string, y: number }>
     * }
     */
    const seriesData = combos.map((combo) => {
        const series = timeCategoryKeys.map((timeKey) => {
            const fullCoords = { ...combo, [timeDimName]: timeKey };
            const yVal = getValue(fullCoords);
            return {
                // x is the time label, e.g. "2020"
                x: timeCategoryLabels[timeKey] || timeKey,
                y: yVal,
            };
        });
        return { combo, series };
    });

    // ---- 5) Render D3 chart + transitions + tooltip in useEffect ----
    useEffect(() => {
        if (!svgRef.current) return;

        // Clear previous chart
        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        // Dimensions
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = svgEl
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Flatten out all points to get y extent
        const allPoints = seriesData.flatMap((sd) => sd.series);

        // X scale for the time dimension (discrete)
        const xDomain = timeCategoryKeys.map((key) => timeCategoryLabels[key] || key);
        const xScale = d3
            .scaleBand<string>()
            .domain(xDomain)
            .range([0, innerWidth])
            .padding(0.2);

        // Sub-scale to separate each "combo" inside each time slot
        const xSubgroup = d3
            .scaleBand<number>()
            .domain(d3.range(seriesData.length)) // one index per combo
            .range([0, xScale.bandwidth()])
            .padding(0.05);

        // Y scale
        const [minY, maxY] = d3.extent(allPoints, (d) => d.y);
        const yScale = d3
            .scaleLinear()
            .domain([Math.min(0, minY ?? 0), maxY ?? 10])
            .range([innerHeight, 0])
            .nice();

        // Axes
        const xAxis = d3.axisBottom<string>(xScale).tickSizeOuter(0);
        svg
            .append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("font-size", 10)
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        const yAxis = d3.axisLeft<number>(yScale);
        svg.append("g").call(yAxis);

        // Tooltip
        const tooltip = d3
            .select("body")
            .append("div")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("padding", "6px 8px")
            .style("background", "#F0F8F9")
            .style("border", "2px solid #274247")
            .style("border-radius", "none")
            .style("font-size", "12px")
            .style("display", "none");

        // Color scale for combos
        const color = d3
            .scaleOrdinal(d3.schemeCategory10)
            .domain(d3.range(seriesData.length).map(String));

        // Create a group for each time tick along the X axis
        const timeGroups = svg
            .selectAll<SVGGElement, string>(".time-group")
            .data(xDomain)
            .enter()
            .append("g")
            .attr("class", "time-group")
            .attr("transform", (d) => `translate(${xScale(d)},0)`);

        // ---- 1) Append the rects with initial attributes ----
        const bars = timeGroups
            .selectAll<SVGRectElement, string>("rect")
            .data((timeLabel) => {
                return seriesData.map((sd, i) => {
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
            // Start with zero-height bars at the bottom:
            .attr("y", innerHeight)
            .attr("height", 0)
            // Tooltips/events (attach them to the rects selection, not the transition)
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

        // ---- 2) Transition to final attributes (bar rising up) ----
        bars
            .transition()
            .duration(400)
            .attr("y", (d) => yScale(d.value))
            .attr("height", (d) => innerHeight - yScale(d.value));

        // Cleanup tooltip on unmount
        return () => {
            tooltip.remove();
        };
    }, [seriesData, width, height, timeCategoryKeys, timeCategoryLabels]);

    // ---- 6) Render UI: dimension checkboxes + the SVG container ----
    return (
        <div className="flex flex-col space-y-4">
            {/* Dimension filters */}
            <div className="flex flex-wrap gap-4">
                {nonTimeDimensions.map((dim) => (
                    <div
                        key={dim.name}
                        className="border-2 border-[#274247] p-2 bg-[#F0F8F9] max-h-48 overflow-auto"
                    >
                        <h3 className="font-bold text-base mb-1">
                            {dim.label.charAt(0).toUpperCase() + dim.label.slice(1)}
                        </h3>
                        <div className="flex flex-col space-y-1">
                            {Object.entries(dim.category.label).map(([catKey, catLabel]) => {
                                const isChecked = selectedCategories[dim.name].has(catKey);
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
                                            className="w-4 h-4 border-2 border-[#274247] rounded-full flex items-center justify-center
                                 peer-checked:bg-[#274247] peer-checked:border-[#274247]
                                 transition-all relative"
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
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <svg ref={svgRef} className="w-full" />
        </div>
    );
};

/**
 * Utility to generate a cartesian product from arrays-of-keys
 */
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
