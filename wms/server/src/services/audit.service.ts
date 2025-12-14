import { Types } from 'mongoose';
import { AuditLogModel } from '../models/auditLog.model.js';

interface AuditInput {
  action: string;
  entity: string;
  entityId?: unknown;
  actorId?: string | null;
  payload?: Record<string, unknown> | null;
}

const normalizeEntityId = (entityId: unknown): Types.ObjectId | string => {
  if (entityId instanceof Types.ObjectId) {
    return entityId;
  }
  if (typeof entityId === 'string') {
    return entityId;
  }
  if (entityId && typeof (entityId as { toString(): string }).toString === 'function') {
    return (entityId as { toString(): string }).toString();
  }
  return 'unknown';
};

export const recordAudit = async ({ action, entity, entityId, actorId, payload }: AuditInput) => {
  await AuditLogModel.create({
    action,
    entity,
    entityId: normalizeEntityId(entityId ?? 'unknown'),
    actorId: actorId ? new Types.ObjectId(actorId) : null,
    payload: payload ?? null
  });
};
