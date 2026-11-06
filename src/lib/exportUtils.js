/**
 * Utility to export tabular data to downloadable CSV format
 * @param {Array<Object>} data Array of row objects
 * @param {string} filename Name of the file without extension
 * @param {Array<{ key: string, label: string }>} columns Optional custom columns mapping
 */
export function exportToCSV(data, filename = 'export', columns = null) {
  if (!Array.isArray(data) || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Determine headers
  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const headers = cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

  // Format rows
  const rows = data.map(row => {
    return cols.map(col => {
      let val = row[col.key];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

