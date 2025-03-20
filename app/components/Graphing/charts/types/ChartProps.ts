import * as d3 from "d3";

export interface BarChartProps {
    width?: number;
    height?: number;
    data: {
        combo: Record<string, string>;
        series: { x: string; y: number }[];
    }[];
    customColorScale?: d3.ScaleOrdinal<string, string>;
    colorDim?: string;
}

export interface LineChartProps {
    width?: number;
    height?: number;
    data: {
        combo: Record<string, string>;
        series: { x: string; y: number }[];
    }[];
    customColorScale?: d3.ScaleOrdinal<string, string>;
    colorDim?: string;

}

export interface PieChartProps {
    width?: number;
    height?: number;
    data: { combo: Record<string, string>; value: number }[];
    dimension?: Record<string, {
        label: string;
        category: {
            label: Record<string, string>;
            index: Record<string, number>;
        };
    }>;
    colorDim?: string;
    customColorScale?: d3.ScaleOrdinal<string, string>;
}



export interface BubbleChartProps {
    width?: number;
    height?: number;
    data: {
        combo: Record<string, string>;
        value: number;
    }[];
    colorDim?: string;
    customColorScale?: d3.ScaleOrdinal<string, string>;
}

export interface HierarchyDatum {
    children?: HierarchyDatum[];
    combo?: Record<string, string>;
    value?: number;
}