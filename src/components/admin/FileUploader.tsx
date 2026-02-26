'use client';

import { useState, useRef, type DragEvent } from 'react';
import Button from '@/components/ui/Button';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function FileUploader({
  onFileSelect,
  accept = '.xlsx,.xls',
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);
    const validExts = accept.split(',').map((e) => e.trim());
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExts.includes(ext)) {
      setError(`Invalid file type. Accepted: ${accept}`);
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum size: ${maxSizeMB}MB`);
      return false;
    }
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-slate-300 hover:border-green-400 dark:border-slate-600'
        }`}
      >
        <svg className="mb-3 h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          {selectedFile ? selectedFile.name : 'Drop your Excel file here'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {selectedFile
            ? `${(selectedFile.size / 1024).toFixed(1)} KB`
            : `or click to browse (${accept}, max ${maxSizeMB}MB)`}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="hidden"
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {selectedFile && (
        <div className="mt-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedFile(null); setError(null); }}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
