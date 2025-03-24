// components/HoverInfoModal.tsx
import React from 'react';

const HoverInfoModal: React.FC = () => {
    return (
        <div className="fixed top-2 left-2">
            <div className="group relative inline-block">
                <button
                    className="w-8 h-8 bg-[#274247] hover:bg-[#274240] rounded-full flex items-center justify-center text-white focus:outline-none text-xs">
                    <span className="material-symbols-outlined">
                        question_mark
                    </span>
                </button>

                <div className="absolute top-4 left-14 mb-2 bg-white p-6 w-56 border-2 border-[#274247] shadow-lg opacity-0 invisible
                                group-hover:opacity-100 group-hover:visible transition-opacity duration-300 z-5">
                    <h3 className="text-lg font-bold mb-2">Informasjon</h3>
                    <ul className="list-disc pl-4 text-sm">
                        <li className="mb-2">
                            Denne nettsiden er under utvikling, SSB står ikke for de oppgitte svarene.
                        </li>
                        <li>
                            Nettsiden er inaktiv fra 05:00-08:00 hver dag, og hele helgen.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HoverInfoModal;
