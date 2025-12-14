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

  await Promise.all(collections.map((model) => model.deleteMany({})));
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
      description: `${name} category`
    })
  );
  const inserted = await CategoryModel.insertMany(categories);
  return inserted.map((cat) => cat._id);
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
    { type: 'supplier' as const, name: 'Supplier Alpha' },
    { type: 'supplier' as const, name: 'Supplier Beta' },
    { type: 'customer' as const, name: 'Customer Gamma' },
    { type: 'customer' as const, name: 'Customer Delta' }
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
    aisles.push(...created.map((doc) => doc._id));
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
    racks.push(...created.map((doc) => doc._id));
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

type Identifiable = { _id: Types.ObjectId };

const seedInventory = async (products: Identifiable[], bins: Identifiable[]) => {
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

const seed = async () => {
  await connectMongo();
  await wipeCollections();

  await seedUsers();
  const categoryIds = await seedCategories();
  const products = await seedProducts(categoryIds);
  await seedPartners();
  const bins = await createWarehouseTree();
  await seedInventory(products, bins);

  logger.info('Seed completed successfully');
};

seed()
  .catch((error) => {
    logger.error('Seed failed', { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
