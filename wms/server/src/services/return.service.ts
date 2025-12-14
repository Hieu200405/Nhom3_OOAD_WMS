import { Types } from 'mongoose';
import { ReturnModel, type ReturnDocument } from '../models/return.model.js';
import { ProductModel } from '../models/product.model.js';
import { DisposalModel } from '../models/disposal.model.js';
import { buildPagedResponse, parsePagination } from '../utils/pagination.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';
import { adjustInventory } from './inventory.service.js';
import { resolveDefaultBin } from './warehouse.service.js';
import { env } from '../config/env.js';
import type { ReturnStatus } from '@wms/shared';

const allowedTransitions: Record<ReturnStatus, ReturnStatus[]> = {
  draft: ['approved'],
  approved: ['completed'],
  completed: []
};

type ListQuery = {
  page?: string;
  limit?: string;
  sort?: string;
  status?: ReturnStatus;
  query?: string;
  from?: 'customer' | 'supplier';
};

export const listReturns = async (query: ListQuery) => {
  const { page, limit, sort, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.from) filter.from = query.from;
  if (query.query) filter.code = new RegExp(query.query, 'i');
  const [total, items] = await Promise.all([
    ReturnModel.countDocuments(filter),
    ReturnModel.find(filter).sort(sort).skip(skip).limit(limit).lean()
  ]);
  return buildPagedResponse(
    items.map((item) => ({
      id: item._id.toString(),
      code: item.code,
      from: item.from,
      status: item.status,
      items: item.items,
      disposalId: item.disposalId?.toString() ?? null
    })),
    total,
    { page, limit, sort, skip }
  );
};

export const createReturn = async (
  payload: {
    code: string;
    from: 'customer' | 'supplier';
    refId?: string;
    items: { productId: string; qty: number; reason: string; expDate?: Date }[];
  },
  actorId: string
) => {
  const existing = await ReturnModel.findOne({ code: payload.code }).lean();
  if (existing) {
    throw conflict('Return code already exists');
  }
  for (const item of payload.items) {
    if (item.qty <= 0) {
      throw badRequest('Quantity must be positive');
    }
    const product = await ProductModel.findById(new Types.ObjectId(item.productId)).lean();
    if (!product) {
      throw notFound('Product not found');
    }
  }
  const returnDoc = await ReturnModel.create({
    ...payload,
    refId: payload.refId ? new Types.ObjectId(payload.refId) : undefined
  });
  await recordAudit({
    action: 'return.created',
    entity: 'Return',
    entityId: returnDoc._id,
    actorId,
    payload: { code: returnDoc.code, from: returnDoc.from }
  });
  return returnDoc.toObject();
};

export const updateReturn = async (
  id: string,
  payload: Partial<{
    items: { productId: string; qty: number; reason: string; expDate?: Date }[];
  }>,
  actorId: string
) => {
  const returnDoc = await ReturnModel.findById(new Types.ObjectId(id));
  if (!returnDoc) {
    throw notFound('Return not found');
  }
  if (returnDoc.status !== 'draft') {
    throw badRequest('Only draft returns can be updated');
  }
  if (payload.items) {
    for (const item of payload.items) {
      if (item.qty <= 0) {
        throw badRequest('Quantity must be positive');
      }
      const product = await ProductModel.findById(new Types.ObjectId(item.productId)).lean();
      if (!product) {
        throw notFound('Product not found');
      }
    }
    returnDoc.items = payload.items.map((item) => ({
      productId: new Types.ObjectId(item.productId),
      qty: item.qty,
      reason: item.reason,
      expDate: item.expDate
    }));
  }
  await returnDoc.save();
  await recordAudit({
    action: 'return.updated',
    entity: 'Return',
    entityId: returnDoc._id,
    actorId,
    payload
  });
  return returnDoc.toObject();
};

const ensureTransition = (current: ReturnStatus, target: ReturnStatus) => {
  const allowed = allowedTransitions[current] ?? [];
  if (!allowed.includes(target)) {
    throw badRequest(`Transition from ${current} to ${target} is not allowed`);
  }
};

const createDisposalForExpired = async (
  returnDoc: ReturnDocument,
  items: { productId: string; qty: number; reason: string; price: number }[],
  actorId: string,
  locationId: string
) => {
  if (!items.length) {
    return null;
  }
  const totalValue = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const boardRequired = totalValue > env.highValueDisposalThreshold;
  const disposal = await DisposalModel.create({
    code: `DSP-${returnDoc.code}`,
    reason: 'expired',
    totalValue,
    boardRequired,
    boardMembers: boardRequired ? [] : undefined,
    status: boardRequired ? 'draft' : 'approved',
    items: items.map((item) => ({
      productId: new Types.ObjectId(item.productId),
      locationId: new Types.ObjectId(locationId),
      qty: item.qty,
      value: item.price * item.qty
    }))
  });
  await recordAudit({
    action: 'disposal.autoCreated',
    entity: 'Disposal',
    entityId: disposal._id,
    actorId,
    payload: { returnId: returnDoc._id }
  });
  return disposal;
};

export const transitionReturn = async (
  id: string,
  target: ReturnStatus,
  actorId: string
) => {
  const returnDoc = await ReturnModel.findById(new Types.ObjectId(id));
  if (!returnDoc) {
    throw notFound('Return not found');
  }
  ensureTransition(returnDoc.status as ReturnStatus, target);

  if (target === 'completed') {
    const defaultBin = await resolveDefaultBin();
    const expiredItems: { productId: string; qty: number; reason: string; price: number }[] = [];
    for (const item of returnDoc.items) {
      const product = await ProductModel.findById(item.productId);
      if (!product) {
        throw notFound('Product not found');
      }
      const isExpired = item.expDate ? item.expDate < new Date() : false;
      if (returnDoc.from === 'customer') {
        await adjustInventory(item.productId.toString(), defaultBin, item.qty);
        if (isExpired) {
          expiredItems.push({
            productId: item.productId.toString(),
            qty: item.qty,
            reason: item.reason,
            price: product.priceIn
          });
        }
      } else {
        await adjustInventory(item.productId.toString(), defaultBin, -item.qty);
      }
    }
    if (expiredItems.length) {
      const disposal = await createDisposalForExpired(returnDoc, expiredItems, actorId, defaultBin);
      returnDoc.disposalId = disposal ? (disposal._id as Types.ObjectId) : null;
    }
  }

  returnDoc.status = target;
  await returnDoc.save();
  await recordAudit({
    action: `return.${target}`,
    entity: 'Return',
    entityId: returnDoc._id,
    actorId,
    payload: { status: target, disposalId: returnDoc.disposalId }
  });
  return returnDoc.toObject();
};

export const deleteReturn = async (id: string, actorId: string) => {
  const returnDoc = await ReturnModel.findById(new Types.ObjectId(id));
  if (!returnDoc) {
    throw notFound('Return not found');
  }
  if (returnDoc.status !== 'draft') {
    throw badRequest('Only draft returns can be deleted');
  }
  await ReturnModel.deleteOne({ _id: returnDoc._id });
  await recordAudit({
    action: 'return.deleted',
    entity: 'Return',
    entityId: returnDoc._id,
    actorId,
    payload: { code: returnDoc.code }
  });
  return true;
};
