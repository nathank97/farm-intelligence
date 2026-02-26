export function generateCsv<T extends object>(
  data: T[],
  columns: { key: keyof T; header: string }[]
): string {
  const header = columns.map((c) => `"${c.header}"`).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        if (val == null) return '';
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return String(val);
      })
      .join(',')
  );
  return [header, ...rows].join('\n');
}

export function downloadCsv(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
