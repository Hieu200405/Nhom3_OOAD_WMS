import type { Request, Response } from 'express';
import {
  listReceipts,
  createReceipt,
  updateReceipt,
  deleteReceipt,
  transitionReceipt
} from '../services/receipt.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuditLogModel } from '../models/auditLog.model.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await listReceipts(req.query as any);
  res.json(result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const receipt = await createReceipt(req.body, req.user!.id);
  res.status(201).json({ data: receipt });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const receipt = await updateReceipt(req.params.id, req.body, req.user!.id);
  res.json({ data: receipt });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await deleteReceipt(req.params.id, req.user!.id);
  res.status(204).send();
});

export const transition = asyncHandler(async (req: Request, res: Response) => {
  const receipt = await transitionReceipt(req.params.id, req.body.to, req.user!.id);
  res.json({ data: receipt });
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const logs = await AuditLogModel.find({
    entity: 'Receipt',
    entityId: id
  })
    .populate('actorId', 'name email')
    .sort({ createdAt: -1 });

  res.json({ data: logs });
});