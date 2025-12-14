import { Router } from 'express';
import { z } from 'zod';
import * as controller from '../controllers/incident.controller.js';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { validate } from '../middlewares/validate.js';
import { objectIdSchema } from '@wms/shared/schemas';
import { INCIDENT_TYPES, INCIDENT_ACTIONS } from '@wms/shared';

const router = Router();

const createSchema = z.object({
  type: z.enum(INCIDENT_TYPES),
  refType: z.enum(['receipt', 'delivery'] as const),
  refId: objectIdSchema,
  note: z.string().optional(),
  action: z.enum(INCIDENT_ACTIONS)
});

const updateSchema = z.object({
  note: z.string().optional(),
  action: z.enum(INCIDENT_ACTIONS).optional()
});

router.use(auth);

router.get('/', controller.list);
router.post('/', requireRole('Manager', 'Admin'), validate({ body: createSchema }), controller.create);
router.put('/:id', requireRole('Manager', 'Admin'), validate({ body: updateSchema }), controller.update);
router.delete('/:id', requireRole('Manager', 'Admin'), controller.remove);

export default router;
