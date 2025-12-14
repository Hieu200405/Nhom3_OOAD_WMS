import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import partnerRoutes from './partner.routes.js';
import warehouseRoutes from './warehouse.routes.js';
import inventoryRoutes from './inventory.routes.js';
import receiptRoutes from './receipt.routes.js';
import deliveryRoutes from './delivery.routes.js';
import incidentRoutes from './incident.routes.js';
import stocktakeRoutes from './stocktake.routes.js';
import adjustmentRoutes from './adjustment.routes.js';
import returnRoutes from './return.routes.js';
import disposalRoutes from './disposal.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/partners', partnerRoutes);
router.use('/warehouse', warehouseRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/receipts', receiptRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/incidents', incidentRoutes);
router.use('/stocktakes', stocktakeRoutes);
router.use('/adjustments', adjustmentRoutes);
router.use('/returns', returnRoutes);
router.use('/disposals', disposalRoutes);
router.use('/reports', reportRoutes);

export const apiRouter = router;
