// components/NavigationLog.tsx
import React from 'react';

interface NavigationLogProps {
    showAllLogs: boolean;
    toggleShowAllLogs: () => void;
    persistentAllLogSteps: string[];
    persistentNavLogSteps: string[];
    logContainerRef: React.RefObject<HTMLDivElement | null>;
}

const NavigationLog: React.FC<NavigationLogProps> = ({
                                                         showAllLogs,
                                                         toggleShowAllLogs,
                                                         persistentAllLogSteps,
                                                         persistentNavLogSteps,
                                                         logContainerRef,
                                                     }) => {
    return (
        <div className="fixed bottom-10 right-4 border-gray-300 w-80 h-[70%] max-h-[70%] hidden xl:block">
            <div className="flex justify-between items-center mb-1">
                <div className="text-xl font-bold">Navigasjonslogg</div>
                <button
                    onClick={toggleShowAllLogs}
                    className="text-xs text-[#274247] hover:underline"
                >
                    {showAllLogs ? "Vis kun navigasjonslogg" : "Vis all logging"}
                </button>
            </div>
            <div
                ref={logContainerRef}
                className="overflow-auto h-[calc(100%-1.5rem)] bg-white rounded shadow-inner p-2"
            >
                {(showAllLogs ? persistentAllLogSteps : persistentNavLogSteps).map(
                    (step, i) => (
                        <div key={i} className="text-xs mb-1 break-words">
                            {step}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default NavigationLog;
