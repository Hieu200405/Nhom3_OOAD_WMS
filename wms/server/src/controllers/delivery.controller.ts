import type { Request, Response } from 'express';
import {
  listDeliveries,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  transitionDelivery,
  exportDeliveriesExcel
} from '../services/delivery.service.js';
import { exportToExcel } from '../services/excel.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await listDeliveries(req.query as any);
  res.json(result);
});

export const exportData = asyncHandler(async (req: Request, res: Response) => {
  const data = await exportDeliveriesExcel(req.query as any);
  await exportToExcel(
    res,
    'Deliveries-List',
    [
      { header: 'Code', key: 'code', width: 20 },
      { header: 'Customer', key: 'customer', width: 30 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Expected Date', key: 'expectedDate', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Lines', key: 'totalLines', width: 10 },
      { header: 'Total Qty', key: 'totalQty', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 }
    ],
    data
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await createDelivery(req.body, req.user!.id);
  res.status(201).json({ data: delivery });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await updateDelivery(req.params.id, req.body, req.user!.id);
  res.json({ data: delivery });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await deleteDelivery(req.params.id, req.user!.id);
  res.status(204).send();
});

export const transition = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await transitionDelivery(req.params.id, req.body.to, req.user!.id);
  res.json({ data: delivery });
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { AuditLogModel } = await import('../models/auditLog.model.js');
  const logs = await AuditLogModel.find({
    entity: 'Delivery',
    entityId: id
  })
    .populate('actorId', 'name')
    .sort({ createdAt: -1 });

  res.json({ data: logs });
});
