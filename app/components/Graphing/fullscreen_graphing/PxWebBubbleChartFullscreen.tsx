import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { PxWebData } from "@/app/types";
import SingleRangeSlider from "@/app/components/Graphing/util/SingleRangeSlider";
import {cartesianProduct} from "@/app/components/Graphing/fullscreen_graphing/cartesianProduct"; // Adjust path as needed

interface BarChartProps {
    data: PxWebData;
    width?: number;
    height?: number;
}

type Combo = { [dimName: string]: string };


interface HierarchyDatum {
    value?: number;
    combo?: Combo;
    seriesIndex?: number;
    children?: HierarchyDatum[];
}

export const PxWebBubbleChartFullscreen: React.FC<BarChartProps> = ({
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

    const toggleCategory = (dimName: string, catKey: string) => {
        setSelectedCategories((prev) => {
            const newSet = new Set(prev[dimName]);
            if (newSet.has(catKey)) newSet.delete(catKey);
            else newSet.add(catKey);
            return { ...prev, [dimName]: newSet };
        });
    };

    const dimensionNamesInOrder = Object.keys(data.dimension);
    const dimensionSizesInOrder = data.size;
    const getValue = (coords: Record<string, string>): number => {
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
        nonTimeDimensions.map((dim) => Array.from(selectedCategories[dim.name])),
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
    const [endIndex, setEndIndex] = useState(initialYearIndex);
    const visibleSeriesData = seriesData.map((sd) => {
        const slicedSeries = sd.series.slice(startIndex, endIndex + 1);
        return { ...sd, series: slicedSeries };
    });

    const handlePredict = () => {
        console.warn("Linear regression is disabled for bubble charts.");
    };

    const colorScale = d3
        .scaleOrdinal(customColors)
        .domain(d3.range(visibleSeriesData.length).map(String));

    useEffect(() => {
        if (!svgRef.current) return;
        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        // Create tooltip.
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

        const aggregatedBubbleData: HierarchyDatum[] = visibleSeriesData.map((sd, i) => {
            const totalRaw = d3.sum(sd.series, (d) => +d.y);
            const total = totalRaw > 0 ? totalRaw : 1;
            return { value: total, combo: sd.combo, seriesIndex: i };
        });

        const rootData: HierarchyDatum = { children: aggregatedBubbleData };

        const root = d3
            .hierarchy<HierarchyDatum>(rootData, (d) => d.children)
            .sum((d) => d.value ?? 0)
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        const packLayout = d3.pack<HierarchyDatum>().size([width, height]).padding(3);
        const packedRoot = packLayout(root);

        const leaves = packedRoot.leaves().filter((d) => d.depth > 0);

        const svg = svgEl.attr("viewBox", `0 0 ${width} ${height}`).append("g");

        const effectiveColor = (d: d3.HierarchyCircularNode<HierarchyDatum>, i: number) =>
            colorScale(String(d.data.seriesIndex)) || d3.schemeCategory10[i % 10];

        svg
            .selectAll("circle")
            .data(leaves)
            .enter()
            .append("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", 0)
            .attr("fill", (d, i) => effectiveColor(d, i))
            .on("mouseover", function (event, d) {
                tooltip
                    .style("display", "block")
                    .html(() => {
                        let comboLabelsHtml = "";
                        if (d.data.combo) {
                            comboLabelsHtml = Object.entries(d.data.combo)
                                .map(([dimName, catKey]) => {
                                    const dimObj = data.dimension[dimName];
                                    const labelForDim = dimObj?.label || dimName;
                                    const labelForCat = dimObj?.category.label[catKey] || catKey;
                                    return `<strong>${labelForDim}:</strong> ${labelForCat}`;
                                })
                                .join("<br/>");
                        }
                        return `${comboLabelsHtml}<br/><strong>Verdi:</strong> ${d.data.value?.toLocaleString()}`;
                    });
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
            .attr("r", (d) => d.r);

        svg
            .selectAll(".bubble-label")
            .data(leaves)
            .enter()
            .append("text")
            .attr("class", "bubble-label")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .style("font-size", "10px")
            .text((d) => d.data.value?.toString() || "")
            .style("opacity", (d) => (d.r > 15 ? 1 : 0));

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
                    const catColorMapping = catKeys.reduce((acc, key, idx) => {
                        acc[key] = customColors[idx % customColors.length];
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
                                                onChange={() => toggleCategory(dim.name, catKey)}
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
                    disabled
                    title="Linear regression is disabled for bubble charts"
                    className="mt-4 px-4 py-2 bg-gray-400 text-white rounded shadow-lg justify-center flex items-center gap-1 cursor-not-allowed"
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
                    onChange={(val) => {
                        setStartIndex(val);
                        setEndIndex(val);
                    }}
                    timeCategoryLabels={timeCategoryLabels}
                    timeCategoryKeys={timeCategoryKeys}
                />

            </div>
        </div>
    );
};

