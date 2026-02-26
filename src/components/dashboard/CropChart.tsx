'use client';

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { CropPerformanceData, YieldTrendPoint } from '@/types/dashboard';

interface CropChartProps {
  performance: CropPerformanceData[];
  trends: YieldTrendPoint[];
}

export default function CropChart({ performance, trends }: CropChartProps) {
  if (performance.length === 0 && trends.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400">
        No crop data available. Import data to see charts.
      </div>
    );
  }

  // Bar chart data: group by field
  const barData = performance.map((p) => ({
    name: `${p.fieldName} - ${p.cropName}`,
    yieldPerAcre: p.yieldPerAcre ?? 0,
    totalYield: p.totalYield ?? 0,
  }));

  return (
    <div className="space-y-8">
      {barData.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            Yield by Field & Crop
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="yieldPerAcre" name="Yield/Acre" fill="#15803d" />
              <Bar dataKey="totalYield" name="Total Yield" fill="#86efac" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {trends.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            Yield Trends Over Time
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgYieldPerAcre" name="Avg Yield/Acre" stroke="#15803d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
