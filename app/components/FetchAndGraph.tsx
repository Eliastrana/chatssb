/*
Denne er foreløpig ikke i bruk, men tanken var at denne filen tar i mot en
URL og kjører en en CURL på den slik at den får returnert data, og så skal
ChartComponent ta i mot disse verdiene og visualisere de.
 */

"use client";

import { useState, useEffect } from "react";
import ChartComponent from "./ChartComponent";

interface FetchAndGraphProps {
    url: string;
    queryBody: any;
}

export default function FetchAndGraph({ url, queryBody }: FetchAndGraphProps) {
    const [fetchedData, setFetchedData] = useState<any>(null);
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
                setFetchedData(data);

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

    function parseData(apiData: any) {


        if (apiData?.labels && apiData?.values) {
            return {
                labels: apiData.labels,
                values: apiData.values,
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
