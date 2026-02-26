'use client';

import { useState, useEffect, useCallback } from 'react';
import FilterBar from '@/components/dashboard/FilterBar';
import DataTable from '@/components/ui/DataTable';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatNumber } from '@/utils/formatters';
import type { CornFieldSeason, CornYieldTrend, FilterOption } from '@/types/dashboard';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface CornData {
  fieldSeasons: CornFieldSeason[];
  yieldTrends: CornYieldTrend[];
  filterOptions: {
    years: FilterOption[];
    fields: FilterOption[];
    cornTypes: FilterOption[];
    seedCompanies: FilterOption[];
  };
}

export default function CornPerformancePage() {
  const [data, setData] = useState<CornData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [cornType, setCornType] = useState('');
  const [seedCompany, setSeedCompany] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (year) params.set('year', year);
    if (fieldId) params.set('fieldId', fieldId);
    if (cornType) params.set('cornType', cornType);
    if (seedCompany) params.set('seedCompany', seedCompany);

    const res = await fetch(`/api/dashboard/corn?${params}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [year, fieldId, cornType, seedCompany]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Corn Performance
      </h1>

      {data && (
        <div className="mb-6">
          <FilterBar
            filters={[
              { key: 'year', label: 'All Years', options: data.filterOptions.years, value: year, onChange: setYear },
              { key: 'field', label: 'All Fields', options: data.filterOptions.fields, value: fieldId, onChange: setFieldId },
              { key: 'cornType', label: 'All Corn Types', options: data.filterOptions.cornTypes, value: cornType, onChange: setCornType },
              { key: 'seedCompany', label: 'All Seed Companies', options: data.filterOptions.seedCompanies, value: seedCompany, onChange: setSeedCompany },
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
                <YAxis yAxisId="left" label={{ value: 'Dry Yield (bu/ac)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Moisture %', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value) => formatNumber(Number(value), 1)} />
                <Legend />
                <Bar yAxisId="left" dataKey="avgDryYield" fill="#eab308" name="Avg Dry Yield" />
                <Line yAxisId="right" type="monotone" dataKey="avgMoisture" stroke="#3b82f6" name="Avg Moisture" />
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
                { key: 'cornType', header: 'Type' },
                { key: 'seedCompany', header: 'Seed Co' },
                { key: 'loadCount', header: 'Loads' },
                { key: 'avgDryYield', header: 'Avg Dry Yield', render: (v) => v != null ? formatNumber(v as number, 1) : '-' },
                { key: 'avgMoisture', header: 'Avg Moisture', render: (v) => v != null ? formatNumber(v as number, 1) + '%' : '-' },
                { key: 'avgTestWeight', header: 'Avg TW', render: (v) => v != null ? formatNumber(v as number, 1) : '-' },
              ]}
            />
          </Card>
        </div>
      )}

      {data && data.fieldSeasons.length === 0 && !loading && (
        <Card>
          <p className="py-8 text-center text-slate-500">No corn data found. Import corn data to see performance analytics.</p>
        </Card>
      )}
    </div>
  );
}
