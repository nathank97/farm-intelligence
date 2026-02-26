import Card from '@/components/ui/Card';

export default function IntegratedPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Integrated Analytics
      </h1>

      <Card>
        <div className="py-12 text-center">
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Phase 2: Cross-Database Analytics
          </p>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-500 dark:text-slate-400">
            Cross-database analytics will link corn yields, bean quality, and financial performance
            by field and year. This will enable questions like &ldquo;Which fields are most profitable
            for corn vs. beans?&rdquo; and &ldquo;How does dockage impact profitability?&rdquo;
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <p className="font-medium text-yellow-700 dark:text-yellow-400">Corn Yields</p>
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500">7,571 load records</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <p className="font-medium text-green-700 dark:text-green-400">Bean Quality</p>
              <p className="mt-1 text-xs text-green-600 dark:text-green-500">1,877 delivery records</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="font-medium text-blue-700 dark:text-blue-400">Financial P&L</p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-500">1,208 annual summaries</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
