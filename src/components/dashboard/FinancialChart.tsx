'use client';

import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { FinancialSummaryData, CostBreakdown } from '@/types/dashboard';

interface FinancialChartProps {
  summary: FinancialSummaryData[];
  costBreakdown: CostBreakdown[];
}

const PIE_COLORS = ['#15803d', '#22c55e', '#86efac', '#f59e0b'];

export default function FinancialChart({ summary, costBreakdown }: FinancialChartProps) {
  if (summary.length === 0 && costBreakdown.every((c) => c.amount === 0)) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400">
        No financial data available. Import data to see charts.
      </div>
    );
  }

  const barData = summary.map((s) => ({
    name: `${s.fieldName} - ${s.cropName}`,
    revenue: s.totalRevenue ?? 0,
    cost: s.totalCost ?? 0,
    margin: s.grossMargin ?? 0,
  }));

  const pieData = costBreakdown.filter((c) => c.amount > 0);

  return (
    <div className="space-y-8">
      {barData.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            Revenue vs Cost by Field
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#15803d" />
              <Bar dataKey="cost" name="Cost" fill="#ef4444" />
              <Bar dataKey="margin" name="Margin" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {pieData.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            Cost Breakdown
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
