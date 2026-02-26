'use client';

import { useState, useEffect, useCallback } from 'react';
import FilterBar from '@/components/dashboard/FilterBar';
import DataTable from '@/components/ui/DataTable';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { CropProfitability, FilterOption } from '@/types/dashboard';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';

interface CropData {
  crops: CropProfitability[];
  filterOptions: {
    years: FilterOption[];
    fields: FilterOption[];
    crops: FilterOption[];
    cropCategories: FilterOption[];
  };
}

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'];

export default function CropProfitabilityPage() {
  const [data, setData] = useState<CropData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [cropCategory, setCropCategory] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (year) params.set('year', year);
    if (cropCategory) params.set('cropCategory', cropCategory);

    const res = await fetch(`/api/dashboard/financial/crops?${params}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [year, cropCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Crop Profitability
      </h1>

      {data && (
        <div className="mb-6">
          <FilterBar
            filters={[
              { key: 'year', label: 'All Years', options: data.filterOptions.years, value: year, onChange: setYear },
              { key: 'cropCategory', label: 'All Categories', options: data.filterOptions.cropCategories, value: cropCategory, onChange: setCropCategory },
            ]}
          />
        </div>
      )}

      {loading && <LoadingSpinner />}

      {data && data.crops.length > 0 && (
        <Card title="Average Profit per Acre by Crop">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.crops} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="crop" width={110} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="avgProfitPerAcre" name="Avg Profit/Ac">
                  {data.crops.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {data && data.crops.length > 0 && (
        <div className="mt-6">
          <Card title={`Crop Comparison (${data.crops.length} crops)`}>
            <DataTable
              data={data.crops}
              columns={[
                { key: 'crop', header: 'Crop' },
                { key: 'cropCategory', header: 'Category' },
                { key: 'yearCount', header: 'Years' },
                { key: 'fieldCount', header: 'Fields' },
                { key: 'avgYield', header: 'Avg Yield', render: (v) => formatNumber(v as number, 1) },
                { key: 'avgIncomePerAcre', header: 'Avg Inc/Ac', render: (v) => formatCurrency(v as number) },
                { key: 'avgCostPerAcre', header: 'Avg Cost/Ac', render: (v) => formatCurrency(v as number) },
                { key: 'avgProfitPerAcre', header: 'Avg Profit/Ac', render: (v) => formatCurrency(v as number) },
                { key: 'totalAcres', header: 'Total Acres', render: (v) => formatNumber(v as number, 0) },
              ]}
            />
          </Card>
        </div>
      )}

      {data && data.crops.length === 0 && !loading && (
        <Card>
          <p className="py-8 text-center text-slate-500">No crop profitability data found. Import Field P&L data first.</p>
        </Card>
      )}
    </div>
  );
}
