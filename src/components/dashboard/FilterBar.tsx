'use client';

import type { FilterOption } from '@/types/dashboard';

interface FilterBarProps {
  years: FilterOption[];
  crops: FilterOption[];
  fields: FilterOption[];
  selectedYear?: string;
  selectedCrop?: string;
  selectedField?: string;
  onYearChange: (value: string) => void;
  onCropChange: (value: string) => void;
  onFieldChange: (value: string) => void;
}

export default function FilterBar({
  years,
  crops,
  fields,
  selectedYear = '',
  selectedCrop = '',
  selectedField = '',
  onYearChange,
  onCropChange,
  onFieldChange,
}: FilterBarProps) {
  const selectClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200';

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        className={selectClass}
      >
        <option value="">All Years</option>
        {years.map((y) => (
          <option key={y.value} value={y.value}>{y.label}</option>
        ))}
      </select>

      <select
        value={selectedCrop}
        onChange={(e) => onCropChange(e.target.value)}
        className={selectClass}
      >
        <option value="">All Crops</option>
        {crops.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <select
        value={selectedField}
        onChange={(e) => onFieldChange(e.target.value)}
        className={selectClass}
      >
        <option value="">All Fields</option>
        {fields.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
    </div>
  );
}
