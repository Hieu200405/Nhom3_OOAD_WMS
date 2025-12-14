import { Schema, model, type Document, type Model, Types } from 'mongoose';
import { WAREHOUSE_NODE_TYPES, type WarehouseNodeType } from '@wms/shared';

export interface WarehouseNode {
  type: WarehouseNodeType;
  name: string;
  code: string;
  parentId?: Types.ObjectId | null;
  barcode?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseNodeDocument extends WarehouseNode, Document {}

const warehouseNodeSchema = new Schema<WarehouseNodeDocument>(
  {
    type: { type: String, enum: WAREHOUSE_NODE_TYPES, required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'WarehouseNode', default: null },
    barcode: { type: String, trim: true }
  },
  { timestamps: true }
);

warehouseNodeSchema.index({ code: 1 }, { unique: true });
warehouseNodeSchema.index({ parentId: 1 });

export const WarehouseNodeModel: Model<WarehouseNodeDocument> = model<WarehouseNodeDocument>(
  'WarehouseNode',
  warehouseNodeSchema
);
