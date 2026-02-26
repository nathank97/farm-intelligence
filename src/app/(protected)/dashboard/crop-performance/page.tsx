'use client';

import { useState, useEffect, useCallback } from 'react';
import FilterBar from '@/components/dashboard/FilterBar';
import CropChart from '@/components/dashboard/CropChart';
import DataTable from '@/components/ui/DataTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { downloadCsv } from '@/utils/csvExport';
import { formatNumber } from '@/utils/formatters';
import type { FilterOption, CropPerformanceData, YieldTrendPoint } from '@/types/dashboard';
import type { ApiResponse } from '@/types/api';

export default function CropPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ year: '', crop: '', field: '' });
  const [filterOptions, setFilterOptions] = useState<{
    years: FilterOption[];
    crops: FilterOption[];
    fields: FilterOption[];
  }>({ years: [], crops: [], fields: [] });
  const [performance, setPerformance] = useState<CropPerformanceData[]>([]);
  const [trends, setTrends] = useState<YieldTrendPoint[]>([]);

  const fetchFilterOptions = useCallback(async () => {
    const res = await fetch('/api/dashboard/crop-performance');
    // Filter options could come from a dedicated endpoint; for now we fetch the main data
    // and derive available filter options from the initial load
    const json: ApiResponse<{ performance: CropPerformanceData[]; trends: YieldTrendPoint[] }> = await res.json();
    if (json.success && json.data) {
      const years = [...new Set(json.data.performance.map((p) => String(p.year)))].sort().reverse();
      const crops = [...new Set(json.data.performance.map((p) => p.cropName))].sort();
      const fields = [...new Set(json.data.performance.map((p) => p.fieldName))].sort();
      setFilterOptions({
        years: years.map((y) => ({ value: y, label: y })),
        crops: crops.map((c) => ({ value: c, label: c })),
        fields: fields.map((f) => ({ value: f, label: f })),
      });
      setPerformance(json.data.performance);
      setTrends(json.data.trends);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.year) params.set('year', filters.year);
    if (filters.crop) params.set('cropId', filters.crop);
    if (filters.field) params.set('fieldId', filters.field);

    const res = await fetch(`/api/dashboard/crop-performance?${params}`);
    const json: ApiResponse<{ performance: CropPerformanceData[]; trends: YieldTrendPoint[] }> = await res.json();
    if (json.success && json.data) {
      setPerformance(json.data.performance);
      setTrends(json.data.trends);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    if (filterOptions.years.length > 0) {
      fetchData();
    }
  }, [filters, fetchData, filterOptions.years.length]);

  const handleExport = () => {
    const header = 'Field,Crop,Variety,Year,Acreage,Yield/Acre,Total Yield\n';
    const rows = performance.map((p) =>
      `"${p.fieldName}","${p.cropName}","${p.varietyName ?? ''}",${p.year},${p.acreage},${p.yieldPerAcre ?? ''},${p.totalYield ?? ''}`
    ).join('\n');
    downloadCsv(header + rows, 'crop-performance.csv');
  };

  if (loading && performance.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Crop Performance</h1>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={performance.length === 0}>
          Export CSV
        </Button>
      </div>

      <div className="mb-6">
        <FilterBar
          years={filterOptions.years}
          crops={filterOptions.crops}
          fields={filterOptions.fields}
          selectedYear={filters.year}
          selectedCrop={filters.crop}
          selectedField={filters.field}
          onYearChange={(v) => setFilters((f) => ({ ...f, year: v }))}
          onCropChange={(v) => setFilters((f) => ({ ...f, crop: v }))}
          onFieldChange={(v) => setFilters((f) => ({ ...f, field: v }))}
        />
      </div>

      <div className="mb-6">
        <Card title="Charts">
          <CropChart performance={performance} trends={trends} />
        </Card>
      </div>

      <Card title="Data Table">
        <DataTable
          data={performance}
          columns={[
            { key: 'fieldName', header: 'Field' },
            { key: 'cropName', header: 'Crop' },
            { key: 'varietyName', header: 'Variety', render: (v) => String(v ?? '-') },
            { key: 'year', header: 'Year' },
            { key: 'acreage', header: 'Acreage', render: (v) => formatNumber(v as number) },
            { key: 'yieldPerAcre', header: 'Yield/Acre', render: (v) => formatNumber(v as number | null) },
            { key: 'totalYield', header: 'Total Yield', render: (v) => formatNumber(v as number | null) },
          ]}
          emptyMessage="No crop performance data. Import data to get started."
        />
      </Card>
    </div>
  );
}
