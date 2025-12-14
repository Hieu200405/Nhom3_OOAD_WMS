import { Schema, model, type Document, type Model, Types } from 'mongoose';
import { RETURN_STATUS, RETURN_FROM, type ReturnStatus, type ReturnFrom } from '@wms/shared';

export interface ReturnItem {
  productId: Types.ObjectId;
  qty: number;
  reason: string;
  expDate?: Date | null;
}

export interface Return {
  code: string;
  from: ReturnFrom;
  refId?: Types.ObjectId | null;
  disposalId?: Types.ObjectId | null;
  items: ReturnItem[];
  status: ReturnStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnDocument extends Return, Document {}

const returnItemSchema = new Schema<ReturnItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    expDate: { type: Date }
  },
  { _id: false }
);

const returnSchema = new Schema<ReturnDocument>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    from: { type: String, enum: RETURN_FROM, required: true },
    refId: { type: Schema.Types.ObjectId },
    disposalId: { type: Schema.Types.ObjectId, ref: 'Disposal' },
    items: { type: [returnItemSchema], default: [] },
    status: { type: String, enum: RETURN_STATUS, required: true, default: 'draft' }
  },
  { timestamps: true }
);

returnSchema.index({ code: 1 }, { unique: true });

export const ReturnModel: Model<ReturnDocument> = model<ReturnDocument>('Return', returnSchema);
