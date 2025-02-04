import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { PxWebData } from "@/app/types";
import SingleRangeSlider from "@/app/components/Graphing/SingleRangeSlider";

interface BubbleChartProps {
    data: PxWebData;
    width?: number;
    height?: number;
}

/**
 * HierarchyData describes either a "parent" node with `children`
 * or a "leaf" node with `combo` and `value`.
 */
interface HierarchyData {
    /** If `children` is defined, this node is non-leaf */
    children?: HierarchyData[];
    /** Leaf nodes will have `combo` and `value` instead */
    combo?: Record<string, string>;
    value?: number;
}

export const PxWebBubbleChart: React.FC<BubbleChartProps> = ({
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
        // Fallback: try "tid"
        timeDimName = dimensionEntries.find(
            ([key]) => key.toLowerCase() === "tid"
        )?.[0];
    }

    if (!timeDimName) {
        throw new Error("Could not find time dimension in the PX-Web JSON.");
    }

    // Gather time dimension details
    const timeDimension = data.dimension[timeDimName];
    const timeCategoryKeys = Object.keys(timeDimension.category.index);
    const timeCategoryLabels = timeDimension.category.label;

    // ---- 2) Identify non-time dimensions for filtering ----
    const nonTimeDimensions = dimensionEntries
        .filter(([dimName]) => dimName !== timeDimName)
        .map(([dimName, dim]) => ({ name: dimName, ...dim }));

    // ---- 3) State for which categories are selected for each non-time dimension ----
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

    // ---- 4) Build a function to retrieve `value` from data.value ----
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

    // ---- 5) Use a single time point for the bubble chart.
    // Instead of hardcoding the time point, we allow the user to choose via a slider.
    const [selectedTimeIndex, setSelectedTimeIndex] = useState(
        timeCategoryKeys.length - 1
    );
    const selectedTimeKey = timeCategoryKeys[selectedTimeIndex];
    const selectedTimeLabel =
        timeCategoryLabels[selectedTimeKey] || selectedTimeKey;

    // ---- 6) Build the list of bubble slices.
    // Generate the cartesian product of the selected non-time categories.
    type Combo = { [dimName: string]: string };
    const combos: Combo[] = cartesianProduct(
        nonTimeDimensions.map((dim) => [...selectedCategories[dim.name]]),
        nonTimeDimensions.map((dim) => dim.name)
    );

    // For each combo, get the numeric value at the selected time.
    const bubbleData = combos.map((combo) => {
        const coords = { ...combo, [timeDimName]: selectedTimeKey };
        const value = getValue(coords);
        return { combo, value };
    });

    // ---- 7) Render the D3 bubble (pack) chart in useEffect ----
    useEffect(() => {
        if (!svgRef.current) return;
        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        // Use a pack layout for the bubble chart
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const minSide = Math.min(innerWidth, innerHeight);
        const layoutRadius = minSide / 2;

        // Prepare root data matching the HierarchyData interface
        const rootData: HierarchyData = {
            children: bubbleData.map((d) => ({
                combo: d.combo,
                value: d.value,
            })),
        };

        const root = d3
            .hierarchy<HierarchyData>(rootData)
            .sum((d) => d.value ?? 0)
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        const packLayout = d3
            .pack<HierarchyData>()
            .size([layoutRadius * 2, layoutRadius * 2])
            .padding(3);

        const packed = packLayout(root);

        const svg = svgEl
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr(
                "transform",
                `translate(${margin.left + layoutRadius}, ${margin.top + layoutRadius})`
            );

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

        // Color scale
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const leaves = packed.leaves();

        // Add circles with transition
        const circles = svg
            .selectAll<SVGCircleElement, d3.HierarchyCircularNode<HierarchyData>>("circle")
            .data(leaves)
            .enter()
            .append("circle")
            .attr("cx", (d) => d.x - layoutRadius)
            .attr("cy", (d) => d.y - layoutRadius)
            .attr("r", 0)
            .attr("fill", (d, i) => color(String(i)))
            .on("mouseover", function (event, d) {
                tooltip.style("display", "block");
                const dataNode = d.data;
                if (!dataNode.combo) return;
                const comboLabels = Object.entries(dataNode.combo)
                    .map(([dimName, catKey]) => {
                        const label =
                            data.dimension[dimName].category.label[catKey] || catKey;
                        return `<strong>${data.dimension[dimName].label}:</strong> ${label}`;
                    })
                    .join("<br/>");
                tooltip.html(`
          ${comboLabels}<br/>
          <strong>Verdi:</strong> ${(dataNode.value ?? 0).toLocaleString()}
        `);
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY + 10 + "px");
            })
            .on("mouseleave", function () {
                tooltip.style("display", "none");
            });

        circles
            .transition()
            .duration(1000)
            .attr("r", (d) => d.r);

        // Optional text labels if circles are big enough
        svg
            .selectAll<SVGTextElement, d3.HierarchyCircularNode<HierarchyData>>(".bubble-label")
            .data(leaves)
            .enter()
            .append("text")
            .attr("class", "bubble-label")
            .attr("x", (d) => d.x - layoutRadius)
            .attr("y", (d) => d.y - layoutRadius)
            .attr("text-anchor", "middle")
            .attr("dy", "0.3em")
            .style("font-size", "10px")
            .style("pointer-events", "none")
            .text((d) => (d.data.value ?? 0).toString())
            .style("opacity", (d) => (d.r > 20 ? 1 : 0));

        // Optional center label for the selected time
        svg
            .append("text")
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "#274247")
            .text(`Tid: ${selectedTimeLabel}`)
            .attr("transform", `translate(0, ${-layoutRadius - 10})`);

        return () => {
            tooltip.remove();
        };
    }, [bubbleData, width, height, data.dimension, selectedTimeLabel]);

    // ---- 8) Render UI: dimension filters, the SVG container, and the slider ----
    return (
        <div className="flex flex-col space-y-4">
            {/* Dimension Filters */}
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
                                    <label key={catKey} className="inline-flex items-center gap-1">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleToggleCategory(dim.name, catKey)}
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
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <svg ref={svgRef} className="w-full" />

            {/* Single Range Slider for selecting the time point */}
            <SingleRangeSlider
                min={0}
                max={timeCategoryKeys.length - 1}
                value={selectedTimeIndex}
                onChange={(newValue) => setSelectedTimeIndex(newValue)}
                timeCategoryLabels={timeCategoryLabels}
                timeCategoryKeys={timeCategoryKeys}
            />
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
