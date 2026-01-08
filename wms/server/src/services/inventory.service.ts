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
    status: (item as any).status ?? 'available',
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
  options?: { batch?: string | null; expDate?: Date | null; allowNegative?: boolean; status?: 'available' | 'reserved' | 'pending' | 'special' }
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
      status: options?.status ?? 'available',
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

  // Check for low stock and send notifications
  await checkLowStock(productId.toString());

  return doc;
};

/**
 * Check if product stock is below minimum and send notifications
 */
export const checkLowStock = async (productId: string) => {
  try {
    const { ProductModel } = await import('../models/product.model.js');
    const product = await ProductModel.findById(new Types.ObjectId(productId));
    if (!product || !product.minStock) return;

    // Calculate total stock across all locations
    const totalQty = await InventoryModel.aggregate([
      { $match: { productId: new Types.ObjectId(productId) } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);

    const currentStock = totalQty[0]?.total || 0;

    if (currentStock < product.minStock) {
      // Send notification to all managers and admins
      const { UserModel } = await import('../models/user.model.js');
      const managers = await UserModel.find({
        role: { $in: ['Admin', 'Manager'] }
      });

      const { createNotification } = await import('./notification.service.js');
      for (const manager of managers) {
        await createNotification({
          userId: (manager as any)._id.toString(),
          type: 'warning',
          title: 'Cảnh báo tồn kho thấp',
          message: `Sản phẩm ${product.name} (${product.sku}) còn ${currentStock}/${product.minStock}. Cần nhập thêm hàng.`
        });
      }
    }
  } catch (e) {
    console.warn('Failed to check low stock:', e);
  }
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

/**
 * Get expired inventory items
 */
export const getExpiredInventory = async () => {
  const now = new Date();

  const expiredItems = await InventoryModel.find({
    expDate: { $lt: now },
    quantity: { $gt: 0 }
  })
    .populate('productId', 'sku name')
    .populate('locationId', 'name code')
    .lean();

  return expiredItems.map(item => ({
    id: item._id.toString(),
    product: item.productId,
    location: item.locationId,
    batch: item.batch,
    expDate: item.expDate,
    quantity: item.quantity,
    daysExpired: Math.floor((now.getTime() - (item.expDate?.getTime() || 0)) / (1000 * 60 * 60 * 24))
  }));
};

/**
 * Get soon-to-expire inventory (within X days)
 */
export const getSoonToExpireInventory = async (daysThreshold = 30) => {
  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  const soonToExpire = await InventoryModel.find({
    expDate: {
      $gte: now,
      $lte: thresholdDate
    },
    quantity: { $gt: 0 }
  })
    .populate('productId', 'sku name')
    .populate('locationId', 'name code')
    .lean();

  return soonToExpire.map(item => ({
    id: item._id.toString(),
    product: item.productId,
    location: item.locationId,
    batch: item.batch,
    expDate: item.expDate,
    quantity: item.quantity,
    daysUntilExpiry: Math.floor(((item.expDate?.getTime() || 0) - now.getTime()) / (1000 * 60 * 60 * 24))
  }));
};

/**
 * Send expiry alerts to managers
 */
export const sendExpiryAlerts = async () => {
  const expired = await getExpiredInventory();
  const soonToExpire = await getSoonToExpireInventory(7);

  if (expired.length === 0 && soonToExpire.length === 0) {
    return { sent: 0, message: 'No expiry alerts needed' };
  }

  const { UserModel } = await import('../models/user.model.js');
  const managers = await UserModel.find({
    role: { $in: ['Admin', 'Manager'] }
  });

  const { createNotification } = await import('./notification.service.js');
  let sentCount = 0;

  for (const manager of managers) {
    if (expired.length > 0) {
      await createNotification({
        userId: (manager as any)._id.toString(),
        type: 'error',
        title: 'Hàng hóa đã hết hạn',
        message: `Có ${expired.length} sản phẩm đã hết hạn. Cần xử lý ngay!`
      });
      sentCount++;
    }

    if (soonToExpire.length > 0) {
      await createNotification({
        userId: (manager as any)._id.toString(),
        type: 'warning',
        title: 'Cảnh báo sắp hết hạn',
        message: `Có ${soonToExpire.length} sản phẩm sắp hết hạn trong 7 ngày.`
      });
      sentCount++;
    }
  }

  return {
    sent: sentCount,
    expired: expired.length,
    soonToExpire: soonToExpire.length
  };
};

export const exportInventoryExcel = async (query: InventoryQuery) => {
  const filter: Record<string, unknown> = {};
  if (query.productId) filter.productId = new Types.ObjectId(query.productId);
  if (query.locationId) filter.locationId = new Types.ObjectId(query.locationId);

  const items = await InventoryModel.find(filter)
    .populate('productId', 'sku name')
    .populate('locationId', 'name code')
    .lean();

  return items.map((item: any) => ({
    sku: item.productId?.sku || 'N/A',
    name: item.productId?.name || 'N/A',
    location: item.locationId?.code || 'N/A',
    quantity: item.quantity,
    status: item.status,
    batch: item.batch || '',
    expDate: item.expDate ? new Date(item.expDate).toLocaleDateString('vi-VN') : ''
  }));
};
