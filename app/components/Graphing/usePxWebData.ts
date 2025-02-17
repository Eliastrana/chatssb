import { useState, useMemo, useCallback } from "react";
import { PxWebData } from "@/app/types";

interface DimensionInfo {
    name: string;
    label: string;
    categoryKeys: string[];
    categoryLabels: Record<string, string>;
}

export function usePxWebData(pxData: PxWebData) {
    const dimensionEntries = Object.entries(pxData.dimension);

    let timeDimName: string | undefined = undefined;
    if (pxData.role?.time && pxData.role.time.length > 0) {
        timeDimName = pxData.role.time[0];
    } else {
        timeDimName = dimensionEntries.find(([key]) => key.toLowerCase() === "tid")?.[0];
    }
    if (!timeDimName) {
        throw new Error("Could not find time dimension in the PX-Web JSON.");
    }

    const timeDimension = pxData.dimension[timeDimName];
    const timeKeys = Object.keys(timeDimension.category.index);
    const timeLabels = timeDimension.category.label;

    const nonTimeDimensions: DimensionInfo[] = dimensionEntries
        .filter(([dimName]) => dimName !== timeDimName)
        .map(([dimName, dim]) => ({
            name: dimName,
            label: dim.label,
            categoryKeys: Object.keys(dim.category.index),
            categoryLabels: dim.category.label,
        }));

    const [selectedCategories, setSelectedCategories] = useState<Record<string, Set<string>>>(() => {
        const initial: Record<string, Set<string>> = {};
        nonTimeDimensions.forEach((dim) => {
            initial[dim.name] = new Set(dim.categoryKeys);
        });
        return initial;
    });

    const toggleCategory = (dimName: string, catKey: string) => {
        setSelectedCategories((prev) => {
            const next = { ...prev };
            const oldSet = new Set(next[dimName]);
            if (oldSet.has(catKey)) {
                oldSet.delete(catKey);
            } else {
                oldSet.add(catKey);
            }
            next[dimName] = oldSet;
            return next;
        });
    };

    const dimensionNamesInOrder = Object.keys(pxData.dimension);
    const dimensionSizesInOrder = pxData.size;

    const getValue = useCallback(
        (coords: Record<string, string>) => {
            let index1D = 0;
            let stride = 1;
            for (let d = dimensionNamesInOrder.length - 1; d >= 0; d--) {
                const dimName = dimensionNamesInOrder[d];
                const catKey = coords[dimName];
                if (!catKey) {
                    throw new Error(`Missing coordinate for dimension "${dimName}"`);
                }
                const dimObj = pxData.dimension[dimName];
                const catIndex = dimObj.category.index[catKey];
                index1D += catIndex * stride;
                stride *= dimensionSizesInOrder[d];
            }
            return pxData.value[index1D];
        },
        [dimensionNamesInOrder, dimensionSizesInOrder, pxData]
    );

    const [startIndex, setStartIndex] = useState(0);
    const [endIndex, setEndIndex] = useState(timeKeys.length - 1);

    const setRange = (newStart: number, newEnd: number) => {
        setStartIndex(newStart);
        setEndIndex(newEnd);
    };

    const [timeIndex, setTimeIndex] = useState(timeKeys.length - 1);
    const selectedTimeKey = timeKeys[timeIndex];

    function cartesianProduct(arraysOfKeys: string[][], dimNames: string[]) {
        if (arraysOfKeys.length === 0) return [];
        let result: Array<Record<string, string>> = [{}];
        arraysOfKeys.forEach((keys, dimIndex) => {
            const tmp: Array<Record<string, string>> = [];
            for (const comboSoFar of result) {
                for (const k of keys) {
                    tmp.push({
                        ...comboSoFar,
                        [dimNames[dimIndex]]: k,
                    });
                }
            }
            result = tmp;
        });
        return result;
    }

    const combos = useMemo(() => {
        const arraysOfKeys = nonTimeDimensions.map((dim) => [...selectedCategories[dim.name]]);
        const dimNames = nonTimeDimensions.map((dim) => dim.name);
        return cartesianProduct(arraysOfKeys, dimNames);
    }, [nonTimeDimensions, selectedCategories]);

    const barLineSeriesData = useMemo(() => {
        const subTimeKeys = timeKeys.slice(startIndex, endIndex + 1);
        return combos.map((combo) => {
            const series = subTimeKeys.map((tKey) => {
                const fullCoords = { ...combo, [timeDimName]: tKey };
                return {
                    x: timeLabels[tKey] ?? tKey,
                    y: getValue(fullCoords),
                };
            });
            return { combo, series };
        });
    }, [timeKeys, startIndex, endIndex, combos, timeDimName, timeLabels, getValue]);

    const pieBubbleData = useMemo(() => {
        return combos.map((combo) => {
            const coords = { ...combo, [timeDimName]: selectedTimeKey };
            return {
                combo,
                value: getValue(coords),
            };
        });
    }, [combos, getValue, selectedTimeKey, timeDimName]);

    return {
        timeKeys,
        timeLabels,
        startIndex,
        endIndex,
        setRange,
        timeIndex,
        setTimeIndex,
        nonTimeDimensions,
        selectedCategories,
        toggleCategory,
        barLineSeriesData,
        pieBubbleData,
    };
}
