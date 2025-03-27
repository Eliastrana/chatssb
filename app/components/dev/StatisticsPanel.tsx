import React from "react";

interface StatisticsProps {
    liveResponseTime: number;
    liveInputTokenUsage: number;
    liveOutputTokenUsage: number;
    totalInputTokenUsage: number;
    totalOutputTokenUsage: number;
}

const StatisticsPanel: React.FC<StatisticsProps> = ({
                                                        liveResponseTime,
                                                        liveInputTokenUsage,
                                                        liveOutputTokenUsage,
                                                        totalInputTokenUsage,
                                                        totalOutputTokenUsage,
                                                    }) => {
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
                    <h2 className="text-lg">Live tokenbruk:</h2>
                    <h3>Inputtokens:</h3>
                    <p className="text-xl">{liveInputTokenUsage}</p>
                    <h3>Outputtokens:</h3>
                    <p className="text-xl">{liveOutputTokenUsage}</p>
                </div>
                <div className="flex flex-col space-y-1 bg-white rounded shadow-inner p-2">
                    <h2 className="text-lg">Totalsum:</h2>
                    <h3 className="">Inputtokens:</h3>
                    <p className="text-xl">{totalInputTokenUsage}</p>
                    <h3>Outputtokens:</h3>
                    <p className="text-xl">{totalOutputTokenUsage}</p>
                </div>
                <div className="flex flex-col space-y-1 bg-white rounded shadow-inner p-2">
                    <h2 className="text-lg">Pris (GPT-4o-mini):</h2>
                    <h3 className="">{totalInputTokenUsage * 0.000001376} kr</h3>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPanel;
