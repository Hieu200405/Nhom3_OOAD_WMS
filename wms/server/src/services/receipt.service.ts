import { Types } from 'mongoose';
import { ReceiptModel } from '../models/receipt.model.js';
import { PartnerModel } from '../models/partner.model.js';
import { ProductModel } from '../models/product.model.js';
import { buildPagedResponse, parsePagination } from '../utils/pagination.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';
import { adjustInventory } from './inventory.service.js';
import { resolveDefaultBin } from './warehouse.service.js';
import type { ReceiptStatus } from '@wms/shared';

const allowedTransitions: Record<ReceiptStatus, ReceiptStatus[]> = {
  draft: ['approved'],
  approved: ['supplierConfirmed'],
  supplierConfirmed: ['completed'],
  completed: []
};

type ListQuery = {
  page?: string;
  limit?: string;
  sort?: string;
  status?: ReceiptStatus;
  supplierId?: string;
  query?: string;
};

export const listReceipts = async (query: ListQuery) => {
  const { page, limit, sort, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.supplierId) filter.supplierId = new Types.ObjectId(query.supplierId);
  if (query.query) filter.code = new RegExp(query.query, 'i');
  const [total, items] = await Promise.all([
    ReceiptModel.countDocuments(filter),
    ReceiptModel.find(filter)
      .populate('supplierId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
  ]);
  return buildPagedResponse(
    items.map((item) => ({
      id: item._id.toString(),
      code: item.code,
      supplier: item.supplierId,
      date: item.date,
      status: item.status,
      lines: item.lines,
      notes: item.notes,
      attachments: item.attachments
    })),
    total,
    { page, limit, sort, skip }
  );
};

export const createReceipt = async (
  payload: {
    code: string;
    supplierId: string;
    date: Date;
    lines: { productId: string; qty: number; priceIn: number; locationId?: string }[];
    notes?: string;
    attachments?: string[];
  },
  actorId: string
) => {
  const supplier = await PartnerModel.findOne({
    _id: new Types.ObjectId(payload.supplierId),
    type: 'supplier'
  }).lean();
  if (!supplier) {
    throw badRequest('Supplier not found');
  }
  const existing = await ReceiptModel.findOne({ code: payload.code }).lean();
  if (existing) {
    throw conflict('Receipt code already exists');
  }
  for (const line of payload.lines) {
    const product = await ProductModel.findById(new Types.ObjectId(line.productId)).lean();
    if (!product) {
      throw notFound('Product not found');
    }
    if (line.qty <= 0) {
      throw badRequest('Quantity must be positive');
    }
  }
  const receipt = await ReceiptModel.create({
    ...payload,
    supplierId: supplier._id,
    attachments: payload.attachments ?? []
  });
  await recordAudit({
    action: 'receipt.created',
    entity: 'Receipt',
    entityId: receipt._id,
    actorId,
    payload: {
      code: receipt.code,
      status: receipt.status,
      totalLines: receipt.lines.length
    }
  });
  return receipt.toObject();
};

export const updateReceipt = async (
  id: string,
  payload: Partial<{
    date: Date;
    lines: { productId: string; qty: number; priceIn: number; locationId?: string }[];
    notes?: string;
    attachments?: string[];
  }>,
  actorId: string
) => {
  const receipt = await ReceiptModel.findById(new Types.ObjectId(id));
  if (!receipt) {
    throw notFound('Receipt not found');
  }
  if (receipt.status !== 'draft') {
    throw badRequest('Only draft receipts can be updated');
  }
  if (payload.date) receipt.date = payload.date;
  if (payload.notes !== undefined) receipt.notes = payload.notes;
  if (payload.attachments) receipt.attachments = payload.attachments;
  if (payload.lines) {
    for (const line of payload.lines) {
      if (line.qty <= 0) {
        throw badRequest('Quantity must be positive');
      }
      const product = await ProductModel.findById(new Types.ObjectId(line.productId)).lean();
      if (!product) {
        throw notFound('Product not found');
      }
    }
    receipt.lines = payload.lines.map((line) => ({
      productId: new Types.ObjectId(line.productId),
      qty: line.qty,
      priceIn: line.priceIn,
      locationId: line.locationId ? new Types.ObjectId(line.locationId) : undefined
    }));
  }
  await receipt.save();
  await recordAudit({
    action: 'receipt.updated',
    entity: 'Receipt',
    entityId: receipt._id,
    actorId,
    payload
  });
  return receipt.toObject();
};

const ensureTransition = (current: ReceiptStatus, target: ReceiptStatus) => {
  const allowed = allowedTransitions[current] ?? [];
  if (!allowed.includes(target)) {
    throw badRequest(`Transition from ${current} to ${target} is not allowed`);
  }
};

export const transitionReceipt = async (
  id: string,
  target: ReceiptStatus,
  actorId: string
) => {
  const receipt = await ReceiptModel.findById(new Types.ObjectId(id));
  if (!receipt) {
    throw notFound('Receipt not found');
  }
  ensureTransition(receipt.status, target);

  if (target === 'completed') {
    for (const line of receipt.lines) {
      const locationId = line.locationId?.toString() ?? (await resolveDefaultBin());
      await adjustInventory(line.productId.toString(), locationId, line.qty);
    }
  }

  receipt.status = target;
  await receipt.save();
  await recordAudit({
    action: `receipt.${target}`,
    entity: 'Receipt',
    entityId: receipt._id,
    actorId,
    payload: { status: target }
  });
  return receipt.toObject();
};

export const deleteReceipt = async (id: string, actorId: string) => {
  const receipt = await ReceiptModel.findById(new Types.ObjectId(id));
  if (!receipt) {
    throw notFound('Receipt not found');
  }
  if (receipt.status !== 'draft') {
    throw badRequest('Only draft receipts can be deleted');
  }
  await ReceiptModel.deleteOne({ _id: receipt._id });
  await recordAudit({
    action: 'receipt.deleted',
    entity: 'Receipt',
    entityId: receipt._id,
    actorId,
    payload: { code: receipt.code }
  });
  return true;
};
