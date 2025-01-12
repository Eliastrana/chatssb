// app/components/JsonVisualizer.tsx

"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface JsonVisualizerProps {
    url: string;
}

interface SSBResponse {
    dataset: {
        dimension: {
            [key: string]: any;
        };
        value: number[];
    };
}

interface TransformedDataPoint {
    ContentsCode: string;
    Region: string;
    NACE2007: string;
    Tid: string;
    value: number;
}

const JsonVisualizer: React.FC<JsonVisualizerProps> = ({ url }) => {
    const d3Container = useRef<SVGSVGElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState<TransformedDataPoint[]>([]);

    // First useEffect: Fetch and transform data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch JSON data. Status: ${response.status}`);
                }
                const jsonData: SSBResponse = await response.json();
                console.log('SSB API Response:', jsonData); // For debugging

                // Transform the data
                const transformedData = transformSSBData(jsonData.dataset);
                setData(transformedData);
            } catch (err: any) {
                console.error('Error during data fetching/transformation:', err);
                setError(err.message || 'An error occurred while visualizing JSON data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [url]);

    // Second useEffect: Visualize data when it's available
    useEffect(() => {
        if (data.length === 0) return;
        if (!d3Container.current) {
            console.error('SVG container is null');
            setError('SVG container not found.');
            return;
        }

        // Clear previous visualization
        d3.select(d3Container.current).selectAll("*").remove();

        // Example Visualization: Simple Bar Chart
        // Adjust the visualization based on your transformed data
        const svg = d3.select(d3Container.current)
            .attr("width", 800)
            .attr("height", 500)
            .style("border", "1px solid black");

        const margin = { top: 20, right: 30, bottom: 100, left: 60 };
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // For demonstration, let's visualize the first 20 data points
        const displayData = data.slice(0, 20);

        const x = d3.scaleBand()
            .rangeRound([0, width])
            .padding(0.1)
            .domain(displayData.map(d => `${d.Tid}`));

        const y = d3.scaleLinear()
            .rangeRound([height, 0])
            .domain([0, d3.max(displayData, d => d.value) || 0]);

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y).ticks(10))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -50)
            .attr("x", -height / 2)
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("Value");

        g.selectAll(".bar")
            .data(displayData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(`${d.Tid}`) as string)
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.value))
            .attr("fill", "steelblue");
    }, [data]);

    // Function to transform SSB API data into an array of objects
    const transformSSBData = (dataset: any): TransformedDataPoint[] => {
        if (!dataset || !dataset.dimension || !dataset.dimension.size || !Array.isArray(dataset.dimension.size)) {
            throw new Error('Invalid dataset structure: Missing or incorrect "dimension.size"');
        }

        const { dimension, value } = dataset;
        const { ContentsCode, Region, NACE2007, Tid } = dimension;

        if (!ContentsCode || !Region || !NACE2007 || !Tid) {
            throw new Error('Invalid dataset structure: Missing required dimensions');
        }

        const contentsLabels: { [key: string]: string } = ContentsCode.category.label;
        const regionLabels: { [key: string]: string } = Region.category.label;
        const naceLabels: { [key: string]: string } = NACE2007.category.label;
        const tidLabels: { [key: string]: string } = Tid.category.label;

        const transformedData: TransformedDataPoint[] = [];

        // Calculate the total number of combinations
        const total = value.length;

        // Correctly access the 'size' array from 'dimension'
        const size = dimension.size; // [2, 1, 18, 5]
        const [sizeContentsCode, sizeRegion, sizeNACE2007, sizeTid] = size;

        for (let i = 0; i < total; i++) {
            // Calculate indices for each dimension
            const idxContentsCode = Math.floor(i / (sizeRegion * sizeNACE2007 * sizeTid)) % sizeContentsCode;
            const idxRegion = Math.floor(i / (sizeNACE2007 * sizeTid)) % sizeRegion;
            const idxNACE2007 = Math.floor(i / sizeTid) % sizeNACE2007;
            const idxTid = i % sizeTid;

            // Get the corresponding keys
            const contentsCodeKeys = Object.keys(ContentsCode.category.index);
            const regionKeys = Object.keys(Region.category.index);
            const naceKeys = Object.keys(NACE2007.category.index);
            const tidKeys = Object.keys(Tid.category.index);

            const contentsCodeKey = ContentsCode.category.index[contentsCodeKeys[idxContentsCode]];
            const regionKey = Region.category.index[regionKeys[idxRegion]];
            const naceKey = NACE2007.category.index[naceKeys[idxNACE2007]];
            const tidKey = Tid.category.index[tidKeys[idxTid]];

            // Get the labels
            const contentsCodeLabel = contentsLabels[contentsCodeKey];
            const regionLabel = regionLabels[regionKey];
            const naceLabel = naceLabels[naceKey];
            const tidLabel = tidLabels[tidKey];

            // Get the value
            const dataValue = value[i];

            transformedData.push({
                ContentsCode: contentsCodeLabel,
                Region: regionLabel,
                NACE2007: naceLabel,
                Tid: tidLabel,
                value: dataValue,
            });
        }

        return transformedData;
    };

    return (
        <div className="json-visualizer mt-4">
            {loading && <p>Loading visualization...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            {!loading && !error && data.length > 0 && (
                <svg ref={d3Container}></svg>
            )}
        </div>
    );
};

export default JsonVisualizer;
