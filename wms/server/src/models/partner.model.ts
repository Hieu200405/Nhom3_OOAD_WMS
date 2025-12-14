import { Schema, model, type Document, type Model } from 'mongoose';
import { PARTNER_TYPES, type PartnerType } from '@wms/shared';

export interface Partner {
  type: PartnerType;
  name: string;
  contact?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerDocument extends Partner, Document {}

const partnerSchema = new Schema<PartnerDocument>(
  {
    type: { type: String, enum: PARTNER_TYPES, required: true },
    name: { type: String, required: true, trim: true },
    contact: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

partnerSchema.index({ type: 1, name: 1 }, { unique: true });

export const PartnerModel: Model<PartnerDocument> = model<PartnerDocument>('Partner', partnerSchema);
