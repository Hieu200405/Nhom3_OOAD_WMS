import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ensurePdfFonts } from '../utils/pdfFonts';

export function PDFButton({
  title = 'Report',
  fileName = 'report.pdf',
  columns = [],
  rows = [],
  className = '',
  onBeforeExport,
}) {
  const handleExport = async () => {
    try {
      if (onBeforeExport) {
        await onBeforeExport();
      }

  await ensurePdfFonts();

  const doc = new jsPDF('p', 'pt', 'a4');
  // Use the loaded font family (NotoSans if available, otherwise Inter)
  const family = (typeof window !== 'undefined' && window.__pdfFontFamily) || 'Inter';
  doc.setFont(family, 'bold');
      doc.setFontSize(16);
      doc.text(title, 40, 40, { maxWidth: 515 });

      const tableRows = rows.map((row) =>
        columns.map((column) => {
          const rawValue =
            column.export && typeof column.export === 'function'
              ? column.export(row?.[column.key], row)
              : row?.[column.key];
          if (rawValue == null) return '';
          if (typeof rawValue === 'number') return rawValue.toLocaleString('vi-VN');
          return String(rawValue);
        }),
      );

      autoTable(doc, {
        head: [columns.map((column) => column.header ?? column.key)],
        body: tableRows,
        startY: 70,
        theme: 'grid',
        styles: {
          halign: 'left',
          valign: 'middle',
          fontSize: 10,
          font: family,
        },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          font: family,
          fontStyle: 'bold',
        },
        bodyStyles: {
          font: family,
        },
        alternateRowStyles: {
          fillColor: [245, 247, 255],
        },
      });

      doc.save(fileName);
      toast.success('Xuất PDF thành công');
    } catch (error) {
      console.error('Failed to export PDF', error);
      toast.error('Xuất PDF thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className={`inline-flex items-center gap-2 rounded-md border border-indigo-500 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10 ${className}`}
    >
      <FileDown className="h-4 w-4" />
      Export PDF
    </button>
  );
}
