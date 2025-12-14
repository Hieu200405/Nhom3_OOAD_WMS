import { Schema, model, type Document, type Model, Types } from 'mongoose';
import { STOCKTAKE_STATUS, type StocktakeStatus } from '@wms/shared';

export interface StocktakeItem {
  productId: Types.ObjectId;
  locationId: Types.ObjectId;
  systemQty: number;
  countedQty: number;
}

export interface Stocktake {
  code: string;
  date: Date;
  status: StocktakeStatus;
  items: StocktakeItem[];
  adjustmentId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StocktakeDocument extends Stocktake, Document {}

const stocktakeItemSchema = new Schema<StocktakeItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'WarehouseNode', required: true },
    systemQty: { type: Number, required: true, min: 0 },
    countedQty: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const stocktakeSchema = new Schema<StocktakeDocument>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    date: { type: Date, required: true },
    status: { type: String, enum: STOCKTAKE_STATUS, required: true, default: 'draft' },
    items: { type: [stocktakeItemSchema], default: [] },
    adjustmentId: { type: Schema.Types.ObjectId, ref: 'Adjustment' }
  },
  { timestamps: true }
);

stocktakeSchema.index({ code: 1 }, { unique: true });

export const StocktakeModel: Model<StocktakeDocument> = model<StocktakeDocument>(
  'Stocktake',
  stocktakeSchema
);
