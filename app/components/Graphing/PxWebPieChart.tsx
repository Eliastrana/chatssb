import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {PxWebData} from "@/app/types";


interface PieChartProps {
    data: PxWebData;
    width?: number;
    height?: number;
}

export const PxWebPieChart: React.FC<PieChartProps> = ({
                                                           data,
                                                           width = 900,
                                                           height = 500,
                                                       }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    // ---- 1) Identify which dimension is time, which are others ----
    const dimensionEntries = Object.entries(data.dimension);

    let timeDimName: string | undefined = undefined;
    if (data.role?.time && data.role.time.length > 0) {
        // If 'role.time' is given, use that
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
            // Select all categories by default
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

    // ---- 3) A function to retrieve `value` from the 1D data.value array ----
    const dimensionNamesInOrder = Object.keys(data.dimension);
    const dimensionSizesInOrder = data.size;

    const getValue = (coords: Record<string, string>) => {
        let index1D = 0;
        let stride = 1;

        // The last dimension in dimensionNamesInOrder changes fastest
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

    // ---- 4) Compute a single time point to display. We'll use the last one. ----
    // (You could make this selectable by the user if desired.)
    const selectedTimeKey = timeCategoryKeys[timeCategoryKeys.length - 1];
    const selectedTimeLabel = timeCategoryLabels[selectedTimeKey];

    // ---- 5) Build the list of slices (one for each cross-product of selected categories) ----
    // We do not treat each time as separate slices. Instead, we pick just the single time from above.
    type Combo = { [dimName: string]: string };
    const combos: Combo[] = cartesianProduct(
        nonTimeDimensions.map((dim) => [...selectedCategories[dim.name]]),
        nonTimeDimensions.map((dim) => dim.name)
    );

    /**
     * For each combo, get the numeric value for the chosen time.
     */
    const slicesData = combos.map((combo) => {
        const coords = { ...combo, [timeDimName]: selectedTimeKey };
        const value = getValue(coords);
        return {
            combo, // e.g. { "region": "someKey", "gender": "anotherKey", ... }
            value,
        };
    });

    // ---- 6) Render D3 chart + transitions + tooltip in useEffect ----
    useEffect(() => {
        if (!svgRef.current) return;

        // Clear previous chart
        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        // Dimensions
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;

        const svg = svgEl
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr(
                "transform",
                `translate(${(width - margin.left - margin.right) / 2 + margin.left},
                    ${(height - margin.top - margin.bottom) / 2 + margin.top})`
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
            .style("font-size", "12px")
            .style("display", "none");

        // Pie generator
        const pieGenerator = d3
            .pie<{
                combo: Record<string, string>;
                value: number }>()
            .sort(null)
            .value((d) => d.value);

        // Arc generator
        const arcGenerator = d3
            .arc<d3.PieArcDatum<{ value: number; combo: Record<string, string> }>>()
            .innerRadius(0)
            .outerRadius(radius);

        // Color scale (one color per combo index)
        const color = d3.scaleOrdinal<string>().range(d3.schemeCategory10);

        // Convert data to pie arcs
        const arcs = pieGenerator(slicesData);

        // Create groups for each arc
        const arcGroups = svg
            .selectAll(".arc")
            .data(arcs)
            .enter()
            .append("g")
            .attr("class", "arc");

        // Draw path
        arcGroups
            .append("path")
            .attr("d", arcGenerator)
            .attr("fill", (d, i) => color(String(i))!)
            .transition()
            .duration(1000)
            .attrTween("d", function (d) {
                // Animate from 0 to the final angle
                const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return function (t) {
                    return arcGenerator(i(t))!;
                };
            });

        // Add tooltip events
        arcGroups
            .on("mouseover", function (event, d) {
                tooltip.style("display", "block");
                // Build a label from the dimension combos
                const comboLabels = Object.entries(d.data.combo)
                    .map(([dimName, catKey]) => {
                        const label =
                            data.dimension[dimName].category.label[catKey] || catKey;
                        return `<strong>${data.dimension[dimName].label}:</strong> ${label}`;
                    })
                    .join("<br/>");
                tooltip.html(`
          ${comboLabels}<br/>
          <strong>Verdi:</strong> ${d.data.value.toLocaleString()}
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

        // (Optional) add a central label for the time dimension we selected
        svg
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .style("font-size", "14px")
            .text(selectedTimeLabel);

        // Cleanup tooltip on unmount
        return () => {
            tooltip.remove();
        };
    }, [slicesData, width, height, data.dimension, selectedTimeLabel]);

    // ---- 7) Render UI: dimension checkboxes + the SVG container ----
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
