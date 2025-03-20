// PieChart.tsx
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { PieChartProps } from "./types/ChartProps";

export const PieChart: React.FC<PieChartProps> = ({
                                                      width = 600,
                                                      height = 400,
                                                      data,
                                                      dimension,         // dimension metadata (for tooltips)
                                                      colorDim,          // dimension name for coloring
                                                      customColorScale,  // color scale
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

        // Build a pie/arc generator
        const pieGenerator = d3
            .pie<{ combo: Record<string, string>; value: number }>()
            .sort(null)
            .value((d) => d.value);

        const arcGenerator = d3
            .arc<d3.PieArcDatum<{ combo: Record<string, string>; value: number }>>()
            .innerRadius(0)
            .outerRadius(radius);

        const arcs = pieGenerator(data);

        // Fallback color scale if none provided
        const fallbackColor = d3
            .scaleOrdinal<string>()
            .domain(arcs.map((_, i) => String(i)))
            .range(d3.schemeCategory10);

        // Helper function to pick a color for each slice
        function getSliceColor(d: d3.PieArcDatum<{ combo: Record<string, string>; value: number }>, i: number) {
            if (customColorScale && colorDim) {
                // If we have a dimension name and color scale, look up the category
                const catKey = d.data.combo[colorDim];
                if (catKey) {
                    return customColorScale(catKey);
                }
            }
            // Otherwise, fallback to index-based color
            return fallbackColor(String(i));
        }

        // Create arc groups
        const arcGroup = svg
            .selectAll(".arc")
            .data(arcs)
            .enter()
            .append("g")
            .attr("class", "arc");

        arcGroup
            .append("path")
            .on("mouseover", function (event, d) {
                // Build dimension-based tooltip if dimension metadata is available
                let comboLabelsHtml = "";
                if (dimension) {
                    comboLabelsHtml = Object.entries(d.data.combo)
                        .map(([dimName, catKey]) => {
                            const fullDim = dimension[dimName];
                            const labelForDim = fullDim?.label || dimName;
                            const labelForCat = fullDim?.category.label[catKey] || catKey;
                            return `<strong>${labelForDim}:</strong> ${labelForCat}`;
                        })
                        .join("<br/>");
                } else {
                    // fallback if dimension not given
                    comboLabelsHtml = JSON.stringify(d.data.combo);
                }

                tooltip
                    .style("display", "block")
                    .html(`
            ${comboLabelsHtml}<br/>
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
            })
            .transition()
            .duration(1000)
            .attrTween("d", function (d) {
                // Start angles at 0 -> 0, animate to d.startAngle -> d.endAngle
                const start: d3.PieArcDatum<{ combo: Record<string, string>; value: number }> = {
                    data: d.data,
                    index: d.index,
                    value: d.value,
                    startAngle: 0,
                    endAngle: 0,
                    padAngle: d.padAngle ?? 0,
                };
                const interp = d3.interpolate(start, d);
                return function (t) {
                    return arcGenerator(interp(t)) || "";
                };
            })
            .attr("fill", (d, i) => getSliceColor(d, i));

        // Optionally add labels
        arcGroup
            .append("text")
            .attr("transform", (d) => `translate(${arcGenerator.centroid(d)})`)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text((d) => d.data.value.toLocaleString());

        return () => {
            tooltip.remove();
        };
    }, [data, width, height, dimension, colorDim, customColorScale]);

    return <svg ref={svgRef} style={{ width: "100%" }} />;
};
