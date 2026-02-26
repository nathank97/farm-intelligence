'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface DbSummary {
  corn: { totalLoads: number; totalFields: number; yearRange: string };
  edibles: { totalLoads: number; totalFields: number; yearRange: string };
  financial: { totalRecords: number; totalFields: number; yearRange: string };
}

export default function DashboardPage() {
  const [data, setData] = useState<DbSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/overview')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const databases = data ? [
    {
      title: 'Corn Database',
      href: '/dashboard/corn',
      stats: [
        { label: 'Loads', value: data.corn.totalLoads.toLocaleString() },
        { label: 'Fields', value: String(data.corn.totalFields) },
        { label: 'Years', value: data.corn.yearRange },
      ],
      color: 'text-yellow-600 dark:text-yellow-400',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      title: 'Edibles Database',
      href: '/dashboard/edibles',
      stats: [
        { label: 'Loads', value: data.edibles.totalLoads.toLocaleString() },
        { label: 'Fields', value: String(data.edibles.totalFields) },
        { label: 'Years', value: data.edibles.yearRange },
      ],
      color: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      title: 'Field P&L',
      href: '/dashboard/financial',
      stats: [
        { label: 'Records', value: data.financial.totalRecords.toLocaleString() },
        { label: 'Fields', value: String(data.financial.totalFields) },
        { label: 'Years', value: data.financial.yearRange },
      ],
      color: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
  ] : [];

  const isEmpty = data && data.corn.totalLoads === 0 && data.edibles.totalLoads === 0 && data.financial.totalRecords === 0;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Dashboard Overview
      </h1>

      {isEmpty ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">No data imported yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Go to <Link href="/admin/upload" className="text-green-600 underline">Import Data</Link> to upload your Excel files.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {databases.map((db) => (
            <Link key={db.href} href={db.href}>
              <div className={`rounded-xl border bg-white p-6 transition-shadow hover:shadow-md dark:bg-slate-900 ${db.borderColor}`}>
                <h3 className={`text-lg font-semibold ${db.color}`}>{db.title}</h3>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {db.stats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
