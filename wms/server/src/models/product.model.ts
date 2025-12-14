import { Schema, model, type Document, type Model, Types } from 'mongoose';

export interface Product {
  sku: string;
  name: string;
  categoryId: Types.ObjectId;
  unit: string;
  priceIn: number;
  priceOut: number;
  minStock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDocument extends Product, Document {}

const productSchema = new Schema<ProductDocument>(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    unit: { type: String, required: true, trim: true },
    priceIn: { type: Number, required: true, min: 0 },
    priceOut: { type: Number, required: true, min: 0 },
    minStock: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ name: 'text', sku: 'text' });

export const ProductModel: Model<ProductDocument> = model<ProductDocument>('Product', productSchema);
