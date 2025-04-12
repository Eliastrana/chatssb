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

        // Create a color scale based solely on series index.
        // Use the customColorScale's range if provided, otherwise use a default set.
        const colorScale = d3.scaleOrdinal(
            customColorScale
                ? customColorScale.range()
                : ["#274247", "#7E5EE8", "#00824d", ...d3.schemeCategory10.slice(3)]
        ).domain(d3.range(data.length).map(String));

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

        // In this version, we simply use the series index for coloring.
        // A helper function to retrieve the color for series index i.
        const getLineColor = (i: number) => colorScale(String(i));

        const lineGen = d3
            .line<{ x: string; y: number }>()
            .x((d) => xScale(d.x) ?? 0)
            .y((d) => yScale(d.y));

        data.forEach((seriesItem, i) => {
            // Attach combo data to every point in the series for tooltip info
            const pointsWithCombo = seriesItem.series.map((point) => ({
                ...point,
                combo: seriesItem.combo,
            }));

            const path = svg
                .append("path")
                .datum(seriesItem.series)
                .attr("fill", "none")
                .attr("stroke", getLineColor(i))
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
                .data(pointsWithCombo)
                .enter()
                .append("circle")
                .attr("fill", getLineColor(i))
                .attr("cx", (d) => xScale(d.x) ?? 0)
                .attr("cy", (d) => yScale(d.y))
                .attr("r", 3)
                .on("mouseover", function (event, d) {
                    tooltip.style("display", "block");
                    const combo = d.combo || {};
                    const comboHtml = Object.entries(combo)
                        .map(([dim, cat]) => `<strong>${dim}:</strong> ${cat}`)
                        .join("<br/>");
                    tooltip.html(
                        `${comboHtml}<br/><strong>${d.x}:</strong> ${d.y.toLocaleString()}`
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
        });

        return () => {
            tooltip.remove();
        };
    }, [data, width, height, colorDim, customColorScale]);

    return <svg ref={svgRef} style={{ width: "100%" }} />;
};
