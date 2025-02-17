// BarChart.tsx
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { BarChartProps } from "@/app/components/Graphing/charts/types/ChartProps";

export const BarChart: React.FC<BarChartProps> = ({
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

        const margin = { top: 30, right: 30, bottom: 50, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

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

        const xDomain = data.length > 0 ? data[0].series.map((d) => d.x) : [];
        const xScale = d3
            .scaleBand()
            .domain(xDomain)
            .range([0, innerWidth])
            .padding(0.2);

        const xSubgroup = d3
            .scaleBand()
            .domain(d3.range(data.length).map(String))
            .range([0, xScale.bandwidth()])
            .padding(0.05);

        const allPoints = data.flatMap((d) => d.series);
        const [minY, maxY] = d3.extent(allPoints, (d) => d.y);
        const yScale = d3
            .scaleLinear()
            .domain([Math.min(0, minY ?? 0), maxY ?? 10])
            .range([innerHeight, 0])
            .nice();

        const svg = svgEl
            .attr("viewBox", `0 0 ${width} ${height}`)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const xAxis = d3.axisBottom<string>(xScale).tickSizeOuter(0);
        svg
            .append("g")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g").call(d3.axisLeft(yScale));

        const timeGroups = svg
            .selectAll(".time-group")
            .data(xDomain)
            .enter()
            .append("g")
            .attr("class", "time-group")
            .attr("transform", (d) => `translate(${xScale(d)}, 0)`);

        timeGroups
            .selectAll<SVGRectElement, { value: number; xVal: string; colorKey: string }>("rect")
            .data((xVal) =>
                data.map((seriesData, idx) => {
                    const point = seriesData.series.find((p) => p.x === xVal);
                    const val = point?.y ?? 0;

                    const colorKey = colorDim
                        ? seriesData.combo[colorDim] || `missing-${idx}`
                        : `idx-${idx}`;

                    return {
                        value: val,
                        xVal,
                        colorKey,
                        subgroupIndex: idx,
                    };
                })
            )
            .enter()
            .append("rect")
            .attr("x", (d) => xSubgroup(String(d.subgroupIndex))!)
            .attr("width", xSubgroup.bandwidth())
            .attr("y", innerHeight)
            .attr("height", 0)
            .attr("fill", (d) =>
                customColorScale ? customColorScale(d.colorKey) : "#999"
            )
            .on("mouseover", function (event, d) {
                tooltip.style("display", "block");
                tooltip.html(`<strong>${d.xVal}</strong><br>Verdi: ${d.value}`);
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
            .duration(600)
            .attr("y", (d) => yScale(d.value))
            .attr("height", (d) => innerHeight - yScale(d.value));

        return () => {
            tooltip.remove();
        };
    }, [data, width, height, colorDim, customColorScale]);

    return <svg ref={svgRef} style={{ width: "100%" }} />;
};
