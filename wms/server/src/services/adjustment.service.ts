import { Types } from 'mongoose';
import { AdjustmentModel } from '../models/adjustment.model.js';
import { buildPagedResponse, parsePagination } from '../utils/pagination.js';
import { badRequest, notFound } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';
import { adjustInventory } from './inventory.service.js';

interface ListQuery {
  page?: string;
  limit?: string;
  sort?: string;
  query?: string;
}

export const listAdjustments = async (query: ListQuery) => {
  const { page, limit, sort, skip } = parsePagination(query);
  const filter = query.query ? { code: new RegExp(query.query, 'i') } : {};
  const [total, items] = await Promise.all([
    AdjustmentModel.countDocuments(filter),
    AdjustmentModel.find(filter).sort(sort).skip(skip).limit(limit).lean()
  ]);
  return buildPagedResponse(
    items.map((item) => ({
      id: item._id.toString(),
      code: item.code,
      reason: item.reason,
      lines: item.lines,
      approvedBy: item.approvedBy?.toString() ?? null,
      approvedAt: item.approvedAt ?? null
    })),
    total,
    { page, limit, sort, skip }
  );
};

export const createAdjustment = async (
  payload: {
    code: string;
    reason: string;
    lines: { productId: string; locationId: string; delta: number }[];
  },
  actorId: string
) => {
  if (payload.lines.some((line) => line.delta === 0)) {
    throw badRequest('Adjustment delta cannot be zero');
  }
  const adjustment = await AdjustmentModel.create({
    ...payload,
    lines: payload.lines.map((line) => ({
      productId: new Types.ObjectId(line.productId),
      locationId: new Types.ObjectId(line.locationId),
      delta: line.delta
    }))
  });
  await recordAudit({
    action: 'adjustment.created',
    entity: 'Adjustment',
    entityId: adjustment._id,
    actorId,
    payload: { code: adjustment.code, reason: adjustment.reason }
  });
  return adjustment.toObject();
};

export const approveAdjustment = async (id: string, actorId: string) => {
  const adjustment = await AdjustmentModel.findById(new Types.ObjectId(id));
  if (!adjustment) {
    throw notFound('Adjustment not found');
  }
  if (adjustment.approvedBy) {
    throw badRequest('Adjustment already approved');
  }
  for (const line of adjustment.lines) {
    await adjustInventory(line.productId.toString(), line.locationId.toString(), line.delta);
  }
  adjustment.approvedBy = new Types.ObjectId(actorId);
  adjustment.approvedAt = new Date();
  await adjustment.save();
  await recordAudit({
    action: 'adjustment.approved',
    entity: 'Adjustment',
    entityId: adjustment._id,
    actorId,
    payload: { approvedAt: adjustment.approvedAt }
  });
  return adjustment.toObject();
};

export const deleteAdjustment = async (id: string, actorId: string) => {
  const adjustment = await AdjustmentModel.findById(new Types.ObjectId(id));
  if (!adjustment) {
    throw notFound('Adjustment not found');
  }
  if (adjustment.approvedBy) {
    throw badRequest('Approved adjustments cannot be deleted');
  }
  await AdjustmentModel.deleteOne({ _id: adjustment._id });
  await recordAudit({
    action: 'adjustment.deleted',
    entity: 'Adjustment',
    entityId: adjustment._id,
    actorId,
    payload: { code: adjustment.code }
  });
  return true;
};
