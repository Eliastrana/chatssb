// PxWebPieChartFullscreen.tsx
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { PxWebData } from "@/app/types";
import SingleRangeSlider from "@/app/components/Graphing/util/SingleRangeSlider";
import {cartesianProduct} from "@/app/components/Graphing/fullscreen_graphing/cartesianProduct"; // Adjust the path as needed

interface BarChartProps {
    data: PxWebData;
    width?: number;
    height?: number;
}

type Combo = { [dimName: string]: string };

export const PxWebPieChartFullscreen: React.FC<BarChartProps> = ({
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


    const initialYearIndex = timeCategoryKeys.length - 1;
    const [startIndex, setStartIndex] = useState(initialYearIndex);
    const [endIndex] = useState(initialYearIndex);

    const visibleSeriesData = seriesData.map((sd) => {
        const slicedSeries = sd.series.slice(startIndex, endIndex + 1);
        return { ...sd, series: slicedSeries };
    });

    const colorScale = d3
        .scaleOrdinal(customColors)
        .domain(d3.range(visibleSeriesData.length).map(String));

    useEffect(() => {
        if (!svgRef.current) return;
        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        const tooltip = d3
            .select("body")
            .append("div")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("padding", "6px 8px")
            .style("background", "#fff")
            .style("border", "1px solid #666")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("display", "none");

        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const radius = Math.min(innerWidth, innerHeight) / 2;

        const svg = svgEl
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr(
                "transform",
                `translate(${margin.left + innerWidth / 2}, ${margin.top + innerHeight / 2})`
            );

        const aggregatedData = visibleSeriesData.map((sd, seriesIndex) => {
            const total = d3.sum(sd.series, (d) => d.y);
            return { combo: sd.combo, total, seriesIndex };
        });

        const pieGenerator = d3
            .pie<{ combo: Record<string, string>; total: number; seriesIndex: number }>()
            .sort(null)
            .value((d) => d.total);
        const arcs = pieGenerator(aggregatedData);

        const arcGenerator = d3
            .arc<d3.PieArcDatum<typeof aggregatedData[0]>>()
            .innerRadius(0)
            .outerRadius(radius);

        const fallbackColor = d3
            .scaleOrdinal<string>()
            .domain(arcs.map((_, i) => String(i)))
            .range(d3.schemeCategory10);

        function getSliceColor(
            d: d3.PieArcDatum<typeof aggregatedData[0]>,
            i: number
        ) {
            return colorScale(String(d.data.seriesIndex)) || fallbackColor(String(i));
        }

        const arcGroup = svg.selectAll(".arc").data(arcs).enter().append("g").attr("class", "arc");

        arcGroup
            .append("path")
            .on("mouseover", function (event, d) {
                let comboLabelsHtml = "";
                if (data.dimension) {
                    comboLabelsHtml = Object.entries(d.data.combo)
                        .map(([dimName, catKey]) => {
                            const fullDim = data.dimension[dimName];
                            const labelForDim = fullDim?.label || dimName;
                            const labelForCat = fullDim?.category.label[catKey] || catKey;
                            return `<strong>${labelForDim}:</strong> ${labelForCat}`;
                        })
                        .join("<br/>");
                } else {
                    comboLabelsHtml = JSON.stringify(d.data.combo);
                }
                tooltip
                    .style("display", "block")
                    .html(
                        `${comboLabelsHtml}<br/><strong>Verdi:</strong> ${d.data.total.toLocaleString()}`
                    );
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY + 10 + "px");
            })
            .on("mouseleave", function () {
                tooltip.style("display", "none");
            })
            .transition()
            .duration(1000)
            .attrTween("d", function (d) {
                const start: d3.PieArcDatum<typeof aggregatedData[0]> = {
                    data: d.data,
                    index: d.index,
                    value: d.value,
                    startAngle: 0,
                    endAngle: 0,
                    padAngle: d.padAngle || 0,
                };
                const interp = d3.interpolate(start, d);
                return function (t) {
                    return arcGenerator(interp(t)) || "";
                };
            })
            .attr("fill", (d, i) => getSliceColor(d, i));

        arcGroup
            .append("text")
            .attr("transform", (d) => `translate(${arcGenerator.centroid(d)})`)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text((d) => d.data.total.toLocaleString());

        return () => {
            tooltip.remove();
        };
    }, [visibleSeriesData, width, height, data, colorScale]);

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
                                        <label key={catKey} className="inline-flex items-center gap-1">
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

                    disabled
                    title="Linear regression is disabled for pie charts"
                    className="mt-4 px-4 py-2 bg-gray-400 text-white rounded shadow-lg justify-center flex items-center gap-1 cursor-not-allowed"
                >
                    <span className="material-symbols-outlined">query_stats</span>
                    <p>Lineær regresjon</p>
                </button>
            </div>

            {/* Main chart container */}
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
                        <span className="material-symbols-outlined text-gray-400">open_in_new</span>
                    </div>
                    <h1 className="md:text-2xl">{textPart}</h1>
                </div>

                <div className="flex justify-center">
                    <svg ref={svgRef} />
                </div>

                <SingleRangeSlider
                    min={0}
                    max={timeCategoryKeys.length - 1}
                    value={startIndex}
                    onChange={(newValue) => setStartIndex(newValue)}
                    timeCategoryLabels={timeCategoryLabels}
                    timeCategoryKeys={timeCategoryKeys}
                />

            </div>
        </div>
    );
};


