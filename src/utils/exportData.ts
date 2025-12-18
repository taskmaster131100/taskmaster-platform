/**
 * Data Export Utilities
 * Supports CSV, JSON, and Excel formats
 */

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export interface ExportOptions {
  filename: string;
  columns: ExportColumn[];
  data: any[];
  format: 'csv' | 'json' | 'excel';
}

/**
 * Export data to CSV format
 */
export function exportToCSV(options: ExportOptions): void {
  const { filename, columns, data } = options;

  // Create CSV header
  const header = columns.map(col => col.label).join(',');

  // Create CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key];
      const formattedValue = col.format ? col.format(value) : value;
      
      // Escape commas and quotes
      const escaped = String(formattedValue || '')
        .replace(/"/g, '""')
        .replace(/\n/g, ' ');
      
      return `"${escaped}"`;
    }).join(',');
  });

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Download file
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Export data to JSON format
 */
export function exportToJSON(options: ExportOptions): void {
  const { filename, columns, data } = options;

  // Transform data based on columns
  const transformedData = data.map(item => {
    const transformed: any = {};
    columns.forEach(col => {
      const value = item[col.key];
      transformed[col.label] = col.format ? col.format(value) : value;
    });
    return transformed;
  });

  // Create JSON string
  const json = JSON.stringify(transformedData, null, 2);

  // Download file
  downloadFile(json, `${filename}.json`, 'application/json;charset=utf-8;');
}

/**
 * Export data to Excel format (using HTML table method)
 */
export function exportToExcel(options: ExportOptions): void {
  const { filename, columns, data } = options;

  // Create HTML table
  let html = '<html><head><meta charset="utf-8"></head><body><table>';
  
  // Header
  html += '<thead><tr>';
  columns.forEach(col => {
    html += `<th>${col.label}</th>`;
  });
  html += '</tr></thead>';

  // Body
  html += '<tbody>';
  data.forEach(item => {
    html += '<tr>';
    columns.forEach(col => {
      const value = item[col.key];
      const formattedValue = col.format ? col.format(value) : value;
      html += `<td>${formattedValue || ''}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></body></html>';

  // Download file
  downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
}

/**
 * Main export function
 */
export function exportData(options: ExportOptions): void {
  switch (options.format) {
    case 'csv':
      exportToCSV(options);
      break;
    case 'json':
      exportToJSON(options);
      break;
    case 'excel':
      exportToExcel(options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Helper function to download file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob(['\ufeff' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number | null, currency: string = 'USD'): string {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Format boolean for export
 */
export function formatBooleanForExport(value: boolean | null): string {
  if (value === null || value === undefined) return '';
  return value ? 'Yes' : 'No';
}
