import React from 'react';
import { PDFButton } from '../../components/PDFButton.jsx';

export function PdfTestPage() {
  const columns = [
    { key: 'name', header: 'Họ tên' },
    { key: 'note', header: 'Ghi chú' },
    { key: 'qty', header: 'Số lượng' },
  ];

  const rows = [
    { name: 'Nguyễn Văn A', note: 'Kiểm tra hàng hóa', qty: 1000 },
    { name: 'Trần Thị B', note: 'Gửi trả', qty: 250 },
    { name: 'Lê Văn C', note: 'Nhập kho', qty: 540 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">PDF Test (Tiếng Việt)</h1>
      <p className="mb-4">Nhấn nút để xuất file PDF chứa tiếng Việt có dấu và bảng ví dụ.</p>

      <PDFButton
        title="Báo cáo kiểm kê - Tiếng Việt"
        fileName="pdf-test-vietnamese.pdf"
        columns={columns}
        rows={rows}
      />
    </div>
  );
}

export default PdfTestPage;
