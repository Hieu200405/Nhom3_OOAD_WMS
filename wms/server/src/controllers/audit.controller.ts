import type { Request, Response } from 'express';
import { listAuditLogs } from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
    const result = await listAuditLogs(req.query as any);
    res.json(result);
});
