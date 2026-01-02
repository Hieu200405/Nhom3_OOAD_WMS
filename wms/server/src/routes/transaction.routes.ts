import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/rbac.js';
import * as controller from '../controllers/transaction.controller.js';

const router = Router();

router.use(auth);

router.get('/', requireRole('Admin', 'Manager'), controller.listTransactions);
router.post('/', requireRole('Admin', 'Manager'), controller.createTransaction);
router.get('/stats', requireRole('Admin', 'Manager'), controller.getStats);

export default router;
