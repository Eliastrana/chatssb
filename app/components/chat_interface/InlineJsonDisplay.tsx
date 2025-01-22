"use client";
import React, { useEffect, useState } from 'react';

interface InlineJsonDisplayProps {
    /** The URL to fetch and display as JSON. */
    url: string;
    /** Called when the user wants to hide/close this inline JSON panel. */
    onClose: () => void;
}

const InlineJsonDisplay: React.FC<InlineJsonDisplayProps> = ({ url, onClose }) => {
    const [jsonData, setJsonData] = useState<unknown>(null);
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
            } catch (err: unknown) {
                console.error('Error fetching JSON:', err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred while fetching JSON data.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchJson();
    }, [url]);

    let content: React.ReactNode;
    if (loading) {
        content = <p>Loading JSON data...</p>;
    } else if (error) {
        content = <p className="text-red-500">Error: {error}</p>;
    } else {
        content = (
            <pre className="whitespace-pre-wrap break-words">
        {JSON.stringify(jsonData, null, 2)}
      </pre>
        );
    }

    return (
        <div className="border border-gray-300 p-2 rounded bg-white mt-2 relative">
            {/* Close button in top-right, inside the bubble */}
            <button
                onClick={onClose}
                className="absolute top-1 right-2 text-gray-500 hover:text-gray-700"
            >
                &times;
            </button>
            {content}
        </div>
    );
};

export default InlineJsonDisplay;
