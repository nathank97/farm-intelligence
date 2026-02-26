'use client';

import { useState, useEffect, useCallback } from 'react';
import FilterBar from '@/components/dashboard/FilterBar';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatNumber, formatCurrency } from '@/utils/formatters';
import type { DockageBreakdown, FilterOption } from '@/types/dashboard';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

interface DockageData {
  dockage: DockageBreakdown[];
  filterOptions: {
    years: FilterOption[];
    fields: FilterOption[];
    beanTypes: FilterOption[];
  };
}

export default function DockageAnalysisPage() {
  const [data, setData] = useState<DockageData | null>(null);
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

    const res = await fetch(`/api/dashboard/edibles/dockage?${params}`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [year, fieldId, beanType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Dockage Analysis
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

      {data && data.dockage.length > 0 && (
        <>
          <Card title="Dockage by Category">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dockage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="avgPerAcDocked" fill="#ef4444" name="Avg $/Ac Docked" />
                  <Bar dataKey="totalDollarDocked" fill="#f97316" name="Total $ Docked" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="mt-6">
            <Card title="Dockage Detail">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Category</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">Avg Value</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">Total $ Docked</th>
                      <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-300">Avg $/Ac Docked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dockage.map((d) => (
                      <tr key={d.category} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{d.category}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{formatNumber(d.avgValue, 2)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(d.totalDollarDocked)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(d.avgPerAcDocked)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}

      {data && data.dockage.length === 0 && !loading && (
        <Card>
          <p className="py-8 text-center text-slate-500">No dockage data found. Import edible bean data to see dockage analysis.</p>
        </Card>
      )}
    </div>
  );
}
