import type { Request, Response } from 'express';
import {
  getOverviewReport,
  getInventoryReport,
  getInboundReport,
  getOutboundReport,
  getStocktakeReport,
  createPdfBuffer
} from '../services/report.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { badRequest } from '../utils/errors.js';

export const overview = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getOverviewReport();
  res.json({ data });
});

export const inventory = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getInventoryReport();
  res.json({ data });
});

export const inbound = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getInboundReport();
  res.json({ data });
});

export const outbound = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getOutboundReport();
  res.json({ data });
});

export const stocktake = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getStocktakeReport();
  res.json({ data });
});

const reportMap = {
  overview: getOverviewReport,
  inventory: getInventoryReport,
  inbound: getInboundReport,
  receipts: getInboundReport,
  outbound: getOutboundReport,
  deliveries: getOutboundReport,
  stocktake: getStocktakeReport,
  stocktaking: getStocktakeReport
} as const;

type ReportKey = keyof typeof reportMap;

export const pdf = asyncHandler(async (req: Request, res: Response) => {
  const type = req.params.type as ReportKey;
  const resolver = reportMap[type];
  if (!resolver) {
    throw badRequest('Unknown report type');
  }
  const data = await resolver();
  const buffer = await createPdfBuffer(`${type.toUpperCase()} Report`, data);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-report.pdf`);
  res.send(buffer);
});
