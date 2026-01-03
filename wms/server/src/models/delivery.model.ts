import { Schema, model, type Document, type Model, Types, models } from 'mongoose';
import { DELIVERY_STATUS, type DeliveryStatus } from '@wms/shared';

export interface DeliveryLine {
  productId: Types.ObjectId;
  qty: number;
  priceOut: number;
  locationId?: Types.ObjectId | null;
}

export interface Delivery {
  code: string;
  customerId: Types.ObjectId;
  date: Date; // Departure/Export Date
  expectedDate: Date; // Deadline for delivery (SLA)
  status: DeliveryStatus;
  lines: DeliveryLine[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryDocument extends Delivery, Document { }

const deliveryLineSchema = new Schema<DeliveryLine>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 0 },
    priceOut: { type: Number, required: true, min: 0 },
    locationId: { type: Schema.Types.ObjectId, ref: 'WarehouseNode' }
  },
  { _id: false }
);

const deliverySchema = new Schema<DeliveryDocument>(
  {
    code: { type: String, required: true, unique: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Partner', required: true },
    date: { type: Date, required: true }, // Departure Date
    expectedDate: { type: Date, required: true }, // Delivery Deadline
    status: { type: String, enum: DELIVERY_STATUS, default: 'draft', required: true },
    lines: { type: [deliveryLineSchema], default: [] },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

deliverySchema.index({ code: 1 }, { unique: true });
deliverySchema.index({ customerId: 1, date: -1 });

export const DeliveryModel: Model<DeliveryDocument> = (models.Delivery as Model<DeliveryDocument>) || model<DeliveryDocument>('Delivery', deliverySchema);
