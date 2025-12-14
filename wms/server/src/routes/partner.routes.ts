import { Router } from 'express';
import { z } from 'zod';
import * as controller from '../controllers/partner.controller.js';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { validate } from '../middlewares/validate.js';
import { PARTNER_TYPES } from '@wms/shared';

const router = Router();

const baseSchema = z.object({
  type: z.enum(PARTNER_TYPES),
  name: z.string().min(1),
  contact: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});

router.use(auth);

router.get('/', controller.list);
router.post('/', requireRole('Admin', 'Manager'), validate({ body: baseSchema }), controller.create);
router.put(
  '/:id',
  requireRole('Admin', 'Manager'),
  validate({ body: baseSchema.partial() }),
  controller.update
);
router.delete('/:id', requireRole('Admin', 'Manager'), controller.remove);

export default router;
