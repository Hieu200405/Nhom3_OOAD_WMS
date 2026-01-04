import { Types } from 'mongoose';
import { StocktakeModel } from '../models/stocktake.model.js';
import { InventoryModel } from '../models/inventory.model.js';
import { AdjustmentModel } from '../models/adjustment.model.js';
import { buildPagedResponse, parsePagination } from '../utils/pagination.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';
import { approveAdjustment } from './adjustment.service.js';

interface ListQuery {
  page?: string;
  limit?: string;
  sort?: string;
  status?: string;
  query?: string;
}

export const listStocktakes = async (query: ListQuery) => {
  const { page, limit, sort, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.query) filter.code = new RegExp(query.query, 'i');
  const [total, items] = await Promise.all([
    StocktakeModel.countDocuments(filter),
    StocktakeModel.find(filter).sort(sort).skip(skip).limit(limit).lean()
  ]);
  return buildPagedResponse(
    items.map((item) => ({
      id: item._id.toString(),
      code: item.code,
      date: item.date,
      status: item.status,
      items: item.items,
      adjustmentId: item.adjustmentId?.toString() ?? null,
      approvedBy: item.approvedBy?.toString() ?? null,
      approvedAt: item.approvedAt ?? null,
      minutes: item.minutes ?? null,
      attachments: item.attachments ?? []
    })),
    total,
    { page, limit, sort, skip }
  );
};

const enrichItemsWithSystemQty = async (
  items: { productId: string; locationId: string; systemQty?: number; countedQty: number }[]
) => {
  const results = [] as {
    productId: Types.ObjectId;
    locationId: Types.ObjectId;
    systemQty: number;
    countedQty: number;
  }[];
  for (const item of items) {
    const systemQty =
      typeof item.systemQty === 'number'
        ? item.systemQty
        : (
          await InventoryModel.findOne({
            productId: new Types.ObjectId(item.productId),
            locationId: new Types.ObjectId(item.locationId)
          }).lean()
        )?.quantity ?? 0;
    results.push({
      productId: new Types.ObjectId(item.productId),
      locationId: new Types.ObjectId(item.locationId),
      systemQty,
      countedQty: item.countedQty
    });
  }
  return results;
};

export const createStocktake = async (
  payload: {
    code: string;
    date: Date;
    items: { productId: string; locationId: string; systemQty?: number; countedQty: number }[];
    minutes?: string;
    attachments?: string[];
  },
  actorId: string
) => {
  const existing = await StocktakeModel.findOne({ code: payload.code }).lean();
  if (existing) {
    throw conflict('Stocktake code already exists');
  }
  const items = await enrichItemsWithSystemQty(payload.items);
  const stocktake = await StocktakeModel.create({
    code: payload.code,
    date: payload.date,
    items,
    minutes: payload.minutes,
    attachments: payload.attachments
  });
  await recordAudit({
    action: 'stocktake.created',
    entity: 'Stocktake',
    entityId: stocktake._id,
    actorId,
    payload: { code: stocktake.code, totalItems: stocktake.items.length }
  });
  return stocktake.toObject();
};

export const updateStocktake = async (
  id: string,
  payload: {
    date?: Date;
    items?: { productId: string; locationId: string; systemQty?: number; countedQty: number }[];
    minutes?: string;
    attachments?: string[];
  },
  actorId: string
) => {
  const stocktake = await StocktakeModel.findById(new Types.ObjectId(id));
  if (!stocktake) {
    throw notFound('Stocktake not found');
  }
  if (stocktake.status !== 'draft') {
    throw badRequest('Only draft stocktakes can be updated');
  }
  if (payload.date) stocktake.date = payload.date;
  if (payload.items) {
    stocktake.items = await enrichItemsWithSystemQty(payload.items);
  }
  if (payload.minutes !== undefined) stocktake.minutes = payload.minutes;
  if (payload.attachments !== undefined) stocktake.attachments = payload.attachments;
  await stocktake.save();
  await recordAudit({
    action: 'stocktake.updated',
    entity: 'Stocktake',
    entityId: stocktake._id,
    actorId,
    payload
  });
  return stocktake.toObject();
};

export const approveStocktake = async (
  id: string,
  actorId: string,
  payload?: { minutes?: string; attachments?: string[] }
) => {
  try {
    const stocktake = await StocktakeModel.findById(new Types.ObjectId(id));
    if (!stocktake) {
      throw notFound('Stocktake not found');
    }
    if (stocktake.status !== 'draft') {
      throw badRequest('Only draft stocktakes can be approved');
    }


    const deltas = stocktake.items
      .map((item) => {
        const sys = item.systemQty;
        const counted = item.countedQty;
        const delta = counted - sys;
        return {
          productId: item.productId,
          locationId: item.locationId,
          delta
        };
      })
      .filter((line) => line.delta !== 0);

    // Check for existing adjustment code and auto-increment if needed
    const codeBase = `ADJ-${stocktake.code}`;
    let code = codeBase;
    let i = 1;
    // Note: AdjustmentModel.exists might fail if not connected, but should be fine here.
    while (await AdjustmentModel.exists({ code })) {
      code = `${codeBase}-${i++}`;
    }

    // Create adjustment document with properly converted ObjectIds
    const adjustmentDoc = new AdjustmentModel({
      code,
      reason: 'correction',
      lines: deltas.map(line => ({
        productId: new Types.ObjectId(line.productId.toString()),
        locationId: new Types.ObjectId(line.locationId.toString()),
        delta: line.delta
      }))
    });

    const adjustment = await adjustmentDoc.save();

    stocktake.status = 'approved';
    stocktake.adjustmentId = adjustment._id as Types.ObjectId;
    stocktake.approvedBy = new Types.ObjectId(actorId);
    stocktake.approvedAt = new Date();
    if (payload?.minutes !== undefined) stocktake.minutes = payload.minutes;
    if (payload?.attachments !== undefined) stocktake.attachments = payload.attachments;
    await stocktake.save();

    await recordAudit({
      action: 'stocktake.approved',
      entity: 'Stocktake',
      entityId: stocktake._id,
      actorId,
      payload: { adjustmentId: adjustment._id, approvedAt: stocktake.approvedAt }
    });

    return stocktake.toObject();

  } catch (err) {
    // Re-throw so the controller catches it (asyncHandler will pass to global error handler)
    throw err;
  }
};


export const applyStocktake = async (id: string, actorId: string) => {
  const stocktake = await StocktakeModel.findById(new Types.ObjectId(id));
  if (!stocktake) {
    throw notFound('Stocktake not found');
  }
  if (stocktake.status !== 'approved') {
    throw badRequest('Only approved stocktakes can be applied');
  }
  if (!stocktake.adjustmentId) {
    throw badRequest('No adjustment linked to stocktake');
  }
  await approveAdjustment(stocktake.adjustmentId.toString(), actorId);
  stocktake.status = 'applied';
  await stocktake.save();
  await recordAudit({
    action: 'stocktake.applied',
    entity: 'Stocktake',
    entityId: stocktake._id,
    actorId,
    payload: { adjustmentId: stocktake.adjustmentId }
  });
  return stocktake.toObject();
};
