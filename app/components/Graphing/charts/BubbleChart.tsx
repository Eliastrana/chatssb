// BubbleChart.tsx
import React, {useEffect, useRef} from "react";
import * as d3 from "d3";
import {BubbleChartProps, HierarchyDatum} from "@/app/components/Graphing/charts/types/ChartProps";

export const BubbleChart: React.FC<BubbleChartProps> = ({
                                                            width = 600,
                                                            height = 400,
                                                            data,
                                                            colorDim,         // Unused now, as we base color solely on index
                                                            customColorScale, // Optional custom color scale
                                                        }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        // Create tooltip
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

        const svgEl = d3.select(svgRef.current);
        svgEl.selectAll("*").remove();

        const rootData: HierarchyDatum = {
            children: data.map((d) => ({ ...d })),
        };

        const root = d3
            .hierarchy<HierarchyDatum>(rootData)
            .sum((d) => d.value ?? 0)
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        const packLayout = d3.pack<HierarchyDatum>().size([width, height]).padding(3);
        const packedRoot = packLayout(root);

        const margin = { top: 0, right: 0, bottom: 0, left: 0 };
        const svg = svgEl
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Create a color scale based solely on the number of leaves.
        const leaves = packedRoot.leaves();
        const colorScale = d3
            .scaleOrdinal(
                customColorScale
                    ? customColorScale.range()
                    : ["#274247", "#7E5EE8", "#00824d", ...d3.schemeCategory10.slice(3)]
            )
            .domain(d3.range(leaves.length).map(String));

        // Use the series index for color
        const effectiveColor = (_: unknown, idx: number) => colorScale(String(idx));

        svg
            .selectAll("circle")
            .data(leaves)
            .enter()
            .append("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", 0)
            .attr("fill", (_, i) => effectiveColor(_, i))
            .on("mouseover", function (event, d) {
                tooltip.style("display", "block");
                const combo = d.data.combo || {};
                const comboHtml = Object.entries(combo)
                    .map(([dim, cat]) => `<strong>${dim}:</strong> ${cat}`)
                    .join("<br/>");
                tooltip.html(
                    `${comboHtml}<br/><strong>Verdi:</strong> ${(d.data.value ?? 0).toLocaleString()}`
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
            .style("font-size", "20px")
            .style("fill", "white")
            .text((d) => (d.data.value != null ? d.data.value.toString() : ""))
            .style("opacity", (d) => (d.r > 15 ? 1 : 0));

        return () => {
            tooltip.remove();
        };
    }, [data, width, height, customColorScale, colorDim]);

    return <svg ref={svgRef} style={{ width: "100%" }} />;
};
