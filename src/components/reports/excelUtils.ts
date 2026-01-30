import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface ExcelExportOptions {
  filename: string;
  sheets: Array<{
    name: string;
    data: Record<string, string | number | boolean | null | undefined>[];
    headers?: string[];
  }>;
}

export const exportToExcel = (options: ExcelExportOptions) => {
  const workbook = XLSX.utils.book_new();

  options.sheets.forEach(sheet => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);

    // Add headers if provided
    if (sheet.headers && sheet.headers.length > 0) {
      XLSX.utils.sheet_add_aoa(worksheet, [sheet.headers], { origin: 'A1' });
      // Shift data down by one row
      const dataRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let row = dataRange.e.r; row >= 1; row--) {
        for (let col = dataRange.s.c; col <= dataRange.e.c; col++) {
          const fromCell = XLSX.utils.encode_cell({ r: row, c: col });
          const toCell = XLSX.utils.encode_cell({ r: row + 1, c: col });
          if (worksheet[fromCell]) {
            worksheet[toCell] = worksheet[fromCell];
            delete worksheet[fromCell];
          }
        }
      }
      worksheet['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: dataRange.e.r + 1, c: dataRange.e.c }
      });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  const filename = `${options.filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

export const formatDate = (date: Date | string | { toDate(): Date } | null | undefined) => {
  if (!date) return '';
  try {
    if (typeof date === 'object' && 'toDate' in date) return format(date.toDate(), 'yyyy-MM-dd HH:mm:ss');
    return format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return String(date);
  }
};

export const formatRating = (rating: number | undefined) => {
  return rating ? rating.toFixed(1) : 'N/A';
};