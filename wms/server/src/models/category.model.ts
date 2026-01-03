import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface Category {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryDocument extends Category, Document { }

const categorySchema = new Schema<CategoryDocument>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

categorySchema.index({ code: 1 }, { unique: true });
categorySchema.index({ name: 1 });

export const CategoryModel: Model<CategoryDocument> = (models.Category as Model<CategoryDocument>) || model<CategoryDocument>(
  'Category',
  categorySchema
);
