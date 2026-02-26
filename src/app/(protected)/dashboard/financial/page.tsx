'use client';

import { useState, useEffect, useCallback } from 'react';
import FilterBar from '@/components/dashboard/FilterBar';
import DataTable from '@/components/ui/DataTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import StatsCard from '@/components/dashboard/StatsCard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { FieldPLSummary, YearOverYearFinancial, FilterOption } from '@/types/dashboard';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface FinancialData {
  summaries: FieldPLSummary[];
  expenses: { category: string; amount: number; percentage: number }[];
  revenue: { category: string; amount: number; percentage: number }[];
  yearOverYear: YearOverYearFinancial[];
  filterOptions: {
    years: FilterOption[];
    fields: FilterOption[];
    crops: FilterOption[];
    cropCategories: FilterOption[];
  };
}

export default function FinancialPage() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [cropCategory, setCropCategory] = useState('');
  const [crop, setCrop] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (year) params.set('year', year);
    if (fieldId) params.set('fieldId', fieldId);
    if (cropCategory) params.set('cropCategory', cropCategory);
    if (crop) params.set('crop', crop);

    const res = await fetch(`/api/dashboard/financial?${params}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [year, fieldId, cropCategory, crop]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute summary stats
  const stats = data?.summaries ? (() => {
    const incomes = data.summaries.map((s) => s.totalIncPerAcre).filter((v): v is number => v !== null);
    const costs = data.summaries.map((s) => s.totalCostPerAcre).filter((v): v is number => v !== null);
    const profits = data.summaries.map((s) => s.profitPerAcreByCrop).filter((v): v is number => v !== null);
    return {
      avgIncome: incomes.length > 0 ? incomes.reduce((a, b) => a + b, 0) / incomes.length : 0,
      avgCost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
      avgProfit: profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0,
      recordCount: data.summaries.length,
    };
  })() : null;

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Financial Overview
      </h1>

      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Records" value={String(stats.recordCount)} />
          <StatsCard title="Avg Income/Ac" value={formatCurrency(stats.avgIncome)} />
          <StatsCard title="Avg Cost/Ac" value={formatCurrency(stats.avgCost)} />
          <StatsCard title="Avg Profit/Ac" value={formatCurrency(stats.avgProfit)} />
        </div>
      )}

      {data && (
        <div className="mb-6">
          <FilterBar
            filters={[
              { key: 'year', label: 'All Years', options: data.filterOptions.years, value: year, onChange: setYear },
              { key: 'field', label: 'All Fields', options: data.filterOptions.fields, value: fieldId, onChange: setFieldId },
              { key: 'cropCategory', label: 'All Categories', options: data.filterOptions.cropCategories, value: cropCategory, onChange: setCropCategory },
              { key: 'crop', label: 'All Crops', options: data.filterOptions.crops, value: crop, onChange: setCrop },
            ]}
          />
        </div>
      )}

      {loading && <LoadingSpinner />}

      {data && data.yearOverYear.length > 0 && (
        <Card title="Income vs Cost by Year">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.yearOverYear}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="avgIncomePerAcre" fill="#22c55e" name="Avg Income/Ac" />
                <Bar dataKey="avgCostPerAcre" fill="#ef4444" name="Avg Cost/Ac" />
                <Line type="monotone" dataKey="avgProfitPerAcre" stroke="#3b82f6" name="Avg Profit/Ac" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {data && data.summaries.length > 0 && (
        <div className="mt-6">
          <Card title={`P&L Summary (${data.summaries.length} records)`}>
            <DataTable
              data={data.summaries}
              columns={[
                { key: 'fieldName', header: 'Field' },
                { key: 'year', header: 'Year' },
                { key: 'crop', header: 'Crop' },
                { key: 'acres', header: 'Acres', render: (v) => formatNumber(v as number, 0) },
                { key: 'yield', header: 'Yield', render: (v) => v != null ? formatNumber(v as number, 1) : '-' },
                { key: 'totalIncPerAcre', header: 'Inc/Ac', render: (v) => v != null ? formatCurrency(v as number) : '-' },
                { key: 'totalCostPerAcre', header: 'Cost/Ac', render: (v) => v != null ? formatCurrency(v as number) : '-' },
                { key: 'profitPerAcreByCrop', header: 'Profit/Ac', render: (v) => v != null ? formatCurrency(v as number) : '-' },
                { key: 'roi', header: 'ROI', render: (v) => v != null ? formatNumber((v as number) * 100, 1) + '%' : '-' },
              ]}
            />
          </Card>
        </div>
      )}

      {data && data.summaries.length === 0 && !loading && (
        <Card>
          <p className="py-8 text-center text-slate-500">No P&L data found. Import Field P&L data to see financial analytics.</p>
        </Card>
      )}
    </div>
  );
}
