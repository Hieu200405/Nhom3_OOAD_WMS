import { Types } from 'mongoose';
import { CategoryModel } from '../models/category.model.js';
import { buildPagedResponse, parsePagination } from '../utils/pagination.js';
import { conflict, notFound } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';

interface ListQuery {
  page?: string;
  limit?: string;
  sort?: string;
  query?: string;
}

export const listCategories = async (query: ListQuery) => {
  const { page, limit, sort, skip } = parsePagination(query);
  const filter = query.query
    ? {
        name: new RegExp(query.query, 'i')
      }
    : {};
  const [total, items] = await Promise.all([
    CategoryModel.countDocuments(filter),
    CategoryModel.find(filter).sort(sort).skip(skip).limit(limit).lean()
  ]);
  return buildPagedResponse(
    items.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      description: item.description,
      createdAt: item.createdAt
    })),
    total,
    { page, limit, sort, skip }
  );
};

export const createCategory = async (
  payload: { name: string; description?: string },
  actorId: string
) => {
  const existing = await CategoryModel.findOne({ name: payload.name }).lean();
  if (existing) {
    throw conflict('Category name already exists');
  }
  const category = await CategoryModel.create(payload);
  await recordAudit({
    action: 'category.created',
    entity: 'Category',
    entityId: category._id,
    actorId,
    payload
  });
  return category.toObject();
};

export const updateCategory = async (
  id: string,
  payload: { name?: string; description?: string },
  actorId: string
) => {
  const category = await CategoryModel.findById(new Types.ObjectId(id));
  if (!category) {
    throw notFound('Category not found');
  }
  if (payload.name && payload.name !== category.name) {
    const duplicate = await CategoryModel.findOne({ name: payload.name }).lean();
    if (duplicate) {
      throw conflict('Category name already exists');
    }
    category.name = payload.name;
  }
  if (typeof payload.description !== 'undefined') {
    category.description = payload.description;
  }
  await category.save();
  await recordAudit({
    action: 'category.updated',
    entity: 'Category',
    entityId: category._id,
    actorId,
    payload
  });
  return category.toObject();
};

export const deleteCategory = async (id: string, actorId: string) => {
  const category = await CategoryModel.findByIdAndDelete(new Types.ObjectId(id));
  if (!category) {
    throw notFound('Category not found');
  }
  await recordAudit({
    action: 'category.deleted',
    entity: 'Category',
    entityId: category._id,
    actorId,
    payload: { name: category.name }
  });
  return true;
};
