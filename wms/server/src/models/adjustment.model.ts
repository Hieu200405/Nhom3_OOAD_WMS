import { Schema, model, type Document, type Model, Types } from 'mongoose';
import { ADJUSTMENT_REASONS, type AdjustmentReason } from '@wms/shared';

export interface AdjustmentLine {
  productId: Types.ObjectId;
  locationId: Types.ObjectId;
  delta: number;
}

export interface Adjustment {
  code: string;
  reason: AdjustmentReason;
  lines: AdjustmentLine[];
  approvedBy?: Types.ObjectId | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdjustmentDocument extends Adjustment, Document {}

const adjustmentLineSchema = new Schema<AdjustmentLine>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'WarehouseNode', required: true },
    delta: { type: Number, required: true }
  },
  { _id: false }
);

const adjustmentSchema = new Schema<AdjustmentDocument>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    reason: { type: String, enum: ADJUSTMENT_REASONS, required: true },
    lines: { type: [adjustmentLineSchema], default: [] },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date }
  },
  { timestamps: true }
);

adjustmentSchema.index({ code: 1 }, { unique: true });

export const AdjustmentModel: Model<AdjustmentDocument> = model<AdjustmentDocument>(
  'Adjustment',
  adjustmentSchema
);
