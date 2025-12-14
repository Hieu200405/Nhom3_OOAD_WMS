import { Schema, model, type Document, type Model, Types } from 'mongoose';

export interface Inventory {
  productId: Types.ObjectId;
  locationId: Types.ObjectId;
  quantity: number;
  batch?: string | null;
  expDate?: Date | null;
  updatedAt: Date;
  createdAt: Date;
}

export interface InventoryDocument extends Inventory, Document {}

const inventorySchema = new Schema<InventoryDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'WarehouseNode', required: true },
    quantity: { type: Number, required: true, min: 0 },
    batch: { type: String, trim: true },
    expDate: { type: Date }
  },
  { timestamps: true }
);

inventorySchema.index({ productId: 1, locationId: 1, batch: 1 }, { unique: true, sparse: true });

export const InventoryModel: Model<InventoryDocument> = model<InventoryDocument>(
  'Inventory',
  inventorySchema
);
