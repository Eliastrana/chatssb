// components/Statistics.tsx
import React from 'react';

interface StatisticsProps {
    liveResponseTime: number;
}

const StatisticsPanel: React.FC<StatisticsProps> = ({ liveResponseTime }) => {
    return (
        <div className="fixed bottom-10 left-4 p-2 w-80 h-[70%] max-h-[70%] hidden xl:block">
            <div className="flex justify-between items-center mb-1">
                <div className="text-xl font-bold">Statistikk</div>
            </div>
            <div className="space-y-2">
                <div className="flex flex-col space-y-1 bg-white rounded shadow-inner p-2">
                    <h2 className="text-lg">Svartid (S):</h2>
                    <div className="text-4xl">
                        {liveResponseTime > 0 ? `${(liveResponseTime / 1000).toFixed(1)}` : "..."}
                    </div>
                </div>
                <div className="flex flex-col space-y-1 bg-white rounded shadow-inner p-2">
                    <h2 className="text-lg">Tokenbruk:</h2>
                    <h3>Inputtokens:</h3>
                    <p className="text-sm">1000</p>
                    <h3>Outputtokens:</h3>
                    <p className="text-sm">2000</p>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPanel;
