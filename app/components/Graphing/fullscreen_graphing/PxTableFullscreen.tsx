// PxWebTableFullscreen.tsx
import React, { useMemo, useState } from "react";
import { PxWebData } from "@/app/types";
import { cartesianProduct } from "@/app/components/Graphing/fullscreen_graphing/cartesianProduct";

interface TableRow {
    [key: string]: string | number;
    value: number;
}

interface TableProps {
    data: PxWebData;
    pageSize?: number;
}

const PxWebTableFullscreen: React.FC<TableProps> = ({ data, pageSize = 50 }) => {
    const dimensionNames = useMemo(() => Object.keys(data.dimension), [data]);

    const allRows: TableRow[] = useMemo(() => {
        const arrays = dimensionNames.map(
            (dimName) => Object.keys(data.dimension[dimName].category.index)
        );
        const combos = cartesianProduct(arrays, dimensionNames); // Each combo is an object mapping dim names to category keys

        const dimensionSizesInOrder = data.size;
        const getValue = (coords: Record<string, string>) => {
            let index1D = 0;
            let stride = 1;
            for (let d = dimensionNames.length - 1; d >= 0; d--) {
                const dimName = dimensionNames[d];
                const catKey = coords[dimName];
                const dimObj = data.dimension[dimName];
                if (!catKey || !dimObj) {
                    throw new Error(`Missing coordinate for dimension "${dimName}"`);
                }
                const catIndex = dimObj.category.index[catKey];
                index1D += catIndex * stride;
                stride *= dimensionSizesInOrder[d];
            }
            return data.value[index1D];
        };

        return combos.map((combo) => {
            const row: TableRow = dimensionNames.reduce((acc, dimName) => {
                const catKey = combo[dimName];
                acc[dimName] = data.dimension[dimName].category.label[catKey];
                return acc;
            }, {} as TableRow);
            row.value = getValue(combo);
            return row;

        });
    }, [data, dimensionNames]);

    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const sortedRows = useMemo(() => {
        if (!sortColumn) return allRows;
        return [...allRows].sort((a, b) => {
            if (sortColumn === "value") {
                return sortDirection === "asc"
                    ? (a.value as number) - (b.value as number)
                    : (b.value as number) - (a.value as number);
            } else {
                const aVal = (a[sortColumn] as string) || "";
                const bVal = (b[sortColumn] as string) || "";
                return sortDirection === "asc"
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
        });
    }, [allRows, sortColumn, sortDirection]);

    const [displayCount, setDisplayCount] = useState(pageSize);

    const paginatedRows = useMemo(() => {
        return sortedRows.slice(0, displayCount);
    }, [sortedRows, displayCount]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const handleLoadMore = () => {
        setDisplayCount((prev) => Math.min(prev + pageSize, sortedRows.length));
    };

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <div className="overflow-auto max-h-[600px] border">
                <table className="min-w-full border-collapse">
                    <thead className="bg-[#274247] text-white">
                    <tr>
                        {dimensionNames.map((dimName) => (
                            <th
                                key={dimName}
                                onClick={() => handleSort(dimName)}
                                className="cursor-pointer border p-2"
                            >
                                {data.dimension[dimName].label}{" "}
                                {sortColumn === dimName
                                    ? sortDirection === "asc"
                                        ? <span className="material-symbols-outlined">
                                            arrow_upward
                                          </span>
                                        : <span className="material-symbols-outlined">
                                            arrow_downward
                                          </span>
                                    : ""}
                            </th>
                        ))}
                        <th
                            onClick={() => handleSort("value")}
                            className="cursor-pointer border p-2"
                        >
                            Value{" "}
                            {sortColumn === "value"
                                ? sortDirection === "asc"
                                    ? <span className="material-symbols-outlined">
                                            arrow_upward
                                          </span>
                                    : <span className="material-symbols-outlined">
                                            arrow_downward
                                          </span>
                                : ""}
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {paginatedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                            {dimensionNames.map((dimName) => (
                                <td key={dimName} className="border p-2">
                                    {row[dimName]}
                                </td>
                            ))}
                            <td className="border p-2">{row.value}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {displayCount < sortedRows.length && (
                <div className="flex justify-center mt-4">
                    <button
                        onClick={handleLoadMore}
                        className="bg-[#274247] text-white px-4 py-2 rounded-md"
                    >
                        Last inn mer
                    </button>
                </div>
            )}
        </div>
    );
};

export default PxWebTableFullscreen;
