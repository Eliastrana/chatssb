// LineChart.tsx
import React, {useEffect, useRef} from "react";
import * as d3 from "d3";
import {LineChartProps} from "@/app/components/Graphing/charts/types/ChartProps";

export const LineChart: React.FC<LineChartProps> = ({
                                                        width = 600,
                                                        height = 400,
                                                        data,
                                                        colorDim,
                                                        customColorScale,
                                                    }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

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

        const margin = { top: 20, right: 30, bottom: 50, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const allPoints = data.flatMap((d) => d.series);
        const xDomain = data.length > 0 ? data[0].series.map((p) => p.x) : [];

        const xScale = d3
            .scalePoint<string>()
            .domain(xDomain)
            .range([0, innerWidth])
            .padding(0.5);

        const [minY, maxY] = d3.extent(allPoints, (d) => d.y);
        const yScale = d3
            .scaleLinear()
            .domain([Math.min(0, minY ?? 0), maxY ?? 10])
            .nice()
            .range([innerHeight, 0]);

        const svg = svgEl
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xAxis = d3.axisBottom<string>(xScale).tickSizeOuter(0);
        svg
            .append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("font-size", 10)
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g").call(d3.axisLeft(yScale));

        const fallbackScale = d3
            .scaleOrdinal<string>()
            .domain(data.map((_, i) => String(i)))
            .range(d3.schemeCategory10);

        function getLineColor(seriesItem: { combo: Record<string, string> }, idx: number) {
            if (customColorScale && colorDim) {
                const catKey = seriesItem.combo[colorDim];
                if (catKey) {
                    return customColorScale(catKey);
                }
            }
            return customColorScale
                ? customColorScale(String(idx))
                : fallbackScale(String(idx));
        }

        const lineGen = d3
            .line<{ x: string; y: number }>()
            .x((d) => xScale(d.x) ?? 0)
            .y((d) => yScale(d.y));

        data.forEach((seriesItem, i) => {
            const path = svg
                .append("path")
                .datum(seriesItem.series)
                .attr("fill", "none")
                .attr("stroke", getLineColor(seriesItem, i))
                .attr("stroke-width", 2)
                .attr("d", lineGen);

            const totalLength = (path.node() as SVGPathElement).getTotalLength();
            path
                .attr("stroke-dasharray", totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                .duration(1200)
                .ease(d3.easeCubicInOut)
                .attr("stroke-dashoffset", 0);

            svg
                .selectAll(`.circle-${i}`)
                .data(seriesItem.series)
                .enter()
                .append("circle")
                .attr("fill", getLineColor(seriesItem, i))
                .attr("cx", (d) => xScale(d.x) ?? 0)
                .attr("cy", (d) => yScale(d.y))
                .attr("r", 3)
                // Tooltip events
                .on("mouseover", function (event, d) {
                    tooltip.style("display", "block");
                    tooltip.html(`<strong>${d.x}</strong><br/>Verdi: ${d.y}`);
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

        return () => {
            tooltip.remove();
        };
    }, [data, width, height, colorDim, customColorScale]);

    return <svg ref={svgRef} style={{ width: "100%" }} />;
};
