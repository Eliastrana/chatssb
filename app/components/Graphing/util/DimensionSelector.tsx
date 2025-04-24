import React, { memo, useMemo, useState, useCallback } from "react";
import * as d3 from "d3";

const customColors = ["#274247", "#7E5EE8", "#00824d", ...d3.schemeCategory10.slice(3)];

export interface DimensionSelectorProps {
    dim: {
        name: string;
        label: string;
        categoryKeys: string[];
        categoryLabels: Record<string, string>;
    };
    isStatVar: boolean;
    statVarColorScale: d3.ScaleOrdinal<string, string>;
    selectedCategories: Record<string, Set<string>>;
    toggleCategory: (dimName: string, key: string) => void;
}

const DimensionSelector: React.FC<DimensionSelectorProps> = ({
                                                                 dim,
                                                                 isStatVar,
                                                                 statVarColorScale,
                                                                 selectedCategories,
                                                                 toggleCategory,
                                                             }) => {
    const [searchTerm, setSearchTerm] = useState("");

    /* only recompute when either the dimension or the term changes */
    const filteredKeys = useMemo(
        () =>
            dim.categoryKeys.filter((k) =>
                dim.categoryLabels[k].toLowerCase().includes(searchTerm.toLowerCase()),
            ),
        [dim, searchTerm],
    );

    const allVisibleSelected =
        filteredKeys.length > 0 &&
        filteredKeys.every((k) => selectedCategories[dim.name].has(k));

    const toggleAllVisible = useCallback(() => {
        if (allVisibleSelected) {
            filteredKeys.forEach(
                (k) => selectedCategories[dim.name].has(k) && toggleCategory(dim.name, k),
            );
        } else {
            filteredKeys.forEach(
                (k) => !selectedCategories[dim.name].has(k) && toggleCategory(dim.name, k),
            );
        }
    }, [allVisibleSelected, filteredKeys, selectedCategories, dim.name, toggleCategory]);

    return (
        <div className="border border-[#C3DCDC] rounded-md shadow-inner p-2 bg-white w-fit max-h-56 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-2 shrink-0">
                <h4 className="font-semibold text-base">
                    {dim.label.charAt(0).toUpperCase() + dim.label.slice(1)}
                </h4>
                <button onClick={toggleAllVisible} title="Velg / fjern alle synlige">
          <span className="material-symbols-outlined">
            {allVisibleSelected ? "check_circle" : "radio_button_unchecked"}
          </span>
                </button>
            </div>

            {/* Search bar */}
            <input
                type="text"
                placeholder="Søk …"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full min-w-0 mb-2 border border-[#C3DCDC] rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#274247] shrink-0"
            />

            {/* Scrollable options */}
            <div className="flex flex-col gap-1 pr-1 overflow-y-auto flex-1">
                {filteredKeys.map((k, idx) => {
                    const checked = selectedCategories[dim.name].has(k);
                    const color = isStatVar
                        ? statVarColorScale(k)
                        : customColors[idx % customColors.length];

                    return (
                        <label key={k} className="inline-flex items-center gap-1 text-xs md:whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCategory(dim.name, k)}
                                className="peer hidden"
                            />
                            <span
                                className="w-4 h-4 border-2 rounded-full flex items-center justify-center transition-all"
                                style={{ borderColor: color, backgroundColor: checked ? color : "transparent" }}
                            >
                {checked && (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 -960 960 960"
                        fill="#F0F8F9"
                        width={16}
                        height={16}
                    >
                        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                    </svg>
                )}
              </span>
                            <span>{dim.categoryLabels[k]}</span>
                        </label>
                    );
                })}
                {filteredKeys.length === 0 && (
                    <span className="text-[10px] italic text-gray-500">Ingen treff</span>
                )}
            </div>
        </div>
    );
};

export default memo(DimensionSelector);
