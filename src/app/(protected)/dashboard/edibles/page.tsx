'use client';

import { useState, useEffect, useCallback } from 'react';
import FilterBar from '@/components/dashboard/FilterBar';
import DataTable from '@/components/ui/DataTable';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import type { EdibleFieldSeason, EdibleYieldTrend, FilterOption } from '@/types/dashboard';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface EdibleData {
  fieldSeasons: EdibleFieldSeason[];
  yieldTrends: EdibleYieldTrend[];
  filterOptions: {
    years: FilterOption[];
    fields: FilterOption[];
    beanTypes: FilterOption[];
  };
}

export default function EdiblePerformancePage() {
  const [data, setData] = useState<EdibleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [beanType, setBeanType] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (year) params.set('year', year);
    if (fieldId) params.set('fieldId', fieldId);
    if (beanType) params.set('beanType', beanType);

    const res = await fetch(`/api/dashboard/edibles?${params}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [year, fieldId, beanType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Bean Performance
      </h1>

      {data && (
        <div className="mb-6">
          <FilterBar
            filters={[
              { key: 'year', label: 'All Years', options: data.filterOptions.years, value: year, onChange: setYear },
              { key: 'field', label: 'All Fields', options: data.filterOptions.fields, value: fieldId, onChange: setFieldId },
              { key: 'beanType', label: 'All Bean Types', options: data.filterOptions.beanTypes, value: beanType, onChange: setBeanType },
            ]}
          />
        </div>
      )}

      {loading && <LoadingSpinner />}

      {data && data.yieldTrends.length > 0 && (
        <Card title="Yield Trends by Year">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.yieldTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" label={{ value: 'Yield (cwt/ac)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: '$/Ac Docked', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value) => formatNumber(Number(value), 2)} />
                <Legend />
                <Bar yAxisId="left" dataKey="avgYield" fill="#22c55e" name="Avg Yield" />
                <Line yAxisId="right" type="monotone" dataKey="avgPerAcDocked" stroke="#ef4444" name="Avg $/Ac Docked" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {data && data.fieldSeasons.length > 0 && (
        <div className="mt-6">
          <Card title={`Field Seasons (${data.fieldSeasons.length} records)`}>
            <DataTable
              data={data.fieldSeasons}
              columns={[
                { key: 'fieldName', header: 'Field' },
                { key: 'year', header: 'Year' },
                { key: 'beanType', header: 'Type' },
                { key: 'loadCount', header: 'Loads' },
                { key: 'yield', header: 'Yield (cwt/ac)', render: (v) => v != null ? formatNumber(v as number, 1) : '-' },
                { key: 'avgMoisture', header: 'Moisture', render: (v) => v != null ? formatNumber(v as number, 1) + '%' : '-' },
                { key: 'perAcDocked', header: '$/Ac Docked', render: (v) => v != null ? formatCurrency(v as number) : '-' },
                { key: 'finalPrice', header: 'Final Price', render: (v) => v != null ? formatCurrency(v as number) : '-' },
              ]}
            />
          </Card>
        </div>
      )}

      {data && data.fieldSeasons.length === 0 && !loading && (
        <Card>
          <p className="py-8 text-center text-slate-500">No edible bean data found. Import edible bean data to see performance analytics.</p>
        </Card>
      )}
    </div>
  );
}
