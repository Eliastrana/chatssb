/** YourChartPage.tsx */
"use client";
import React from 'react';
import { pxData } from './pxData';
import { PxWebLineChart } from '@/app/components/Graphing/PxWebLineChart';
import {PxWebBarChart} from "@/app/components/Graphing/PxWebBarChart";
import {PxWebPieChart} from "@/app/components/Graphing/PxWebPieChart";
import {PxWebBubbleChart} from "@/app/components/Graphing/PxWebBubbleChart";
import ChartDisplay from "@/app/components/Graphing/ChartDisplay";

export default function YourChartPage() {
    return (
        <div className="p-4">

            <div className="flex flex-col space-y-4">

                <ChartDisplay pxData={pxData} width={600} height={400} />

                <PxWebLineChart data={pxData} width={2000} height={1000} />

                <PxWebBarChart data={pxData} width={2000} height={1000} />

                <PxWebPieChart data={pxData} width={2000} height={1000} />

                <PxWebBubbleChart data={pxData} width={2000} height={1000} />


            </div>
        </div>
    );
}
