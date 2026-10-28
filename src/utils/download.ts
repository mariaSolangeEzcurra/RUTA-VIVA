export function downloadBlob(content: BlobPart, fileName: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson(data: unknown, fileName: string): void {
  downloadBlob(JSON.stringify(data, null, 2), fileName, 'application/json');
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(';'), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(';'))].join('\n');
}

export function downloadCsv(rows: Record<string, unknown>[], fileName: string): void {
  downloadBlob('\ufeff' + toCsv(rows), fileName, 'text/csv;charset=utf-8');
}