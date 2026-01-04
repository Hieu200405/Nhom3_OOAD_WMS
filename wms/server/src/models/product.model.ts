import mongoose, { Schema, model, type Document, type Model, Types } from 'mongoose';

export interface Product {
  sku: string;
  name: string;
  categoryId: Types.ObjectId;
  unit: string;
  priceIn: number;
  priceOut: number;
  minStock: number;
  image?: string;
  description?: string;
  supplierIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDocument extends Product, Document { }

const productSchema = new Schema<ProductDocument>(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    unit: { type: String, required: true, trim: true },
    priceIn: { type: Number, required: true, min: 0 },
    priceOut: { type: Number, required: true, min: 0 },
    minStock: { type: Number, required: true, min: 0 },
    image: { type: String },
    description: { type: String },
    supplierIds: [{ type: Schema.Types.ObjectId, ref: 'Supplier' }]
  },
  { timestamps: true }
);


// Optimized indexes for common queries
productSchema.index({ name: 'text', sku: 'text' }); // Text search
productSchema.index({ categoryId: 1, createdAt: -1 }); // List products by category, sorted by date
productSchema.index({ categoryId: 1, priceOut: 1 }); // Filter by category and price
productSchema.index({ minStock: 1 }); // Find low stock products
productSchema.index({ createdAt: -1 }); // Sort by newest


export const ProductModel: Model<ProductDocument> = (mongoose.models.Product as Model<ProductDocument>) || model<ProductDocument>('Product', productSchema);
