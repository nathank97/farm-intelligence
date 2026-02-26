'use client';

import { useState, useEffect, useCallback } from 'react';
import FilterBar from '@/components/dashboard/FilterBar';
import CropChart from '@/components/dashboard/CropChart';
import FinancialChart from '@/components/dashboard/FinancialChart';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import type { FilterOption, CropPerformanceData, YieldTrendPoint, FinancialSummaryData, CostBreakdown } from '@/types/dashboard';
import type { ApiResponse } from '@/types/api';

export default function IntegratedPage() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ year: '', crop: '', field: '' });
  const [filterOptions, setFilterOptions] = useState<{
    years: FilterOption[];
    crops: FilterOption[];
    fields: FilterOption[];
  }>({ years: [], crops: [], fields: [] });

  const [performance, setPerformance] = useState<CropPerformanceData[]>([]);
  const [trends, setTrends] = useState<YieldTrendPoint[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryData[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.year) params.set('year', filters.year);
    if (filters.crop) params.set('cropId', filters.crop);
    if (filters.field) params.set('fieldId', filters.field);

    const [cropRes, finRes] = await Promise.all([
      fetch(`/api/dashboard/crop-performance?${params}`),
      fetch(`/api/dashboard/financial?${params}`),
    ]);

    const cropJson: ApiResponse<{ performance: CropPerformanceData[]; trends: YieldTrendPoint[] }> = await cropRes.json();
    const finJson: ApiResponse<{ summary: FinancialSummaryData[]; costBreakdown: CostBreakdown[] }> = await finRes.json();

    if (cropJson.success && cropJson.data) {
      setPerformance(cropJson.data.performance);
      setTrends(cropJson.data.trends);

      if (filterOptions.years.length === 0) {
        const years = [...new Set(cropJson.data.performance.map((p) => String(p.year)))].sort().reverse();
        const crops = [...new Set(cropJson.data.performance.map((p) => p.cropName))].sort();
        const fields = [...new Set(cropJson.data.performance.map((p) => p.fieldName))].sort();
        setFilterOptions({
          years: years.map((y) => ({ value: y, label: y })),
          crops: crops.map((c) => ({ value: c, label: c })),
          fields: fields.map((f) => ({ value: f, label: f })),
        });
      }
    }

    if (finJson.success && finJson.data) {
      setFinancialSummary(finJson.data.summary);
      setCostBreakdown(finJson.data.costBreakdown);
    }

    setLoading(false);
  }, [filters, filterOptions.years.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && performance.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Integrated View</h1>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Crop Performance">
          <CropChart performance={performance} trends={trends} />
        </Card>
        <Card title="Financial Overview">
          <FinancialChart summary={financialSummary} costBreakdown={costBreakdown} />
        </Card>
      </div>
    </div>
  );
}
