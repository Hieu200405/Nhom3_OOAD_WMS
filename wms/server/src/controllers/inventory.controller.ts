import type { Request, Response } from 'express';
import { listInventory, moveInventory, exportInventoryExcel } from '../services/inventory.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { exportToExcel } from '../services/excel.service.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await listInventory(req.query as any);
  res.json(result);
});

export const move = asyncHandler(async (req: Request, res: Response) => {
  await moveInventory(req.body);
  res.status(200).json({ message: 'Inventory moved' });
});

export const exportData = asyncHandler(async (req: Request, res: Response) => {
  const data = await exportInventoryExcel(req.query as any);
  await exportToExcel(
    res,
    'Inventory-Report',
    [
      { header: 'Product SKU', key: 'sku', width: 20 },
      { header: 'Product Name', key: 'name', width: 40 },
      { header: 'Location', key: 'location', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Batch', key: 'batch', width: 20 },
      { header: 'Expiry Date', key: 'expDate', width: 20 }
    ],
    data
  );
});
