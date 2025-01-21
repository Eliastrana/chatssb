/*
Tar i mot data fra FetchAndGraph og viser de frem. Funker per nå ikke.
 */

"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface ChartData {
    labels: string[];
    values: number[];
}

interface ChartComponentProps {
    data: ChartData | null;
}

export default function ChartComponent({ data }: ChartComponentProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!data || !canvasRef.current) return;

        Chart.getChart(canvasRef.current)?.destroy();

        const ctx = canvasRef.current.getContext("2d")!;
        new Chart(ctx, {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: "Dynamic Data",
                        data: data.values,
                        borderColor: "rgba(75,192,192,1)",
                        backgroundColor: "rgba(75,192,192,0.2)",
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }, [data]);

    return <canvas ref={canvasRef} />;
}
