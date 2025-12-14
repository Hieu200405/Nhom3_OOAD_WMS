import { Router } from 'express';
import { z } from 'zod';
import * as controller from '../controllers/inventory.controller.js';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import { validate } from '../middlewares/validate.js';
import { objectIdSchema } from '@wms/shared/schemas';

const router = Router();

const moveSchema = z.object({
  productId: objectIdSchema,
  fromLocation: objectIdSchema,
  toLocation: objectIdSchema,
  qty: z.number().positive()
});

router.use(auth);

router.get('/', controller.list);
router.post('/move', requireRole('Admin', 'Manager'), validate({ body: moveSchema }), controller.move);

export default router;
