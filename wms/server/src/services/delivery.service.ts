import { Types } from 'mongoose';
import { DeliveryModel } from '../models/delivery.model.js';
import { PartnerModel } from '../models/partner.model.js';
import { ProductModel } from '../models/product.model.js';
import { buildPagedResponse, parsePagination } from '../utils/pagination.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';
import { adjustInventory, ensureStock } from './inventory.service.js';
import type { DeliveryStatus } from '@wms/shared';

const allowedTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  draft: ['approved'],
  approved: ['prepared'],
  prepared: ['delivered'],
  delivered: ['completed'],
  completed: []
};

type ListQuery = {
  page?: string;
  limit?: string;
  sort?: string;
  status?: DeliveryStatus;
  customerId?: string;
  query?: string;
};

export const listDeliveries = async (query: ListQuery) => {
  const { page, limit, sort, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.customerId) filter.customerId = new Types.ObjectId(query.customerId);
  if (query.query) filter.code = new RegExp(query.query, 'i');

  const [total, items] = await Promise.all([
    DeliveryModel.countDocuments(filter),
    DeliveryModel.find(filter)
      .populate('customerId', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  return buildPagedResponse(
    items.map((item) => ({
      id: item._id.toString(),
      code: item.code,
      customer: item.customerId,
      date: item.date,
      status: item.status,
      lines: item.lines,
      notes: item.notes
    })),
    total,
    { page, limit, sort, skip }
  );
};

export const createDelivery = async (
  payload: {
    code: string;
    customerId: string;
    date: Date;
    lines: { productId: string; qty: number; priceOut: number; locationId: string }[];
    notes?: string;
  },
  actorId: string
) => {
  const customer = await PartnerModel.findOne({
    _id: new Types.ObjectId(payload.customerId),
    type: 'customer'
  }).lean();
  if (!customer) {
    throw badRequest('Customer not found');
  }
  const existing = await DeliveryModel.findOne({ code: payload.code }).lean();
  if (existing) {
    throw conflict('Delivery code already exists');
  }
  for (const line of payload.lines) {
    const product = await ProductModel.findById(new Types.ObjectId(line.productId)).lean();
    if (!product) {
      throw notFound('Product not found');
    }
    if (!line.locationId) {
      throw badRequest('Location is required for delivery lines');
    }
    if (line.qty <= 0) {
      throw badRequest('Quantity must be positive');
    }
  }
  const delivery = await DeliveryModel.create({
    ...payload,
    customerId: customer._id
  });
  await recordAudit({
    action: 'delivery.created',
    entity: 'Delivery',
    entityId: delivery._id,
    actorId,
    payload: {
      code: delivery.code,
      status: delivery.status
    }
  });
  return delivery.toObject();
};

export const updateDelivery = async (
  id: string,
  payload: Partial<{
    date: Date;
    lines: { productId: string; qty: number; priceOut: number; locationId: string }[];
    notes?: string;
  }>,
  actorId: string
) => {
  const delivery = await DeliveryModel.findById(new Types.ObjectId(id));
  if (!delivery) {
    throw notFound('Delivery not found');
  }
  if (delivery.status !== 'draft') {
    throw badRequest('Only draft deliveries can be updated');
  }
  if (payload.date) delivery.date = payload.date;
  if (payload.notes !== undefined) delivery.notes = payload.notes;
  if (payload.lines) {
    for (const line of payload.lines) {
      if (line.qty <= 0) {
        throw badRequest('Quantity must be positive');
      }
      if (!line.locationId) {
        throw badRequest('Location is required for delivery lines');
      }
      const product = await ProductModel.findById(new Types.ObjectId(line.productId)).lean();
      if (!product) {
        throw notFound('Product not found');
      }
    }
    delivery.lines = payload.lines.map((line) => ({
      productId: new Types.ObjectId(line.productId),
      qty: line.qty,
      priceOut: line.priceOut,
      locationId: new Types.ObjectId(line.locationId)
    }));
  }
  await delivery.save();
  await recordAudit({
    action: 'delivery.updated',
    entity: 'Delivery',
    entityId: delivery._id,
    actorId,
    payload
  });
  return delivery.toObject();
};

const ensureTransition = (current: DeliveryStatus, target: DeliveryStatus) => {
  const allowed = allowedTransitions[current] ?? [];
  if (!allowed.includes(target)) {
    throw badRequest(`Transition from ${current} to ${target} is not allowed`);
  }
};

export const transitionDelivery = async (
  id: string,
  target: DeliveryStatus,
  actorId: string
) => {
  const delivery = await DeliveryModel.findById(new Types.ObjectId(id));
  if (!delivery) {
    throw notFound('Delivery not found');
  }
  ensureTransition(delivery.status, target);

  if (['approved', 'prepared'].includes(target)) {
    for (const line of delivery.lines) {
      if (!line.locationId) {
        throw badRequest('Location is required to progress delivery');
      }
    }
    await ensureStock(
      delivery.lines.map((line) => ({
        productId: line.productId.toString(),
        locationId: line.locationId!.toString(),
        qty: line.qty
      }))
    );
  }

  if (target === 'completed') {
    for (const line of delivery.lines) {
      if (!line.locationId) {
        throw badRequest('Location is required to complete delivery');
      }
      await adjustInventory(line.productId.toString(), line.locationId.toString(), -line.qty);
    }
  }

  delivery.status = target;
  await delivery.save();
  await recordAudit({
    action: `delivery.${target}`,
    entity: 'Delivery',
    entityId: delivery._id,
    actorId,
    payload: { status: target }
  });
  return delivery.toObject();
};

export const deleteDelivery = async (id: string, actorId: string) => {
  const delivery = await DeliveryModel.findById(new Types.ObjectId(id));
  if (!delivery) {
    throw notFound('Delivery not found');
  }
  if (delivery.status !== 'draft') {
    throw badRequest('Only draft deliveries can be deleted');
  }
  await DeliveryModel.deleteOne({ _id: delivery._id });
  await recordAudit({
    action: 'delivery.deleted',
    entity: 'Delivery',
    entityId: delivery._id,
    actorId,
    payload: { code: delivery.code }
  });
  return true;
};
