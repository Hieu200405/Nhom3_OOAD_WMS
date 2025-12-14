import {
  Boxes,
  ClipboardCheck,
  ClipboardList,
  FileChartColumn,
  LayoutDashboard,
  Package,
  Receipt,
  ShieldAlert,
  ShoppingBag,
  Users,
  Warehouse,
  Truck,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { ProductsPage } from '../features/products/ProductsPage.jsx';
import { CategoriesPage } from '../features/products/CategoriesPage.jsx';
import { SuppliersPage } from '../features/partners/SuppliersPage.jsx';
import { CustomersPage } from '../features/partners/CustomersPage.jsx';
import { WarehouseStructurePage } from '../features/warehouse-structure/WarehouseStructurePage.jsx';
import { InventoryPage } from '../features/inventory/InventoryPage.jsx';
import { ReceiptsPage } from '../features/receipts/ReceiptsPage.jsx';
import { ReceiptDetailPage } from '../features/receipts/ReceiptDetailPage.jsx';
import { DeliveriesPage } from '../features/deliveries/DeliveriesPage.jsx';
import { DeliveryDetailPage } from '../features/deliveries/DeliveryDetailPage.jsx';
import { IncidentsPage } from '../features/incidents/IncidentsPage.jsx';
import { StocktakingPage } from '../features/stocktaking/StocktakingPage.jsx';
import { ReturnsPage } from '../features/returns/ReturnsPage.jsx';
import { DisposalsPage } from '../features/disposals/DisposalsPage.jsx';
import { ReportsPage } from '../features/reports/ReportsPage.jsx';
import { UsersPage } from '../features/users/UsersPage.jsx';
import { Roles } from '../utils/constants.js';
import { PdfTestPage } from '../features/pdf/PdfTestPage.jsx';

export const appRoutes = [
  {
    path: '/dashboard',
    labelKey: 'navigation.dashboard',
    icon: LayoutDashboard,
    component: DashboardPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
  },
  {
    path: '/products',
    labelKey: 'navigation.products',
    icon: Package,
    component: ProductsPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
  },
  {
    path: '/categories',
    labelKey: 'navigation.categories',
    icon: Boxes,
    component: CategoriesPage,
    roles: [Roles.ADMIN, Roles.MANAGER],
  },
  {
    path: '/suppliers',
    labelKey: 'navigation.suppliers',
    icon: ClipboardCheck,
    component: SuppliersPage,
    roles: [Roles.ADMIN, Roles.MANAGER],
  },
  {
    path: '/customers',
    labelKey: 'navigation.customers',
    icon: ShoppingBag,
    component: CustomersPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
  },
  {
    path: '/warehouse',
    labelKey: 'navigation.warehouse',
    icon: Warehouse,
    component: WarehouseStructurePage,
    roles: [Roles.ADMIN, Roles.MANAGER],
  },
  {
    path: '/inventory',
    labelKey: 'navigation.inventory',
    icon: ClipboardList,
    component: InventoryPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
  },
  {
    path: '/receipts',
    labelKey: 'navigation.receipts',
    icon: Receipt,
    component: ReceiptsPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
  },
  {
    path: '/receipts/:id',
    labelKey: 'navigation.receipts',
    icon: Receipt,
    component: ReceiptDetailPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
    hiddenInMenu: true,
  },
  {
    path: '/deliveries',
    labelKey: 'navigation.deliveries',
    icon: Truck,
    component: DeliveriesPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
  },
  {
    path: '/deliveries/:id',
    labelKey: 'navigation.deliveries',
    icon: Truck,
    component: DeliveryDetailPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
    hiddenInMenu: true,
  },
  {
    path: '/incidents',
    labelKey: 'navigation.incidents',
    icon: ShieldAlert,
    component: IncidentsPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
  },
  {
    path: '/stocktaking',
    labelKey: 'navigation.stocktaking',
    icon: RotateCw,
    component: StocktakingPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
  },
  {
    path: '/returns',
    labelKey: 'navigation.returns',
    icon: FileChartColumn,
    component: ReturnsPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
  },
  {
    path: '/disposals',
    labelKey: 'navigation.disposals',
    icon: Trash2,
    component: DisposalsPage,
    roles: [Roles.ADMIN, Roles.MANAGER],
  },
  {
    path: '/reports',
    labelKey: 'navigation.reports',
    icon: FileChartColumn,
    component: ReportsPage,
    roles: [Roles.ADMIN, Roles.MANAGER],
  },
  {
    path: '/pdf-test',
    labelKey: 'navigation.pdfTest',
    icon: FileChartColumn,
    component: PdfTestPage,
    roles: [Roles.ADMIN, Roles.MANAGER, Roles.STAFF],
  },
  {
    path: '/users',
    labelKey: 'navigation.users',
    icon: Users,
    component: UsersPage,
    roles: [Roles.ADMIN],
  },
];
