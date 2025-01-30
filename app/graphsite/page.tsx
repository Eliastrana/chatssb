/** YourChartPage.tsx */
"use client";
import React from 'react';
import { pxData } from './pxData';
import { PxWebLineChart } from '@/app/components/Graphing/PxWebLineChart';

export default function YourChartPage() {
    return (
        <div className="p-4">

            <div className="flex flex-col space-y-4">
            {/* Pass the pxData straight into the chart */}
            <PxWebLineChart data={pxData} width={2000} height={1000} />

            </div>
        </div>
    );
}
