'use client';

import { useState, useEffect, useCallback } from 'react';
import FilterBar from '@/components/dashboard/FilterBar';
import DataTable from '@/components/ui/DataTable';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatNumber } from '@/utils/formatters';
import type { FilterOption } from '@/types/dashboard';

interface VarietyData {
  variety: string;
  seedCompany: string;
  loadCount: number;
  avgDryYield: number | null;
  avgMoisture: number | null;
  avgTestWeight: number | null;
}

interface PageData {
  varieties: VarietyData[];
  filterOptions: {
    years: FilterOption[];
    fields: FilterOption[];
    cornTypes: FilterOption[];
    seedCompanies: FilterOption[];
  };
}

export default function CornVarietiesPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [cornType, setCornType] = useState('');
  const [seedCompany, setSeedCompany] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (year) params.set('year', year);
    if (cornType) params.set('cornType', cornType);
    if (seedCompany) params.set('seedCompany', seedCompany);

    const res = await fetch(`/api/dashboard/corn/varieties?${params}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [year, cornType, seedCompany]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Corn Varieties
      </h1>

      {data && (
        <div className="mb-6">
          <FilterBar
            filters={[
              { key: 'year', label: 'All Years', options: data.filterOptions.years, value: year, onChange: setYear },
              { key: 'cornType', label: 'All Corn Types', options: data.filterOptions.cornTypes, value: cornType, onChange: setCornType },
              { key: 'seedCompany', label: 'All Seed Companies', options: data.filterOptions.seedCompanies, value: seedCompany, onChange: setSeedCompany },
            ]}
          />
        </div>
      )}

      {loading && <LoadingSpinner />}

      {data && data.varieties.length > 0 && (
        <Card title={`Variety Performance (${data.varieties.length} varieties)`}>
          <DataTable
            data={data.varieties}
            columns={[
              { key: 'variety', header: 'Variety' },
              { key: 'seedCompany', header: 'Seed Company' },
              { key: 'loadCount', header: 'Loads' },
              { key: 'avgDryYield', header: 'Avg Dry Yield (bu/ac)', render: (v) => v != null ? formatNumber(v as number, 1) : '-' },
              { key: 'avgMoisture', header: 'Avg Moisture %', render: (v) => v != null ? formatNumber(v as number, 1) : '-' },
              { key: 'avgTestWeight', header: 'Avg Test Weight', render: (v) => v != null ? formatNumber(v as number, 1) : '-' },
            ]}
          />
        </Card>
      )}

      {data && data.varieties.length === 0 && !loading && (
        <Card>
          <p className="py-8 text-center text-slate-500">No variety data found. Import corn data to see variety performance.</p>
        </Card>
      )}
    </div>
  );
}
