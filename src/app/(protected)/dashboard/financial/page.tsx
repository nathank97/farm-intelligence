'use client';

import { useState, useEffect, useCallback } from 'react';
import FilterBar from '@/components/dashboard/FilterBar';
import FinancialChart from '@/components/dashboard/FinancialChart';
import DataTable from '@/components/ui/DataTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import StatsCard from '@/components/dashboard/StatsCard';
import Button from '@/components/ui/Button';
import { downloadCsv } from '@/utils/csvExport';
import { formatCurrency } from '@/utils/formatters';
import type { FilterOption, FinancialSummaryData, CostBreakdown } from '@/types/dashboard';
import type { ApiResponse } from '@/types/api';

interface FinancialStats {
  totalRevenue: number;
  totalCost: number;
  totalGrossMargin: number;
  avgCostPerAcre: number;
  avgRevenuePerAcre: number;
  avgGrossMargin: number;
}

export default function FinancialPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ year: '', crop: '', field: '' });
  const [filterOptions, setFilterOptions] = useState<{
    years: FilterOption[];
    crops: FilterOption[];
    fields: FilterOption[];
  }>({ years: [], crops: [], fields: [] });
  const [summary, setSummary] = useState<FinancialSummaryData[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.year) params.set('year', filters.year);
    if (filters.crop) params.set('cropId', filters.crop);
    if (filters.field) params.set('fieldId', filters.field);

    const res = await fetch(`/api/dashboard/financial?${params}`);
    const json: ApiResponse<{
      summary: FinancialSummaryData[];
      costBreakdown: CostBreakdown[];
      stats: FinancialStats;
    }> = await res.json();

    if (json.success && json.data) {
      setSummary(json.data.summary);
      setCostBreakdown(json.data.costBreakdown);
      setStats(json.data.stats);

      // Build filter options from data on first load
      if (filterOptions.years.length === 0) {
        const years = [...new Set(json.data.summary.map((s) => String(s.year)))].sort().reverse();
        const crops = [...new Set(json.data.summary.map((s) => s.cropName))].sort();
        const fields = [...new Set(json.data.summary.map((s) => s.fieldName))].sort();
        setFilterOptions({
          years: years.map((y) => ({ value: y, label: y })),
          crops: crops.map((c) => ({ value: c, label: c })),
          fields: fields.map((f) => ({ value: f, label: f })),
        });
      }
    }
    setLoading(false);
  }, [filters, filterOptions.years.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    const header = 'Field,Crop,Year,Total Cost,Total Revenue,Gross Margin,Cost/Acre,Revenue/Acre\n';
    const rows = summary.map((s) =>
      `"${s.fieldName}","${s.cropName}",${s.year},${s.totalCost ?? ''},${s.totalRevenue ?? ''},${s.grossMargin ?? ''},${s.costPerAcre ?? ''},${s.revenuePerAcre ?? ''}`
    ).join('\n');
    downloadCsv(header + rows, 'financial-summary.csv');
  };

  if (loading && summary.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Financial Summary</h1>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={summary.length === 0}>
          Export CSV
        </Button>
      </div>

      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} />
          <StatsCard title="Total Cost" value={formatCurrency(stats.totalCost)} />
          <StatsCard title="Total Gross Margin" value={formatCurrency(stats.totalGrossMargin)} />
          <StatsCard title="Avg Cost/Acre" value={formatCurrency(stats.avgCostPerAcre)} />
          <StatsCard title="Avg Revenue/Acre" value={formatCurrency(stats.avgRevenuePerAcre)} />
          <StatsCard title="Avg Gross Margin" value={formatCurrency(stats.avgGrossMargin)} />
        </div>
      )}

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
          <FinancialChart summary={summary} costBreakdown={costBreakdown} />
        </Card>
      </div>

      <Card title="Data Table">
        <DataTable
          data={summary}
          columns={[
            { key: 'fieldName', header: 'Field' },
            { key: 'cropName', header: 'Crop' },
            { key: 'year', header: 'Year' },
            { key: 'totalCost', header: 'Total Cost', render: (v) => formatCurrency(v as number | null) },
            { key: 'totalRevenue', header: 'Revenue', render: (v) => formatCurrency(v as number | null) },
            { key: 'grossMargin', header: 'Margin', render: (v) => formatCurrency(v as number | null) },
            { key: 'costPerAcre', header: 'Cost/Acre', render: (v) => formatCurrency(v as number | null) },
            { key: 'revenuePerAcre', header: 'Rev/Acre', render: (v) => formatCurrency(v as number | null) },
          ]}
          emptyMessage="No financial data. Import data to get started."
        />
      </Card>
    </div>
  );
}
