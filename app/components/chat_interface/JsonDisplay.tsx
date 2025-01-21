// app/components/JsonDisplay.tsx

"use client";

import React, { useEffect, useState } from 'react';

interface JsonDisplayProps {
    url: string;
}

const JsonDisplay: React.FC<JsonDisplayProps> = ({ url }) => {
    const [jsonData, setJsonData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJson = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch JSON data. Status: ${response.status}`);
                }
                const data = await response.json();
                setJsonData(data);
            } catch (err: any) {
                console.error('Error fetching JSON:', err);
                setError(err.message || 'An error occurred while fetching JSON data.');
            } finally {
                setLoading(false);
            }
        };

        fetchJson();
    }, [url]);

    if (loading) {
        return <p>Loading JSON data...</p>;
    }

    if (error) {
        return <p className="text-red-500">Error: {error}</p>;
    }

    return (
        <div className="json-display overflow-auto bg-gray-100 p-4 rounded shadow-md w-full max-h-96">
            <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(jsonData, null, 2)}
            </pre>
        </div>
    );
};

export default JsonDisplay;
