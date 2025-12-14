import { Schema, model, type Document, type Model, Types } from 'mongoose';
import { INCIDENT_TYPES, INCIDENT_ACTIONS, type IncidentType, type IncidentAction } from '@wms/shared';

export type IncidentRefType = 'receipt' | 'delivery';

export interface Incident {
  type: IncidentType;
  refType: IncidentRefType;
  refId: Types.ObjectId;
  note?: string;
  action: IncidentAction;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentDocument extends Incident, Document {}

const incidentSchema = new Schema<IncidentDocument>(
  {
    type: { type: String, enum: INCIDENT_TYPES, required: true },
    refType: { type: String, enum: ['receipt', 'delivery'], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    note: { type: String, trim: true },
    action: { type: String, enum: INCIDENT_ACTIONS, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

incidentSchema.index({ refType: 1, refId: 1 });

export const IncidentModel: Model<IncidentDocument> = model<IncidentDocument>(
  'Incident',
  incidentSchema
);
