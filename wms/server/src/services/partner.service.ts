import { Types } from 'mongoose';
import { PartnerModel } from '../models/partner.model.js';
import { buildPagedResponse, parsePagination } from '../utils/pagination.js';
import { conflict, notFound } from '../utils/errors.js';
import { recordAudit } from './audit.service.js';
import type { PartnerType } from '@wms/shared';

interface ListQuery {
  page?: string;
  limit?: string;
  sort?: string;
  query?: string;
  type?: PartnerType;
}

export const listPartners = async (query: ListQuery) => {
  const { page, limit, sort, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.type) {
    filter.type = query.type;
  }
  if (query.query) {
    filter.$or = [
      { name: new RegExp(query.query, 'i') },
      { contact: new RegExp(query.query, 'i') }
    ];
  }
  const [total, items] = await Promise.all([
    PartnerModel.countDocuments(filter),
    PartnerModel.find(filter).sort(sort).skip(skip).limit(limit).lean()
  ]);
  return buildPagedResponse(
    items.map((item) => ({
      id: item._id.toString(),
      type: item.type,
      name: item.name,
      contact: item.contact,
      address: item.address,
      notes: item.notes
    })),
    total,
    { page, limit, sort, skip }
  );
};

export const createPartner = async (
  payload: { type: PartnerType; name: string; contact?: string; address?: string; notes?: string },
  actorId: string
) => {
  const exist = await PartnerModel.findOne({ type: payload.type, name: payload.name }).lean();
  if (exist) {
    throw conflict('Partner already exists');
  }
  const partner = await PartnerModel.create(payload);
  await recordAudit({
    action: 'partner.created',
    entity: 'Partner',
    entityId: partner._id,
    actorId,
    payload
  });
  return partner.toObject();
};

export const updatePartner = async (
  id: string,
  payload: { name?: string; contact?: string; address?: string; notes?: string },
  actorId: string
) => {
  const partner = await PartnerModel.findById(new Types.ObjectId(id));
  if (!partner) {
    throw notFound('Partner not found');
  }
  if (payload.name && payload.name !== partner.name) {
    const duplicate = await PartnerModel.findOne({ type: partner.type, name: payload.name }).lean();
    if (duplicate) {
      throw conflict('Partner already exists');
    }
    partner.name = payload.name;
  }
  if (typeof payload.contact !== 'undefined') partner.contact = payload.contact;
  if (typeof payload.address !== 'undefined') partner.address = payload.address;
  if (typeof payload.notes !== 'undefined') partner.notes = payload.notes;
  await partner.save();
  await recordAudit({
    action: 'partner.updated',
    entity: 'Partner',
    entityId: partner._id,
    actorId,
    payload
  });
  return partner.toObject();
};

export const deletePartner = async (id: string, actorId: string) => {
  const partner = await PartnerModel.findByIdAndDelete(new Types.ObjectId(id));
  if (!partner) {
    throw notFound('Partner not found');
  }
  await recordAudit({
    action: 'partner.deleted',
    entity: 'Partner',
    entityId: partner._id,
    actorId,
    payload: { name: partner.name }
  });
  return true;
};
