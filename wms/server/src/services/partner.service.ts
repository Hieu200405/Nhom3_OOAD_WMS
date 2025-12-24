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
      { contact: new RegExp(query.query, 'i') },
      { code: new RegExp(query.query, 'i') }
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
      code: item.code,
      name: item.name,
      taxCode: item.taxCode,
      contact: item.contact,
      address: item.address,
      notes: item.notes,
      isActive: item.isActive,
      businessType: item.businessType,
      customerType: item.customerType,
      creditLimit: item.creditLimit,
      paymentTerm: item.paymentTerm
    })),
    total,
    { page, limit, sort, skip }
  );
};

export const createPartner = async (
  payload: {
    type: PartnerType;
    code: string;
    name: string;
    taxCode?: string;
    contact?: string;
    address?: string;
    notes?: string;
    isActive?: boolean;
    businessType?: string;
    customerType?: string;
    creditLimit?: number;
    paymentTerm?: string;
  },
  actorId: string
) => {
  const exist = await PartnerModel.findOne({
    $or: [
      { code: payload.code.toUpperCase(), type: payload.type },
      { name: payload.name, type: payload.type } // Name unique per type
    ]
  }).lean();

  if (exist) {
    throw conflict('Partner code or name already exists for this type');
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
  payload: {
    code?: string;
    name?: string;
    taxCode?: string;
    contact?: string;
    address?: string;
    notes?: string;
    isActive?: boolean;
    businessType?: string;
    customerType?: string;
    creditLimit?: number;
    paymentTerm?: string;
  },
  actorId: string
) => {
  const partner = await PartnerModel.findById(new Types.ObjectId(id));
  if (!partner) {
    throw notFound('Partner not found');
  }

  if (payload.code && payload.code !== partner.code) {
    const duplicate = await PartnerModel.findOne({ code: payload.code.toUpperCase(), type: partner.type }).lean();
    if (duplicate) throw conflict('Partner code already exists');
    partner.code = payload.code;
  }

  if (payload.name && payload.name !== partner.name) {
    const duplicate = await PartnerModel.findOne({ type: partner.type, name: payload.name }).lean();
    if (duplicate) {
      throw conflict('Partner name already exists');
    }
    partner.name = payload.name;
  }

  if (typeof payload.contact !== 'undefined') partner.contact = payload.contact;
  if (typeof payload.address !== 'undefined') partner.address = payload.address;
  if (typeof payload.notes !== 'undefined') partner.notes = payload.notes;
  if (typeof payload.taxCode !== 'undefined') partner.taxCode = payload.taxCode;
  if (typeof payload.isActive !== 'undefined') partner.isActive = payload.isActive;

  // Specific fields
  if (partner.type === 'supplier') {
    if (payload.businessType) partner.businessType = payload.businessType as any;
  } else if (partner.type === 'customer') {
    if (payload.customerType) partner.customerType = payload.customerType as any;
    if (typeof payload.creditLimit === 'number') partner.creditLimit = payload.creditLimit;
    if (payload.paymentTerm) partner.paymentTerm = payload.paymentTerm;
  }

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
