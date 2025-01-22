"use client";

import { useState, useEffect } from "react";
import ChartComponent from "./ChartComponent";

interface FetchAndGraphProps {
    url: string;
    queryBody: unknown;
}

// Define an interface for the expected server response shape
interface ApiData {
    labels?: string[];
    values?: number[];
}

export default function FetchAndGraph({ url, queryBody }: FetchAndGraphProps) {
    // Removed 'fetchedData' since it was never used
    const [parsedData, setParsedData] = useState<{ labels: string[]; values: number[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!url || !queryBody) return;

        async function fetchData() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(queryBody),
                });

                if (!response.ok) {
                    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                // Use a safe parsing function to handle any shape of "data"
                const chartData = parseData(data);
                setParsedData(chartData);
            } catch (err) {
                console.error("Fetch error:", err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Unknown error");
                }
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [url, queryBody]);

    function parseData(apiData: unknown): { labels: string[]; values: number[] } {
        // Basic type guard to check if apiData is an object
        if (apiData !== null && typeof apiData === "object") {
            // Cast to ApiData so we can access labels and values
            const typedData = apiData as ApiData;
            return {
                labels: Array.isArray(typedData.labels) ? typedData.labels : [],
                values: Array.isArray(typedData.values) ? typedData.values : [],
            };
        }
        return { labels: [], values: [] };
    }

    if (!url || !queryBody) return null;
    if (loading) return <div>Loading data from {url}...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    return (
        <div>
            <p className="text-sm text-gray-500">Fetched from: {url}</p>
            {parsedData && <ChartComponent data={parsedData} />}
        </div>
    );
}
