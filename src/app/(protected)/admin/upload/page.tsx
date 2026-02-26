'use client';

import { useState } from 'react';
import FileUploader from '@/components/admin/FileUploader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { ImportResult } from '@/types/import';
import type { ApiSuccessResponse, ApiErrorResponse } from '@/types/api';

const FILE_TYPE_LABELS: Record<string, string> = {
  corn: 'Corn Database',
  edibles: 'Edibles Database',
  field_pl: 'Field P&L',
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json() as ApiSuccessResponse<ImportResult> | ApiErrorResponse;

      if (json.success) {
        setResult(json.data);
        setFile(null);
      } else {
        setError(json.error.message);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Import Data</h1>

      <Card title="Upload Excel File" description="Upload a .xlsx or .xlsm file. The system auto-detects whether it's Corn, Edibles, or Field P&L data.">
        <div className="space-y-4">
          <FileUploader onFileSelect={setFile} />

          {file && !result && (
            <div className="flex items-center gap-3">
              <Button onClick={handleUpload} loading={uploading}>
                {uploading ? 'Importing...' : 'Import Data'}
              </Button>
              <span className="text-sm text-slate-500">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
        </div>
      </Card>

      {result && (
        <div className="mt-6 space-y-4">
          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Detected: {FILE_TYPE_LABELS[result.fileType] ?? result.fileType}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  result.rowsFailed === 0
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : result.rowsProcessed > 0
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {result.rowsFailed === 0 ? 'Success' : result.rowsProcessed > 0 ? 'Partial' : 'Failed'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">Rows Processed</p>
                  <p className="text-xl font-bold text-green-600">{result.rowsProcessed.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Rows Failed</p>
                  <p className="text-xl font-bold text-red-600">{result.rowsFailed}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Errors ({result.errors.length}):
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded bg-slate-50 p-3 text-xs dark:bg-slate-800">
                    {result.errors.slice(0, 20).map((err, i) => (
                      <p key={i} className="text-red-600 dark:text-red-400">
                        Row {err.row}: {err.field ? `[${err.field}] ` : ''}{err.message}
                      </p>
                    ))}
                    {result.errors.length > 20 && (
                      <p className="mt-1 text-slate-500">...and {result.errors.length - 20} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Button
            variant="outline"
            onClick={() => { setResult(null); setFile(null); }}
          >
            Upload Another File
          </Button>
        </div>
      )}
    </div>
  );
}
