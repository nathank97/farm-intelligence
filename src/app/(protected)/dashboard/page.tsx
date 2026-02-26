import Link from 'next/link';
import { getStatsOverview } from '@/services/cropService';
import StatsCard from '@/components/dashboard/StatsCard';
import { formatCurrency, formatNumber } from '@/utils/formatters';

export default async function DashboardPage() {
  const stats = await getStatsOverview();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Dashboard Overview
      </h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Fields" value={String(stats.totalFields)} />
        <StatsCard title="Total Crops" value={String(stats.totalCrops)} />
        <StatsCard title="Total Acreage" value={formatNumber(stats.totalAcreage, 0)} />
        <StatsCard
          title="Avg Yield/Acre"
          value={stats.avgYieldPerAcre != null ? formatNumber(stats.avgYieldPerAcre) : '-'}
        />
        <StatsCard
          title="Avg Gross Margin"
          value={stats.avgGrossMargin != null ? formatCurrency(stats.avgGrossMargin) : '-'}
        />
        <StatsCard
          title="Latest Year"
          value={stats.latestYear != null ? String(stats.latestYear) : '-'}
        />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
        Quick Links
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/crop-performance"
          className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
        >
          <h3 className="font-semibold text-green-700">Crop Performance</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View yield data, trends, and field comparisons
          </p>
        </Link>
        <Link
          href="/dashboard/financial"
          className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
        >
          <h3 className="font-semibold text-green-700">Financial Summary</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Revenue, costs, margins, and breakdowns
          </p>
        </Link>
        <Link
          href="/dashboard/integrated"
          className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
        >
          <h3 className="font-semibold text-green-700">Integrated View</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Combined crop and financial analysis
          </p>
        </Link>
      </div>
    </div>
  );
}
