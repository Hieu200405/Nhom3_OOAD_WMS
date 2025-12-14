import { Types } from 'mongoose';
import { DisposalModel } from '../models/disposal.model.js';
import { buildPagedResponse, parsePagination } from '../utils/pagination.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';
import { adjustInventory } from './inventory.service.js';
import { env } from '../config/env.js';
import type { DisposalStatus } from '@wms/shared';

const allowedTransitions: Record<DisposalStatus, DisposalStatus[]> = {
  draft: ['approved'],
  approved: ['completed'],
  completed: []
};

interface ListQuery {
  page?: string;
  limit?: string;
  sort?: string;
  status?: DisposalStatus;
  query?: string;
}

export const listDisposals = async (query: ListQuery) => {
  const { page, limit, sort, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.query) filter.code = new RegExp(query.query, 'i');
  const [total, items] = await Promise.all([
    DisposalModel.countDocuments(filter),
    DisposalModel.find(filter).sort(sort).skip(skip).limit(limit).lean()
  ]);
  return buildPagedResponse(
    items.map((item) => ({
      id: item._id.toString(),
      code: item.code,
      status: item.status,
      reason: item.reason,
      totalValue: item.totalValue,
      boardRequired: item.boardRequired,
      boardMembers: item.boardMembers,
      minutesFileUrl: item.minutesFileUrl,
      items: item.items
    })),
    total,
    { page, limit, sort, skip }
  );
};

const computeTotalValue = (
  items: { productId: string; locationId: string; qty: number; value?: number }[],
  fallbackPrice = 0
) =>
  items.reduce((sum, item) => sum + item.qty * (item.value ?? fallbackPrice), 0);

export const createDisposal = async (
  payload: {
    code: string;
    reason: string;
    boardMembers?: string[];
    minutesFileUrl?: string;
    items: { productId: string; locationId: string; qty: number; value?: number }[];
    totalValue?: number;
    boardRequired?: boolean;
  },
  actorId: string
) => {
  const exists = await DisposalModel.findOne({ code: payload.code }).lean();
  if (exists) {
    throw conflict('Disposal code already exists');
  }
  if (!payload.items.length) {
    throw badRequest('Disposal items required');
  }
  const totalValue = payload.totalValue ?? computeTotalValue(payload.items);
  const boardRequired = payload.boardRequired ?? totalValue > env.highValueDisposalThreshold;
  const disposal = await DisposalModel.create({
    code: payload.code,
    reason: payload.reason,
    totalValue,
    boardRequired,
    boardMembers: payload.boardMembers ?? [],
    minutesFileUrl: payload.minutesFileUrl,
    items: payload.items.map((item) => {
      const entry = {
        productId: new Types.ObjectId(item.productId),
        locationId: new Types.ObjectId(item.locationId),
        qty: item.qty
      };
      return item.value != null ? { ...entry, value: item.value } : entry;
    })
  });
  await recordAudit({
    action: 'disposal.created',
    entity: 'Disposal',
    entityId: disposal._id,
    actorId,
    payload: { code: disposal.code }
  });
  return disposal.toObject();
};

export const updateDisposal = async (
  id: string,
  payload: Partial<{
    boardMembers: string[];
    minutesFileUrl: string;
    items: { productId: string; locationId: string; qty: number; value?: number }[];
    totalValue: number;
    boardRequired: boolean;
  }>,
  actorId: string
) => {
  const disposal = await DisposalModel.findById(new Types.ObjectId(id));
  if (!disposal) {
    throw notFound('Disposal not found');
  }
  if (disposal.status !== 'draft') {
    throw badRequest('Only draft disposals can be updated');
  }
  if (payload.boardMembers) disposal.boardMembers = payload.boardMembers;
  if (typeof payload.minutesFileUrl === 'string') disposal.minutesFileUrl = payload.minutesFileUrl;
  if (payload.items) {
    disposal.items = payload.items.map((item) => {
      const entry = {
        productId: new Types.ObjectId(item.productId),
        locationId: new Types.ObjectId(item.locationId),
        qty: item.qty
      };
      return item.value != null ? { ...entry, value: item.value } : entry;
    });
    disposal.totalValue = payload.totalValue ?? computeTotalValue(payload.items);
    disposal.boardRequired =
      typeof payload.boardRequired === 'boolean'
        ? payload.boardRequired
        : disposal.totalValue > env.highValueDisposalThreshold;
  }
  await disposal.save();
  await recordAudit({
    action: 'disposal.updated',
    entity: 'Disposal',
    entityId: disposal._id,
    actorId,
    payload
  });
  return disposal.toObject();
};

const ensureTransition = (current: DisposalStatus, target: DisposalStatus) => {
  const allowed = allowedTransitions[current] ?? [];
  if (!allowed.includes(target)) {
    throw badRequest(`Transition from ${current} to ${target} is not allowed`);
  }
};

export const transitionDisposal = async (
  id: string,
  target: DisposalStatus,
  actorId: string
) => {
  const disposal = await DisposalModel.findById(new Types.ObjectId(id));
  if (!disposal) {
    throw notFound('Disposal not found');
  }
  ensureTransition(disposal.status as DisposalStatus, target);

  if (target === 'approved' && disposal.boardRequired) {
    if (!disposal.boardMembers?.length || !disposal.minutesFileUrl) {
      throw badRequest('Board approval requires members and minutes file');
    }
  }

  if (target === 'completed') {
    for (const item of disposal.items) {
      await adjustInventory(item.productId.toString(), item.locationId.toString(), -item.qty);
    }
  }

  disposal.status = target;
  await disposal.save();
  await recordAudit({
    action: `disposal.${target}`,
    entity: 'Disposal',
    entityId: disposal._id,
    actorId,
    payload: { status: target }
  });
  return disposal.toObject();
};

export const deleteDisposal = async (id: string, actorId: string) => {
  const disposal = await DisposalModel.findById(new Types.ObjectId(id));
  if (!disposal) {
    throw notFound('Disposal not found');
  }
  if (disposal.status !== 'draft') {
    throw badRequest('Only draft disposals can be deleted');
  }
  await DisposalModel.deleteOne({ _id: disposal._id });
  await recordAudit({
    action: 'disposal.deleted',
    entity: 'Disposal',
    entityId: disposal._id,
    actorId,
    payload: { code: disposal.code }
  });
  return true;
};
