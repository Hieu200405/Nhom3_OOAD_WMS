import type { Request, Response } from 'express';
import { listInventory, moveInventory } from '../services/inventory.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await listInventory(req.query as any);
  res.json(result);
});

export const move = asyncHandler(async (req: Request, res: Response) => {
  await moveInventory(req.body);
  res.status(200).json({ message: 'Inventory moved' });
});
