import type { Request, Response } from 'express';
import {
  listDeliveries,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  transitionDelivery
} from '../services/delivery.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await listDeliveries(req.query as any);
  res.json(result);
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
