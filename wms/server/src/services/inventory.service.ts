import { Types } from 'mongoose';
import { InventoryModel } from '../models/inventory.model.js';
import { buildPagedResponse, parsePagination } from '../utils/pagination.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { WarehouseNodeModel } from '../models/warehouseNode.model.js';

interface InventoryQuery {
  page?: string;
  limit?: string;
  sort?: string;
  productId?: string;
  locationId?: string;
}

export const listInventory = async (query: InventoryQuery) => {
  const { page, limit, sort, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.productId) filter.productId = new Types.ObjectId(query.productId);
  if (query.locationId) filter.locationId = new Types.ObjectId(query.locationId);

  const [total, items] = await Promise.all([
    InventoryModel.countDocuments(filter),
    InventoryModel.find(filter).sort(sort).skip(skip).limit(limit).lean()
  ]);

  const data = items.map((item) => ({
    id: item._id.toString(),
    productId: item.productId.toString(),
    locationId: item.locationId.toString(),
    quantity: item.quantity,
    batch: item.batch ?? null,
    expDate: item.expDate?.toISOString() ?? null,
    updatedAt: item.updatedAt
  }));

  return buildPagedResponse(data, total, { page, limit, sort, skip });
};

const ensureLocationExists = async (locationId: string | Types.ObjectId) => {
  const exists = await WarehouseNodeModel.exists({
    _id: new Types.ObjectId(locationId),
    type: 'bin'
  });
  if (!exists) {
    throw notFound('Location not found');
  }
};

export const adjustInventory = async (
  productId: string | Types.ObjectId,
  locationId: string | Types.ObjectId,
  delta: number,
  options?: { batch?: string | null; expDate?: Date | null; allowNegative?: boolean }
) => {
  if (!delta) return null;
  await ensureLocationExists(locationId);
  const filter: Record<string, unknown> = {
    productId: new Types.ObjectId(productId),
    locationId: new Types.ObjectId(locationId)
  };
  if (options?.batch) {
    filter.batch = options.batch;
  }
  let doc = await InventoryModel.findOne(filter);
  if (!doc) {
    if (delta < 0 && !options?.allowNegative) {
      throw conflict('Insufficient stock');
    }
    doc = new InventoryModel({
      ...filter,
      batch: options?.batch ?? null,
      expDate: options?.expDate ?? null,
      quantity: 0
    });
  }
  const nextQty = doc.quantity + delta;
  if (nextQty < 0 && !options?.allowNegative) {
    throw conflict('Insufficient stock');
  }
  doc.quantity = Math.max(nextQty, 0);
  if (options?.expDate) doc.expDate = options.expDate;
  await doc.save();
  return doc;
};

export const moveInventory = async (
  payload: { productId: string; fromLocation: string; toLocation: string; qty: number }
) => {
  if (payload.qty <= 0) {
    throw badRequest('Quantity must be greater than zero');
  }
  await adjustInventory(payload.productId, payload.fromLocation, -payload.qty);
  await adjustInventory(payload.productId, payload.toLocation, payload.qty);
  return true;
};

export const ensureStock = async (
  items: { productId: string; locationId: string; qty: number }[]
) => {
  for (const item of items) {
    const stock = await InventoryModel.findOne({
      productId: new Types.ObjectId(item.productId),
      locationId: new Types.ObjectId(item.locationId)
    }).lean();
    if (!stock || stock.quantity < item.qty) {
      throw conflict('Insufficient stock', {
        productId: item.productId,
        locationId: item.locationId,
        required: item.qty,
        available: stock?.quantity ?? 0
      });
    }
  }
};
