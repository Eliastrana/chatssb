// components/HoverInfoModal.tsx
import React from 'react';

const HoverInfoModal: React.FC = () => {
    return (
        <div className="fixed top-2 left-2 z-50">
            <div className="group relative inline-block">
                <button
                    className="w-8 h-8 bg-[#274247] hover:bg-[#274240] rounded-full flex items-center justify-center text-white focus:outline-none text-xs">
                    <span className="material-symbols-outlined">
                        question_mark
                    </span>
                </button>

                <div className="absolute top-4 left-14 mb-2 bg-white p-6 w-56 border-2 border-[#274247] shadow-lg opacity-0 invisible
                                group-hover:opacity-100 group-hover:visible transition-opacity duration-300">
                    <h3 className="text-lg font-bold mb-2">Informasjon</h3>
                    <ul className="list-disc pl-4 text-sm">
                        <li className="mb-2">
                            Denne nettsiden representerer ikke Statistisk sentralbyrå (SSB) eller deres offisielle tjenester.
                        </li>
                        <li>
                            SSB sin oppdaterte API er inaktiv fra 05:00-08:00 hver dag, og hele helgen. Derfor vil test-API-en deres bli brukt i denne perioden.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HoverInfoModal;
