import type { ImportSummary } from '@/types/import';

interface ValidationResultsProps {
  result: ImportSummary;
}

export default function ValidationResults({ result }: ValidationResultsProps) {
  const statusStyles = {
    success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300',
    partial: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
    failed: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
  };

  const statusLabels = {
    success: 'Import Successful',
    partial: 'Partial Import',
    failed: 'Import Failed',
  };

  return (
    <div className={`rounded-xl border p-6 ${statusStyles[result.status]}`}>
      <h3 className="text-lg font-semibold">{statusLabels[result.status]}</h3>
      <p className="mt-1 text-sm opacity-80">File: {result.fileName}</p>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-2xl font-bold">{result.totalRows}</p>
          <p className="text-xs opacity-70">Total Rows</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{result.rowsProcessed}</p>
          <p className="text-xs opacity-70">Processed</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{result.rowsFailed}</p>
          <p className="text-xs opacity-70">Failed</p>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium">Errors:</h4>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
            {result.errors.map((err, i) => (
              <li key={i} className="rounded bg-white/50 px-3 py-1.5 dark:bg-black/20">
                Row {err.row}: <span className="font-medium">{err.field}</span> — {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
