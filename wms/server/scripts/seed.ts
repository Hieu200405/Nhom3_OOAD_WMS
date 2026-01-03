import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { connectMongo, disconnectMongo } from '../src/db/mongo.js';
import { env } from '../src/config/env.js';
import {
  UserModel,
  CategoryModel,
  ProductModel,
  PartnerModel,
  WarehouseNodeModel,
  InventoryModel
} from '../src/models/index.js';
import { logger } from '../src/utils/logger.js';

const ADMIN_EMAIL = 'admin@wms.local';
const DEFAULT_PASSWORD = '123456';

const wipeCollections = async () => {
  const collections = [
    UserModel,
    CategoryModel,
    ProductModel,
    PartnerModel,
    WarehouseNodeModel,
    InventoryModel
  ];

  await Promise.all(collections.map((model) => (model as any).deleteMany({})));
};

const seedUsers = async () => {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, env.saltRounds);
  const users = [
    { email: ADMIN_EMAIL, fullName: 'System Admin', role: 'Admin' as const },
    { email: 'manager@wms.local', fullName: 'Inventory Manager', role: 'Manager' as const },
    { email: 'staff@wms.local', fullName: 'Warehouse Staff', role: 'Staff' as const }
  ];

  await UserModel.insertMany(
    users.map((user) => ({
      ...user,
      passwordHash,
      isActive: true
    }))
  );
};

const seedCategories = async () => {
  const categories = ['Beverages', 'Electronics', 'Furniture', 'Groceries', 'Pharmaceuticals'].map(
    (name) => ({
      name,
      code: name.toUpperCase().slice(0, 3) + '-001',
      description: `${name} category`
    })
  );
  const inserted = await CategoryModel.insertMany(categories);
  return inserted.map((cat) => cat._id as Types.ObjectId);
};

const seedProducts = async (categoryIds: Types.ObjectId[]) => {
  const products = [];
  for (let i = 1; i <= 20; i += 1) {
    const sku = `SKU-${i.toString().padStart(3, '0')}`;
    const categoryId = categoryIds[i % categoryIds.length];
    products.push({
      sku,
      name: `Product ${i}`,
      categoryId,
      unit: 'pcs',
      priceIn: 10 + i,
      priceOut: 15 + i,
      minStock: 25
    });
  }
  const inserted = await ProductModel.insertMany(products);
  return inserted;
};

const seedPartners = async () => {
  const partners = [
    { type: 'supplier' as const, name: 'Supplier Alpha', code: 'SUP-001', contact: '0900000001' },
    { type: 'supplier' as const, name: 'Supplier Beta', code: 'SUP-002', contact: '0900000002' },
    { type: 'customer' as const, name: 'Customer Gamma', code: 'CUST-001', contact: '0900000003' },
    { type: 'customer' as const, name: 'Customer Delta', code: 'CUST-002', contact: '0900000004' }
  ];
  await PartnerModel.insertMany(partners);
};

const createWarehouseTree = async () => {
  const warehouse = await WarehouseNodeModel.create({
    type: 'warehouse',
    name: 'Central Warehouse',
    code: 'WH-001'
  });

  const zones = await WarehouseNodeModel.insertMany(
    Array.from({ length: 2 }).map((_, index) => ({
      type: 'zone' as const,
      name: `Zone ${index + 1}`,
      code: `WH-001-Z${index + 1}`,
      parentId: warehouse._id
    }))
  );

  const aisles: Types.ObjectId[] = [];
  for (const zone of zones) {
    const created = await WarehouseNodeModel.insertMany(
      Array.from({ length: 2 }).map((_, index) => ({
        type: 'aisle' as const,
        name: `${zone.name} Aisle ${index + 1}`,
        code: `${zone.code}-A${index + 1}`,
        parentId: zone._id
      }))
    );
    aisles.push(...created.map((doc) => doc._id as Types.ObjectId));
  }

  const racks: Types.ObjectId[] = [];
  for (const aisleId of aisles) {
    const aisle = await WarehouseNodeModel.findById(aisleId).lean();
    if (!aisle) continue;
    const created = await WarehouseNodeModel.insertMany(
      Array.from({ length: 2 }).map((_, index) => ({
        type: 'rack' as const,
        name: `${aisle.name} Rack ${index + 1}`,
        code: `${aisle.code}-R${index + 1}`,
        parentId: aisleId
      }))
    );
    racks.push(...created.map((doc) => doc._id as Types.ObjectId));
  }

  const bins = [];
  for (const rackId of racks) {
    const rack = await WarehouseNodeModel.findById(rackId).lean();
    if (!rack) continue;
    const created = await WarehouseNodeModel.insertMany(
      Array.from({ length: 4 }).map((_, index) => ({
        type: 'bin' as const,
        name: `${rack.name} Bin ${index + 1}`,
        code: `${rack.code}-B${index + 1}`,
        parentId: rackId
      }))
    );
    bins.push(...created);
  }

  return bins;
};
// Use loose typing for seeding script simplification
const seedInventory = async (products: any[], bins: any[]) => {
  const items = [];
  const targetProducts = products.slice(0, 10);


  for (const product of targetProducts) {
    const selectedBins = bins.sort(() => 0.5 - Math.random()).slice(0, 3);
    for (const bin of selectedBins) {
      const quantity = Math.floor(Math.random() * 151) + 50; // 50-200
      items.push({
        productId: product._id,
        locationId: bin._id,
        quantity
      });
    }
  }

  if (items.length > 0) {
    await InventoryModel.insertMany(items);
  }
};

const seedNotifications = async (users: any[]) => {
  const notifications = [];
  const admin = users.find(u => u.role === 'Admin');

  if (admin) {
    notifications.push({
      userId: admin._id,
      type: 'info',
      title: 'Hệ thống sẵn sàng',
      message: 'Chào mừng bạn đến với WMS. Cơ sở dữ liệu đã được khởi tạo thành công.',
      isRead: false
    });

    notifications.push({
      userId: admin._id,
      type: 'warning',
      title: 'Cần kiểm tra kho',
      message: 'Một số sản phẩm đang có mức tồn kho thấp dưới mức tối thiểu.',
      isRead: false
    });
  }

  // Dynamic import to avoid static import issues if file is new
  const { NotificationModel } = await import('../src/models/notification.model.js');
  if (NotificationModel) {
    await NotificationModel.insertMany(notifications);
  }
};

const seedFinancials = async (partners: any[]) => {
  const transactions = [];
  // Use first supplier
  const supplier = partners.find(p => p.type === 'supplier');
  // Use first customer
  const customer = partners.find(p => p.type === 'customer');

  // Dynamic import
  const { FinancialTransactionModel } = await import('../src/models/transaction.model.js');

  if (supplier && FinancialTransactionModel) {
    transactions.push({
      partnerId: supplier._id,
      type: 'expense',
      status: 'completed',
      amount: 15000000,
      referenceType: 'Manual',
      note: 'Thanh toán tiền nhập hàng tháng trước',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    });
  }

  if (customer && FinancialTransactionModel) {
    transactions.push({
      partnerId: customer._id,
      type: 'income',
      status: 'completed',
      amount: 8500000,
      referenceType: 'Manual',
      note: 'Khách hàng thanh toán công nợ',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });
  }

  if (FinancialTransactionModel && transactions.length > 0) {
    await FinancialTransactionModel.insertMany(transactions);
  }
};


const seed = async () => {
  await connectMongo();

  // Wipe including new collections
  const collections = [
    UserModel,
    CategoryModel,
    ProductModel,
    PartnerModel,
    WarehouseNodeModel,
    InventoryModel
  ];

  // Try to wipe optional/new collections gracefully
  try {
    const { NotificationModel } = await import('../src/models/notification.model.js');
    if (NotificationModel) await NotificationModel.deleteMany({});

    const { FinancialTransactionModel } = await import('../src/models/transaction.model.js');
    if (FinancialTransactionModel) await FinancialTransactionModel.deleteMany({});

    const { ReceiptModel } = await import('../src/models/receipt.model.js');
    if (ReceiptModel) await ReceiptModel.deleteMany({});

    const { DeliveryModel } = await import('../src/models/delivery.model.js');
    if (DeliveryModel) await DeliveryModel.deleteMany({});
  } catch (e) { console.log('Partial wipe skipped', e); }

  await Promise.all(collections.map((model) => (model as any).deleteMany({})));

  await seedUsers();
  const users = await UserModel.find({});

  const categoryIds = await seedCategories();
  const products = await seedProducts(categoryIds); // Ensure products returned are Documents
  const productDocs = await ProductModel.find({}); // Refetch to be sure

  await seedPartners();
  const partners = await PartnerModel.find({});

  const bins = await createWarehouseTree();
  // Refetch bins to ensure we have _ids correct if needed, or use returned array

  await seedInventory(productDocs, bins);

  // New Seeds
  await seedNotifications(users);
  await seedFinancials(partners);

  logger.info('Seed completed successfully with comprehensive data');
};

seed()
  .catch((error) => {
    logger.error('Seed failed', { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
