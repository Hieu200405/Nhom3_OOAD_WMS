export const initialData = {
  categories: [
    { id: 'cat-electronics', name: 'Thiết bị điện', description: 'Nhóm hàng điện tử' },
    { id: 'cat-fmcg', name: 'Tiêu dùng nhanh', description: 'Thực phẩm & đồ uống' },
    { id: 'cat-office', name: 'Văn phòng phẩm', description: 'Dụng cụ văn phòng' },
  ],
  products: [
    {
      id: 'prod-laptop',
      sku: 'LTP-001',
      name: 'Laptop Pro 14',
      categoryId: 'cat-electronics',
      priceIn: 22000000,
      priceOut: 26500000,
      unit: 'Cái',
      barcode: '8930000000011',
    },
    {
      id: 'prod-mouse',
      sku: 'MSE-010',
      name: 'Chuột không dây',
      categoryId: 'cat-electronics',
      priceIn: 250000,
      priceOut: 320000,
      unit: 'Cái',
      barcode: '8930000000028',
    },
    {
      id: 'prod-coffee',
      sku: 'CAF-100',
      name: 'Cà phê rang xay 500g',
      categoryId: 'cat-fmcg',
      priceIn: 70000,
      priceOut: 92000,
      unit: 'Gói',
    },
    {
      id: 'prod-notebook',
      sku: 'NTB-050',
      name: 'Sổ tay A5',
      categoryId: 'cat-office',
      priceIn: 18000,
      priceOut: 32000,
      unit: 'Cuốn',
    },
  ],
  suppliers: [
    {
      id: 'sup-ace',
      name: 'ACE Distribution',
      contact: 'sales@ace.vn | 0901 234 567',
      contract: 'ACE-2024-01',
    },
    {
      id: 'sup-vcoffee',
      name: 'Viet Coffee Ltd',
      contact: 'support@vietcoffee.vn | 0934 556 678',
      contract: 'VCF-2024-05',
    },
  ],
  customers: [
    {
      id: 'cus-modern',
      name: 'Modern Retail',
      type: 'Key Account',
      policy: 'Thanh toán 30 ngày',
    },
    {
      id: 'cus-smartshop',
      name: 'Smart Shop',
      type: 'Wholesale',
      policy: 'Chiết khấu 3%',
    },
  ],
  warehouses: [
    { id: 'wh-hcm', name: 'Kho HCM', location: 'KCN Tân Tạo, Bình Tân, TP.HCM' },
  ],
  warehouseLocations: [
    { id: 'loc-wh-hcm', parentId: null, type: 'Warehouse', name: 'Kho HCM', code: 'WH-HCM', barcode: 'WHHCM' },
    { id: 'loc-hcm-zone-a', parentId: 'loc-wh-hcm', type: 'Zone', name: 'Khu A', code: 'WH-HCM-A', barcode: 'WHHCMA' },
    { id: 'loc-hcm-row-a1', parentId: 'loc-hcm-zone-a', type: 'Row', name: 'Dãy A1', code: 'WH-HCM-A-A1', barcode: 'WHHCMAA1' },
    { id: 'loc-hcm-rack-a1-01', parentId: 'loc-hcm-row-a1', type: 'Rack', name: 'Kệ 01', code: 'WH-HCM-A-A1-01', barcode: 'WHHCMAA101' },
    { id: 'loc-hcm-bin-a1-01-01', parentId: 'loc-hcm-rack-a1-01', type: 'Bin', name: 'Ngăn 01', code: 'WH-HCM-A-A1-01-01', barcode: 'WHHCMAA10101' },
  ],
  inventory: [
    { id: 'inv-laptop', productId: 'prod-laptop', quantity: 18, status: 'Available', locationId: 'loc-hcm-bin-a1-01-01' },
    { id: 'inv-mouse', productId: 'prod-mouse', quantity: 120, status: 'Available', locationId: 'loc-hcm-bin-a1-01-01' },
    { id: 'inv-coffee', productId: 'prod-coffee', quantity: 80, status: 'Available', locationId: 'loc-hcm-bin-a1-01-01' },
    { id: 'inv-notebook', productId: 'prod-notebook', quantity: 240, status: 'Available', locationId: 'loc-hcm-bin-a1-01-01' },
  ],
  receipts: [
    {
      id: 'rcp-20241001',
      supplierId: 'sup-ace',
      date: '2024-10-01',
      status: 'Completed',
      hasShortage: false,
      lines: [
        { id: 'rcp-20241001-line-1', productId: 'prod-laptop', sku: 'LTP-001', name: 'Laptop Pro 14', quantity: 10, price: 21500000 },
        { id: 'rcp-20241001-line-2', productId: 'prod-mouse', sku: 'MSE-010', name: 'Chuột không dây', quantity: 50, price: 240000 },
      ],
      total: 10 * 21500000 + 50 * 240000,
      inventoryApplied: true,
    },
    {
      id: 'rcp-20241005',
      supplierId: 'sup-vcoffee',
      date: '2024-10-05',
      status: 'Approved',
      lines: [
        { id: 'rcp-20241005-line-1', productId: 'prod-coffee', sku: 'CAF-100', name: 'Cà phê rang xay 500g', quantity: 40, price: 68000 },
      ],
      total: 40 * 68000,
      inventoryApplied: false,
      hasShortage: true,
      shortageNote: 'Nhà cung cấp hẹn bổ sung sau 5 ngày',
    },
  ],
  deliveries: [
    {
      id: 'dvy-20241003',
      customerId: 'cus-modern',
      date: '2024-10-03',
      status: 'Delivered',
      note: 'Giao đúng hẹn',
      lines: [
        { id: 'dvy-20241003-line-1', productId: 'prod-laptop', sku: 'LTP-001', name: 'Laptop Pro 14', quantity: 4, price: 26000000 },
        { id: 'dvy-20241003-line-2', productId: 'prod-mouse', sku: 'MSE-010', name: 'Chuột không dây', quantity: 20, price: 300000 },
      ],
      total: 4 * 26000000 + 20 * 300000,
      inventoryApplied: false,
    },
    {
      id: 'dvy-20241007',
      customerId: 'cus-smartshop',
      date: '2024-10-07',
      status: 'Draft',
      lines: [
        { id: 'dvy-20241007-line-1', productId: 'prod-notebook', sku: 'NTB-050', name: 'Sổ tay A5', quantity: 30, price: 30000 },
      ],
      total: 30 * 30000,
      inventoryApplied: false,
    },
  ],
  incidents: [
    {
      id: 'inc-20241005',
      type: 'Giao thiếu',
      note: 'Supplier ACE giao thiếu 5 chuột',
      action: 'Bổ sung trong 7 ngày',
      relatedId: 'rcp-20241005',
    },
  ],
  stocktaking: [
    {
      id: 'st-202409',
      name: 'Kiểm kê kho tháng 09',
      date: '2024-09-30',
      status: 'Pending Approval',
      adjustments: [
        {
          id: 'st-202409-aj-1',
          productId: 'prod-mouse',
          recordedQuantity: 120,
          actualQuantity: 118,
          difference: -2,
          reason: 'Thiếu hàng do giao nhầm',
          status: 'Pending',
        },
      ],
    },
  ],
  returns: [
    {
      id: 'ret-20241001',
      customerId: 'cus-modern',
      date: '2024-10-01',
      reason: 'Khách trả hàng lỗi',
      status: 'Awaiting Inspection',
      items: [
        { id: 'ret-20241001-1', productId: 'prod-laptop', quantity: 1 },
      ],
    },
  ],
  disposals: [
    {
      id: 'dsp-20240915',
      reason: 'Expired',
      date: '2024-09-15',
      status: 'Pending Approval',
      council: '',
      attachment: '',
      items: [
        { id: 'dsp-20240915-1', productId: 'prod-coffee', quantity: 5 },
      ],
    },
  ],
};
