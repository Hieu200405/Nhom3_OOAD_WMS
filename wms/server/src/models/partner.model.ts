import { Schema, model, type Document, type Model } from 'mongoose';
import { PARTNER_TYPES, type PartnerType } from '@wms/shared';

export interface Partner {
  type: PartnerType;
  code: string;
  name: string;
  taxCode?: string;
  contact?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  // Specific fields
  businessType?: 'Manufacturer' | 'Distributor' | 'Retailer';
  customerType?: 'Individual' | 'Corporate';
  creditLimit?: number;
  paymentTerm?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerDocument extends Partner, Document { }

const partnerSchema = new Schema<PartnerDocument>(
  {
    type: { type: String, enum: PARTNER_TYPES, required: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    taxCode: { type: String, trim: true },
    contact: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    // Discrimination fields
    businessType: { type: String, enum: ['Manufacturer', 'Distributor', 'Retailer'] },
    customerType: { type: String, enum: ['Individual', 'Corporate'] },
    creditLimit: { type: Number, min: 0 },
    paymentTerm: { type: String }
  },
  { timestamps: true }
);

partnerSchema.index({ code: 1, type: 1 }, { unique: true });
partnerSchema.index({ name: 'text', code: 'text' });

export const PartnerModel: Model<PartnerDocument> = model<PartnerDocument>('Partner', partnerSchema);
