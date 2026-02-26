'use client';

import { useState } from 'react';
import FileUploader from '@/components/admin/FileUploader';
import ValidationResults from '@/components/admin/ValidationResults';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { ImportSummary } from '@/types/import';
import type { ApiResponse } from '@/types/api';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);
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

      const json: ApiResponse<ImportSummary> = await res.json();

      if (json.success && json.data) {
        setResult(json.data);
        setFile(null);
      } else {
        setError(json.error ?? 'Upload failed');
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

      <Card title="Upload Excel File" description="Upload a .xlsx file with your farm data. Required columns: Field Name, Crop Name, Year.">
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
        <div className="mt-6">
          <ValidationResults result={result} />
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
            >
              Upload Another File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
