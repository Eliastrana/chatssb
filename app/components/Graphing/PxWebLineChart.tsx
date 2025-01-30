import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * A generalized type for the PX-Web style JSON structure.
 */
type PxWebData = {
    dimension: {
        [dimName: string]: {
            label: string;
            category: {
                index: Record<string, number>;
                label: Record<string, string>;
            };
        };
    };
    size: number[];
    value: number[];
    role?: {
        time?: string[];
        metric?: string[];
    };

};

interface LineChartProps {
    data: PxWebData;
    width?: number;
    height?: number;
}

export const PxWebLineChart: React.FC<LineChartProps> = ({
                                                             data,
                                                             width = 900,
                                                             height = 500,
                                                         }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    // ---- 1) Identify which dimension is time, which are others ----
    //
    // We will assume:
    //   - There's exactly one "time" dimension (based on either 'role.time' or simply named "Tid").
    //   - The rest are non-time dimensions that we allow the user to filter on.
    //
    // If your API's "role" field or dimension naming differs, adapt accordingly.
    const dimensionEntries = Object.entries(data.dimension);

    let timeDimName: string | undefined = undefined;
    // Attempt to find dimension by 'role.time' first, otherwise fallback to "Tid".
    if (data.role?.time && data.role.time.length > 0) {
        timeDimName = data.role.time[0];
    } else {
        // fallback if dimension is literally named "Tid" or similar
        timeDimName = dimensionEntries.find(([key]) => key.toLowerCase() === "tid")
            ?.[0];
    }

    if (!timeDimName) {
        throw new Error("Could not find time dimension in the PX-Web JSON.");
    }

    // Gather time dimension details
    const timeDimension = data.dimension[timeDimName];
    // The "index" object for time might look like: {"1972K1":0, "1972K2":1, ...}
    const timeCategoryKeys = Object.keys(timeDimension.category.index); // e.g. ["1972K1","1972K2",...]
    const timeCategoryLabels = timeDimension.category.label;            // e.g. {"1972K1": "1972K1", ...}

    // Identify all non-time dimensions for filtering
    const nonTimeDimensions = dimensionEntries
        .filter(([dimName]) => dimName !== timeDimName)
        .map(([dimName, dim]) => ({ name: dimName, ...dim }));

    // ---- 2) State for which categories are selected for each non-time dimension ----
    // We'll store them in an object { [dimensionName]: Set(categoryKey) }
    // So that the user can select/unselect categories.
    const [selectedCategories, setSelectedCategories] = useState<
        Record<string, Set<string>>
    >(() => {
        const initial: Record<string, Set<string>> = {};
        nonTimeDimensions.forEach((dim) => {
            initial[dim.name] = new Set(Object.keys(dim.category.index)); // Start selected = all
        });
        return initial;
    });

    // Handler for toggling a category in a dimension
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
    // The typical indexing rule for a PX file is that the last dimension in the
    // dimension list changes fastest. We'll do a generalized approach:
    const dimensionNamesInOrder = Object.keys(data.dimension);
    const dimensionSizesInOrder = data.size;

    const getValue = (coords: Record<string, string>) => {
        // coords = { dimensionName -> categoryKey }
        // We must convert each dimensionName->categoryKey to the dimension's index,
        // then compute the 1D offset into `data.value`.
        let index1D = 0;
        let stride = 1;

        // The last dimension in dimensionNamesInOrder is the fastest changing:
        // so we iterate from the *end* to the start
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

    // ---- 4) Build the list of lines to plot. Each line is one combination of selected categories ----
    // We'll do a cross-product of selected categories for each non-time dimension.
    type Combo = { [dimName: string]: string };
    const combos: Combo[] = cartesianProduct(
        nonTimeDimensions.map((dim) => [...selectedCategories[dim.name]]),
        nonTimeDimensions.map((dim) => dim.name)
    );

    // For each combination, build a timeseries array of { x: string, y: number }
    const linesData = combos.map((combo) => {
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

    // ---- 5) Render D3 chart in a useEffect so it draws whenever data or linesData changes ----
    useEffect(() => {
        if (!svgRef.current) return;

        // Clear previous chart
        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        // We'll do a simple margin / group approach
        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = svgEl
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Flatten all data points to compute min/max
        const allPoints = linesData.flatMap((line) => line.series);
        // x-scale is ordinal/time => If your x is something parseable, you can do time scale
        // Here we'll treat them as categories or try to parse them as something that sorts well
        const xDomain = timeCategoryKeys.map((key) => timeCategoryLabels[key] || key);
        const xScale = d3
            .scalePoint()
            .domain(xDomain)
            .range([0, innerWidth])
            .padding(0.5);

        // y-scale numeric
        const [minY, maxY] = d3.extent(allPoints, (d) => d.y);
        const yScale = d3
            .scaleLinear()
            .domain([Math.min(0, minY ?? 0), maxY ?? 10])
            .range([innerHeight, 0])
            .nice();

        // Draw axes
        const xAxis = d3.axisBottom<string>(xScale).tickSizeOuter(0);
        svg
            .append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("font-size", 10) // Tailwind: not directly used in an svg
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        const yAxis = d3.axisLeft<number>(yScale);
        svg.append("g").call(yAxis);

        // A line generator
        const lineGen = d3
            .line<{ x: string; y: number }>()
            .x((d) => xScale(d.x) ?? 0)
            .y((d) => yScale(d.y));

        // Make a color scale for lines
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Draw each line
        // linesData.forEach(({ combo, series }, idx) => {
        linesData.forEach(({ series }, idx) => {
            svg
                .append("path")
                .datum(series)
                .attr("fill", "none")
                .attr("stroke", color(String(idx)))
                .attr("stroke-width", 2)
                .attr("d", lineGen);
        });
    }, [linesData, width, height, timeCategoryKeys, timeCategoryLabels]);


// ---- 6) Render UI: dimension checkboxes + the SVG container ----
    return (
        <div className="flex flex-col space-y-4">
            {/* Dimension filters */}

            <div className="flex flex-wrap gap-4">
                {nonTimeDimensions.map((dim) => (
                    <div key={dim.name} className="border-2 border-[#274247] p-2  bg-[#F0F8F9] max-h-48 overflow-auto">
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
                                            className="w-4 h-4 border-2 border-[#274247] rounded-full flex items-center justify-center peer-checked:bg-[#274247] peer-checked:border-[#274247] transition-all relative"
                                        >
                                            {/* Checkmark */}
                                            <svg xmlns="http://www.w3.org/2000/svg" height="24px"
                                                 viewBox="0 -960 960 960" width="24px" fill="#F0F8F9">
                                                <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
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
            <svg ref={svgRef} className=" w-full"/>
        </div>
    );
};

/**
 * Utility to generate a cartesian product from arrays-of-keys and
 * turn them into an array of objects keyed by each dimension name.
 * E.g. if dimensionNames = ["Kjonn","Alder"], and arrays = [ ["0","1"], ["15-24","25-74"] ],
 * we'll produce:
 *   [
 *     { Kjonn:"0", Alder:"15-24" },
 *     { Kjonn:"0", Alder:"25-74" },
 *     { Kjonn:"1", Alder:"15-24" },
 *     { Kjonn:"1", Alder:"25-74" },
 *   ]
 */
function cartesianProduct(
    arraysOfKeys: string[][],
    dimensionNames: string[]
): Array<{ [dimName: string]: string }> {
    if (arraysOfKeys.length === 0) return [];

    // Start with a "list of one empty object"
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
