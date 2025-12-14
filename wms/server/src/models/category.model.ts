import { Schema, model, type Document, type Model } from 'mongoose';

export interface Category {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDocument extends Category, Document {}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true }
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 }, { unique: true });

export const CategoryModel: Model<CategoryDocument> = model<CategoryDocument>(
  'Category',
  categorySchema
);
