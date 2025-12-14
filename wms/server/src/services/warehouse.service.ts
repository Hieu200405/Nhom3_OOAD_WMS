import { Types } from 'mongoose';
import { WarehouseNodeModel, type WarehouseNodeDocument } from '../models/warehouseNode.model.js';
import { buildPagedResponse, parsePagination } from '../utils/pagination.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';
import { WAREHOUSE_NODE_TYPES, type WarehouseNodeType } from '@wms/shared';

const typeRank = new Map<WarehouseNodeType, number>(
  WAREHOUSE_NODE_TYPES.map((type, index) => [type, index])
);

const validateParentChain = async (
  type: WarehouseNodeType,
  parentId?: string | null
): Promise<WarehouseNodeDocument | null> => {
  if (!parentId) {
    if (type !== 'warehouse') {
      throw badRequest('Only warehouses can exist without parent');
    }
    return null;
  }
  const parent = await WarehouseNodeModel.findById(new Types.ObjectId(parentId)).exec();
  if (!parent) {
    throw notFound('Parent node not found');
  }
  const parentRank = typeRank.get(parent.type as WarehouseNodeType) ?? 0;
  const currentRank = typeRank.get(type) ?? 0;
  if (currentRank <= parentRank) {
    throw badRequest('Invalid parent hierarchy');
  }
  return parent;
};

type ListQuery = {
  page?: string;
  limit?: string;
  sort?: string;
  query?: string;
  type?: WarehouseNodeType;
  parentId?: string;
};

export const listWarehouseNodes = async (query: ListQuery) => {
  const { page, limit, sort, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.type) filter.type = query.type;
  if (query.parentId) filter.parentId = new Types.ObjectId(query.parentId);
  if (query.query) filter.name = new RegExp(query.query, 'i');

  const [total, nodes] = await Promise.all([
    WarehouseNodeModel.countDocuments(filter),
    WarehouseNodeModel.find(filter).sort(sort).skip(skip).limit(limit).lean()
  ]);

  return buildPagedResponse(
    nodes.map((node) => ({
      id: node._id.toString(),
      type: node.type,
      name: node.name,
      code: node.code,
      parentId: node.parentId?.toString() ?? null,
      barcode: node.barcode
    })),
    total,
    { page, limit, sort, skip }
  );
};

export const getWarehouseTree = async () => {
  const nodes = await WarehouseNodeModel.find().lean();
  const map = new Map<string, any>();
  nodes.forEach((node) => {
    map.set(node._id.toString(), {
      id: node._id.toString(),
      type: node.type,
      name: node.name,
      code: node.code,
      barcode: node.barcode,
      parentId: node.parentId?.toString() ?? null,
      children: [] as any[]
    });
  });
  const roots: any[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
};

export const createWarehouseNode = async (
  payload: { type: WarehouseNodeType; name: string; code: string; parentId?: string; barcode?: string },
  actorId: string
) => {
  const existing = await WarehouseNodeModel.findOne({ code: payload.code }).lean();
  if (existing) {
    throw conflict('Warehouse code already exists');
  }
  const parent = await validateParentChain(payload.type, payload.parentId);
  const node = await WarehouseNodeModel.create({
    ...payload,
    parentId: parent ? (parent._id as Types.ObjectId) : null
  });
  await recordAudit({
    action: 'warehouse.created',
    entity: 'WarehouseNode',
    entityId: node._id,
    actorId,
    payload
  });
  return node.toObject();
};

export const updateWarehouseNode = async (
  id: string,
  payload: Partial<{ name: string; barcode: string; parentId: string | null }>,
  actorId: string
) => {
  const node = await WarehouseNodeModel.findById(new Types.ObjectId(id));
  if (!node) {
    throw notFound('Warehouse node not found');
  }
  if (payload.parentId !== undefined) {
    const parent = await validateParentChain(node.type as WarehouseNodeType, payload.parentId);
    node.parentId = parent ? (parent._id as Types.ObjectId) : null;
  }
  if (payload.name) node.name = payload.name;
  if (typeof payload.barcode !== 'undefined') node.barcode = payload.barcode;
  await node.save();
  await recordAudit({
    action: 'warehouse.updated',
    entity: 'WarehouseNode',
    entityId: node._id,
    actorId,
    payload
  });
  return node.toObject();
};

export const deleteWarehouseNode = async (id: string, actorId: string) => {
  const hasChildren = await WarehouseNodeModel.exists({ parentId: new Types.ObjectId(id) });
  if (hasChildren) {
    throw badRequest('Cannot delete node with children');
  }
  const node = await WarehouseNodeModel.findByIdAndDelete(new Types.ObjectId(id));
  if (!node) {
    throw notFound('Warehouse node not found');
  }
  await recordAudit({
    action: 'warehouse.deleted',
    entity: 'WarehouseNode',
    entityId: node._id,
    actorId,
    payload: { code: node.code }
  });
  return true;
};

export const resolveDefaultBin = async () => {
  const node = await WarehouseNodeModel.findOne({ type: 'bin' }).sort({ createdAt: 1 }).lean();
  if (!node) {
    throw notFound('Default bin not configured');
  }
  return node._id.toString();
};
