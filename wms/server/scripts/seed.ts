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

// ============================================================================
// REALISTIC DATA SETS
// ============================================================================

const REALISTIC_USERS = [
  { email: ADMIN_EMAIL, fullName: 'Nguyễn Văn An', role: 'Admin' as const },
  { email: 'manager@wms.local', fullName: 'Trần Thị Bình', role: 'Manager' as const },
  { email: 'manager2@wms.local', fullName: 'Lê Hoàng Cường', role: 'Manager' as const },
  { email: 'staff@wms.local', fullName: 'Phạm Minh Đức', role: 'Staff' as const },
  { email: 'staff2@wms.local', fullName: 'Võ Thị Hoa', role: 'Staff' as const },
  { email: 'staff3@wms.local', fullName: 'Đặng Quốc Khánh', role: 'Staff' as const },
];

const REALISTIC_CATEGORIES = [
  { name: 'Điện tử - Công nghệ', code: 'ELEC', description: 'Thiết bị điện tử, máy tính, phụ kiện công nghệ' },
  { name: 'Thực phẩm & Đồ uống', code: 'FOOD', description: 'Thực phẩm khô, đồ uống, gia vị' },
  { name: 'Dược phẩm', code: 'PHAR', description: 'Thuốc, thực phẩm chức năng, dụng cụ y tế' },
  { name: 'Văn phòng phẩm', code: 'STAT', description: 'Dụng cụ văn phòng, giấy tờ, bút viết' },
  { name: 'Gia dụng', code: 'HOME', description: 'Đồ gia dụng, nội thất, trang trí' },
  { name: 'Thời trang', code: 'FASH', description: 'Quần áo, giày dép, phụ kiện thời trang' },
  { name: 'Mỹ phẩm', code: 'COSM', description: 'Mỹ phẩm, chăm sóc cá nhân' },
  { name: 'Đồ chơi', code: 'TOYS', description: 'Đồ chơi trẻ em, đồ chơi giáo dục' },
  { name: 'Thể thao', code: 'SPOR', description: 'Dụng cụ thể thao, trang phục thể thao' },
  { name: 'Sách & Báo', code: 'BOOK', description: 'Sách, tạp chí, báo' },
];

const REALISTIC_PRODUCTS = [
  // Electronics
  { sku: 'LAPTOP-001', name: 'Laptop Dell Inspiron 15 3000', category: 'ELEC', unit: 'cái', priceIn: 12000000, priceOut: 15000000, minStock: 10, description: 'Laptop văn phòng, Core i5, 8GB RAM, 256GB SSD' },
  { sku: 'LAPTOP-002', name: 'Laptop HP Pavilion 14', category: 'ELEC', unit: 'cái', priceIn: 14000000, priceOut: 17500000, minStock: 8, description: 'Laptop mỏng nhẹ, Core i7, 16GB RAM, 512GB SSD' },
  { sku: 'MOUSE-001', name: 'Chuột Logitech M331', category: 'ELEC', unit: 'cái', priceIn: 150000, priceOut: 250000, minStock: 50, description: 'Chuột không dây, pin 24 tháng' },
  { sku: 'KEYB-001', name: 'Bàn phím cơ Keychron K2', category: 'ELEC', unit: 'cái', priceIn: 1800000, priceOut: 2500000, minStock: 20, description: 'Bàn phím cơ 75%, switch Gateron Brown' },
  { sku: 'HEADPHONE-001', name: 'Tai nghe Sony WH-1000XM4', category: 'ELEC', unit: 'cái', priceIn: 6000000, priceOut: 8000000, minStock: 15, description: 'Tai nghe chống ồn cao cấp' },
  { sku: 'MONITOR-001', name: 'Màn hình LG 24" IPS', category: 'ELEC', unit: 'cái', priceIn: 2500000, priceOut: 3500000, minStock: 12, description: 'Màn hình Full HD, IPS, 75Hz' },
  { sku: 'PHONE-001', name: 'iPhone 14 Pro 128GB', category: 'ELEC', unit: 'cái', priceIn: 24000000, priceOut: 28000000, minStock: 5, description: 'Smartphone cao cấp Apple' },
  { sku: 'PHONE-002', name: 'Samsung Galaxy S23', category: 'ELEC', unit: 'cái', priceIn: 18000000, priceOut: 22000000, minStock: 8, description: 'Smartphone Android flagship' },

  // Food & Beverage
  { sku: 'COFFEE-001', name: 'Cà phê Trung Nguyên G7 3in1', category: 'FOOD', unit: 'hộp', priceIn: 45000, priceOut: 65000, minStock: 200, description: 'Hộp 21 gói x 16g' },
  { sku: 'COFFEE-002', name: 'Cà phê Highlands Phin Drip', category: 'FOOD', unit: 'hộp', priceIn: 120000, priceOut: 180000, minStock: 100, description: 'Hộp 10 gói phin giấy' },
  { sku: 'TEA-001', name: 'Trà xanh Lipton 100 túi', category: 'FOOD', unit: 'hộp', priceIn: 80000, priceOut: 120000, minStock: 150, description: 'Trà xanh túi lọc' },
  { sku: 'NOODLE-001', name: 'Mì Hảo Hảo tôm chua cay', category: 'FOOD', unit: 'thùng', priceIn: 95000, priceOut: 135000, minStock: 300, description: 'Thùng 30 gói' },
  { sku: 'RICE-001', name: 'Gạo ST25 túi 5kg', category: 'FOOD', unit: 'túi', priceIn: 120000, priceOut: 180000, minStock: 100, description: 'Gạo thơm đặc sản' },
  { sku: 'OIL-001', name: 'Dầu ăn Neptune chai 2L', category: 'FOOD', unit: 'chai', priceIn: 65000, priceOut: 95000, minStock: 80, description: 'Dầu ăn cao cấp' },
  { sku: 'MILK-001', name: 'Sữa tươi Vinamilk 1L', category: 'FOOD', unit: 'hộp', priceIn: 28000, priceOut: 42000, minStock: 200, description: 'Sữa tươi tiệt trùng' },
  { sku: 'SNACK-001', name: 'Snack Oishi 42g', category: 'FOOD', unit: 'gói', priceIn: 8000, priceOut: 12000, minStock: 500, description: 'Snack khoai tây vị tự nhiên' },

  // Pharmaceuticals
  { sku: 'MED-001', name: 'Paracetamol 500mg', category: 'PHAR', unit: 'hộp', priceIn: 15000, priceOut: 25000, minStock: 200, description: 'Thuốc hạ sốt, giảm đau - Hộp 100 viên' },
  { sku: 'MED-002', name: 'Vitamin C 1000mg', category: 'PHAR', unit: 'lọ', priceIn: 120000, priceOut: 180000, minStock: 100, description: 'Thực phẩm chức năng - Lọ 100 viên' },
  { sku: 'MED-003', name: 'Khẩu trang y tế 4 lớp', category: 'PHAR', unit: 'hộp', priceIn: 45000, priceOut: 70000, minStock: 300, description: 'Hộp 50 cái' },
  { sku: 'MED-004', name: 'Dung dịch sát khuẩn 500ml', category: 'PHAR', unit: 'chai', priceIn: 35000, priceOut: 55000, minStock: 150, description: 'Cồn sát khuẩn 70%' },
  { sku: 'MED-005', name: 'Băng cá nhân', category: 'PHAR', unit: 'hộp', priceIn: 25000, priceOut: 40000, minStock: 100, description: 'Hộp 100 miếng' },

  // Stationery
  { sku: 'PEN-001', name: 'Bút bi Thiên Long TL-079', category: 'STAT', unit: 'cây', priceIn: 3000, priceOut: 5000, minStock: 1000, description: 'Bút bi xanh' },
  { sku: 'PEN-002', name: 'Bút gel Pentel BL77', category: 'STAT', unit: 'cây', priceIn: 12000, priceOut: 18000, minStock: 500, description: 'Bút gel mực nước' },
  { sku: 'NOTEBOOK-001', name: 'Sổ tay Campus 200 trang', category: 'STAT', unit: 'quyển', priceIn: 25000, priceOut: 40000, minStock: 300, description: 'Sổ lò xo A5' },
  { sku: 'PAPER-001', name: 'Giấy A4 Double A 70gsm', category: 'STAT', unit: 'ream', priceIn: 85000, priceOut: 120000, minStock: 200, description: 'Ream 500 tờ' },
  { sku: 'STAPLER-001', name: 'Dập ghim Deli 0352', category: 'STAT', unit: 'cái', priceIn: 35000, priceOut: 55000, minStock: 100, description: 'Dập ghim cỡ nhỏ' },

  // Home & Living
  { sku: 'CHAIR-001', name: 'Ghế văn phòng ergonomic', category: 'HOME', unit: 'cái', priceIn: 1200000, priceOut: 1800000, minStock: 20, description: 'Ghế xoay có tựa lưng' },
  { sku: 'DESK-001', name: 'Bàn làm việc gỗ 120x60cm', category: 'HOME', unit: 'cái', priceIn: 1500000, priceOut: 2200000, minStock: 15, description: 'Bàn gỗ công nghiệp' },
  { sku: 'LAMP-001', name: 'Đèn bàn LED chống cận', category: 'HOME', unit: 'cái', priceIn: 250000, priceOut: 400000, minStock: 50, description: 'Đèn LED 3 chế độ' },
  { sku: 'BOTTLE-001', name: 'Bình giữ nhiệt Lock&Lock 500ml', category: 'HOME', unit: 'cái', priceIn: 180000, priceOut: 280000, minStock: 80, description: 'Bình inox 2 lớp' },
  { sku: 'TOWEL-001', name: 'Khăn tắm cotton 70x140cm', category: 'HOME', unit: 'cái', priceIn: 120000, priceOut: 200000, minStock: 100, description: 'Khăn 100% cotton' },

  // Fashion
  { sku: 'TSHIRT-001', name: 'Áo thun cotton nam', category: 'FASH', unit: 'cái', priceIn: 80000, priceOut: 150000, minStock: 200, description: 'Áo thun basic nhiều màu' },
  { sku: 'JEANS-001', name: 'Quần jean nam slim fit', category: 'FASH', unit: 'cái', priceIn: 250000, priceOut: 450000, minStock: 100, description: 'Quần jean co giãn' },
  { sku: 'SHOES-001', name: 'Giày thể thao Nike Air Max', category: 'FASH', unit: 'đôi', priceIn: 1800000, priceOut: 2500000, minStock: 30, description: 'Giày chạy bộ' },
  { sku: 'BAG-001', name: 'Balo laptop 15.6 inch', category: 'FASH', unit: 'cái', priceIn: 350000, priceOut: 550000, minStock: 60, description: 'Balo chống nước' },

  // Cosmetics
  { sku: 'SHAMPOO-001', name: 'Dầu gội Dove 650ml', category: 'COSM', unit: 'chai', priceIn: 95000, priceOut: 145000, minStock: 150, description: 'Dầu gội phục hồi hư tổn' },
  { sku: 'SOAP-001', name: 'Sữa tắm Lifebuoy 850ml', category: 'COSM', unit: 'chai', priceIn: 75000, priceOut: 115000, minStock: 200, description: 'Sữa tắm diệt khuẩn' },
  { sku: 'CREAM-001', name: 'Kem dưỡng da Olay 50g', category: 'COSM', unit: 'hộp', priceIn: 180000, priceOut: 280000, minStock: 80, description: 'Kem dưỡng ẩm ban đêm' },
  { sku: 'LIPSTICK-001', name: 'Son môi Maybelline', category: 'COSM', unit: 'cây', priceIn: 120000, priceOut: 200000, minStock: 100, description: 'Son lì lâu trôi' },

  // Toys
  { sku: 'LEGO-001', name: 'LEGO Classic 500 mảnh', category: 'TOYS', unit: 'hộp', priceIn: 450000, priceOut: 700000, minStock: 40, description: 'Bộ xếp hình sáng tạo' },
  { sku: 'PUZZLE-001', name: 'Tranh ghép 1000 mảnh', category: 'TOYS', unit: 'hộp', priceIn: 180000, priceOut: 300000, minStock: 50, description: 'Puzzle phong cảnh' },
  { sku: 'DOLL-001', name: 'Búp bê Barbie', category: 'TOYS', unit: 'cái', priceIn: 250000, priceOut: 400000, minStock: 60, description: 'Búp bê thời trang' },

  // Sports
  { sku: 'BALL-001', name: 'Bóng đá Molten size 5', category: 'SPOR', unit: 'quả', priceIn: 280000, priceOut: 450000, minStock: 50, description: 'Bóng da PU' },
  { sku: 'YOGA-001', name: 'Thảm yoga TPE 6mm', category: 'SPOR', unit: 'cái', priceIn: 250000, priceOut: 400000, minStock: 70, description: 'Thảm tập yoga chống trượt' },
  { sku: 'DUMBBELL-001', name: 'Tạ tay 5kg (cặp)', category: 'SPOR', unit: 'cặp', priceIn: 180000, priceOut: 300000, minStock: 40, description: 'Tạ tay bọc cao su' },

  // Books
  { sku: 'BOOK-001', name: 'Đắc Nhân Tâm', category: 'BOOK', unit: 'quyển', priceIn: 65000, priceOut: 95000, minStock: 100, description: 'Sách kỹ năng sống' },
  { sku: 'BOOK-002', name: 'Nhà Giả Kim', category: 'BOOK', unit: 'quyển', priceIn: 55000, priceOut: 85000, minStock: 120, description: 'Tiểu thuyết Paulo Coelho' },
  { sku: 'BOOK-003', name: 'Sapiens - Lược Sử Loài Người', category: 'BOOK', unit: 'quyển', priceIn: 120000, priceOut: 180000, minStock: 80, description: 'Sách lịch sử nhân loại' },
];

const REALISTIC_PARTNERS = [
  // Suppliers
  { type: 'supplier' as const, name: 'Công ty TNHH Điện Tử Việt Nam', code: 'SUP-ELEC-001', contact: 'Nguyễn Văn A - 0901234567 - electronics@supplier.vn' },
  { type: 'supplier' as const, name: 'Công ty CP Thực Phẩm Sạch', code: 'SUP-FOOD-001', contact: 'Trần Thị B - 0912345678 - food@supplier.vn' },
  { type: 'supplier' as const, name: 'Công ty TNHH Dược Phẩm ABC', code: 'SUP-PHAR-001', contact: 'Lê Văn C - 0923456789 - pharma@supplier.vn' },
  { type: 'supplier' as const, name: 'Công ty CP Văn Phòng Phẩm Thiên Long', code: 'SUP-STAT-001', contact: 'Phạm Thị D - 0934567890 - stationery@supplier.vn' },
  { type: 'supplier' as const, name: 'Công ty TNHH Nội Thất Hoàng Gia', code: 'SUP-HOME-001', contact: 'Võ Văn E - 0945678901 - furniture@supplier.vn' },
  { type: 'supplier' as const, name: 'Công ty CP Thời Trang Việt', code: 'SUP-FASH-001', contact: 'Đặng Thị F - 0956789012 - fashion@supplier.vn' },
  { type: 'supplier' as const, name: 'Công ty TNHH Mỹ Phẩm Quốc Tế', code: 'SUP-COSM-001', contact: 'Hoàng Văn G - 0967890123 - cosmetics@supplier.vn' },
  { type: 'supplier' as const, name: 'Công ty CP Đồ Chơi Trẻ Em', code: 'SUP-TOYS-001', contact: 'Bùi Thị H - 0978901234 - toys@supplier.vn' },

  // Customers
  { type: 'customer' as const, name: 'Siêu Thị Co.opMart', code: 'CUST-RETAIL-001', contact: 'Nguyễn Minh I - 0989012345 - coopmart@customer.vn' },
  { type: 'customer' as const, name: 'Chuỗi Cửa Hàng FPT Shop', code: 'CUST-RETAIL-002', contact: 'Trần Văn J - 0990123456 - fptshop@customer.vn' },
  { type: 'customer' as const, name: 'Siêu Thị Điện Máy Xanh', code: 'CUST-RETAIL-003', contact: 'Lê Thị K - 0901234568 - dmx@customer.vn' },
  { type: 'customer' as const, name: 'Nhà Thuốc Long Châu', code: 'CUST-PHAR-001', contact: 'Phạm Văn L - 0912345679 - longchau@customer.vn' },
  { type: 'customer' as const, name: 'Cửa Hàng Sách Fahasa', code: 'CUST-BOOK-001', contact: 'Võ Thị M - 0923456780 - fahasa@customer.vn' },
  { type: 'customer' as const, name: 'Chuỗi Gym California Fitness', code: 'CUST-SPORT-001', contact: 'Đặng Văn N - 0934567891 - california@customer.vn' },
  { type: 'customer' as const, name: 'Siêu Thị BigC', code: 'CUST-RETAIL-004', contact: 'Hoàng Thị O - 0945678902 - bigc@customer.vn' },
  { type: 'customer' as const, name: 'Cửa Hàng Thời Trang H&M', code: 'CUST-FASH-001', contact: 'Bùi Văn P - 0956789013 - hm@customer.vn' },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

const seedUsers = async () => {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, env.saltRounds);
  await UserModel.insertMany(
    REALISTIC_USERS.map((user) => ({
      ...user,
      passwordHash,
      isActive: true
    }))
  );
  logger.info(`✓ Seeded ${REALISTIC_USERS.length} users`);
};

const seedCategories = async () => {
  const inserted = await CategoryModel.insertMany(REALISTIC_CATEGORIES);
  logger.info(`✓ Seeded ${inserted.length} categories`);
  return inserted.map((cat) => ({ _id: cat._id as Types.ObjectId, code: cat.code }));
};

const seedProducts = async (categories: { _id: Types.ObjectId; code: string }[]) => {
  const products = REALISTIC_PRODUCTS.map((product) => {
    const category = categories.find((c) => c.code === product.category);
    if (!category) throw new Error(`Category ${product.category} not found`);

    return {
      sku: product.sku,
      name: product.name,
      categoryId: category._id,
      unit: product.unit,
      priceIn: product.priceIn,
      priceOut: product.priceOut,
      minStock: product.minStock,
      description: product.description,
      supplierIds: []
    };
  });

  const inserted = await ProductModel.insertMany(products);
  logger.info(`✓ Seeded ${inserted.length} products across ${categories.length} categories`);
  return inserted;
};

const seedPartners = async () => {
  await PartnerModel.insertMany(REALISTIC_PARTNERS);
  logger.info(`✓ Seeded ${REALISTIC_PARTNERS.length} partners (${REALISTIC_PARTNERS.filter(p => p.type === 'supplier').length} suppliers, ${REALISTIC_PARTNERS.filter(p => p.type === 'customer').length} customers)`);
};

const createWarehouseTree = async () => {
  // Main Warehouse
  const mainWarehouse = await WarehouseNodeModel.create({
    type: 'warehouse',
    name: 'Kho Trung Tâm Hà Nội',
    code: 'WH-HN-001',
    warehouseType: 'General'
  });

  // Secondary Warehouse
  const secondaryWarehouse = await WarehouseNodeModel.create({
    type: 'warehouse',
    name: 'Kho Phân Phối TP.HCM',
    code: 'WH-HCM-001',
    warehouseType: 'General'
  });

  const allBins = [];

  // Create zones for main warehouse
  const mainZones = await WarehouseNodeModel.insertMany([
    { type: 'zone', name: 'Khu A - Điện Tử', code: 'WH-HN-001-ZA', parentId: mainWarehouse._id },
    { type: 'zone', name: 'Khu B - Thực Phẩm', code: 'WH-HN-001-ZB', parentId: mainWarehouse._id },
    { type: 'zone', name: 'Khu C - Dược Phẩm', code: 'WH-HN-001-ZC', parentId: mainWarehouse._id },
    { type: 'zone', name: 'Khu D - Văn Phòng Phẩm', code: 'WH-HN-001-ZD', parentId: mainWarehouse._id },
  ]);

  // Create zones for secondary warehouse
  const secondaryZones = await WarehouseNodeModel.insertMany([
    { type: 'zone', name: 'Khu A - Thời Trang', code: 'WH-HCM-001-ZA', parentId: secondaryWarehouse._id },
    { type: 'zone', name: 'Khu B - Gia Dụng', code: 'WH-HCM-001-ZB', parentId: secondaryWarehouse._id },
    { type: 'zone', name: 'Khu C - Mỹ Phẩm', code: 'WH-HCM-001-ZC', parentId: secondaryWarehouse._id },
  ]);

  const allZones = [...mainZones, ...secondaryZones];

  // Create aisles, racks, and bins for each zone
  for (const zone of allZones) {
    const aisleCount = 3; // 3 aisles per zone
    const aisles = await WarehouseNodeModel.insertMany(
      Array.from({ length: aisleCount }).map((_, i) => ({
        type: 'aisle',
        name: `${zone.name} - Lối ${i + 1}`,
        code: `${zone.code}-A${i + 1}`,
        parentId: zone._id
      }))
    );

    for (const aisle of aisles) {
      const rackCount = 4; // 4 racks per aisle
      const racks = await WarehouseNodeModel.insertMany(
        Array.from({ length: rackCount }).map((_, i) => ({
          type: 'rack',
          name: `${aisle.name} - Kệ ${i + 1}`,
          code: `${aisle.code}-R${i + 1}`,
          parentId: aisle._id
        }))
      );

      for (const rack of racks) {
        const binCount = 6; // 6 bins per rack
        const bins = await WarehouseNodeModel.insertMany(
          Array.from({ length: binCount }).map((_, i) => ({
            type: 'bin',
            name: `${rack.name} - Ngăn ${i + 1}`,
            code: `${rack.code}-B${i + 1}`,
            parentId: rack._id
          }))
        );
        allBins.push(...bins);
      }
    }
  }

  logger.info(`✓ Created warehouse structure: 2 warehouses, ${allZones.length} zones, ${allBins.length} bins`);
  return allBins;
};

const seedInventory = async (products: any[], bins: any[]) => {
  const items = [];

  // Distribute products across bins with realistic quantities
  for (const product of products) {
    // Each product in 2-5 different bins
    const binCount = Math.floor(Math.random() * 4) + 2;
    const selectedBins = bins.sort(() => 0.5 - Math.random()).slice(0, binCount);

    for (const bin of selectedBins) {
      // Quantity based on product type and minStock
      const baseQty = product.minStock || 50;
      const quantity = Math.floor(Math.random() * baseQty * 3) + baseQty;

      items.push({
        productId: product._id,
        locationId: bin._id,
        quantity,
        status: 'available'
      });
    }
  }

  await InventoryModel.insertMany(items);
  logger.info(`✓ Seeded ${items.length} inventory records across ${bins.length} bins`);
};

const seedNotifications = async (users: any[]) => {
  const notifications = [];
  const admin = users.find(u => u.role === 'Admin');
  const managers = users.filter(u => u.role === 'Manager');

  if (admin) {
    notifications.push(
      {
        userId: admin._id,
        type: 'info',
        title: 'Hệ thống khởi động thành công',
        message: 'Chào mừng bạn đến với WMS. Cơ sở dữ liệu đã được khởi tạo với dữ liệu mẫu thực tế.',
        isRead: false
      },
      {
        userId: admin._id,
        type: 'warning',
        title: 'Cảnh báo tồn kho thấp',
        message: '15 sản phẩm đang có mức tồn kho dưới mức tối thiểu. Cần nhập hàng bổ sung.',
        isRead: false
      },
      {
        userId: admin._id,
        type: 'success',
        title: 'Đơn hàng mới',
        message: 'Siêu Thị Co.opMart vừa đặt đơn hàng trị giá 150 triệu đồng.',
        isRead: true
      }
    );
  }

  for (const manager of managers) {
    notifications.push(
      {
        userId: manager._id,
        type: 'info',
        title: 'Nhiệm vụ mới',
        message: 'Bạn có 3 phiếu nhập kho cần duyệt.',
        isRead: false
      },
      {
        userId: manager._id,
        type: 'warning',
        title: 'Kiểm kê định kỳ',
        message: 'Đến hạn kiểm kê kho tháng 1/2026. Vui lòng lên kế hoạch.',
        isRead: false
      }
    );
  }

  const { NotificationModel } = await import('../src/models/notification.model.js');
  if (NotificationModel) {
    await NotificationModel.insertMany(notifications);
    logger.info(`✓ Seeded ${notifications.length} notifications`);
  }
};

const seedFinancials = async (partners: any[]) => {
  const transactions = [];
  const suppliers = partners.filter(p => p.type === 'supplier');
  const customers = partners.filter(p => p.type === 'customer');

  // Create realistic financial transactions over the past 30 days
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Supplier payments (expenses)
  for (let i = 0; i < 10; i++) {
    const supplier = suppliers[i % suppliers.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const amount = Math.floor(Math.random() * 50000000) + 10000000; // 10M - 60M

    transactions.push({
      partnerId: supplier._id,
      type: 'expense',
      status: i < 7 ? 'completed' : 'pending',
      amount,
      referenceType: 'Receipt',
      note: `Thanh toán nhập hàng ${supplier.name}`,
      date: new Date(now - daysAgo * dayMs)
    });
  }

  // Customer payments (income)
  for (let i = 0; i < 12; i++) {
    const customer = customers[i % customers.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const amount = Math.floor(Math.random() * 80000000) + 20000000; // 20M - 100M

    transactions.push({
      partnerId: customer._id,
      type: 'income',
      status: i < 9 ? 'completed' : 'pending',
      amount,
      referenceType: 'Delivery',
      note: `Thu tiền bán hàng cho ${customer.name}`,
      date: new Date(now - daysAgo * dayMs)
    });
  }

  const { FinancialTransactionModel } = await import('../src/models/transaction.model.js');
  if (FinancialTransactionModel) {
    await FinancialTransactionModel.insertMany(transactions);
    logger.info(`✓ Seeded ${transactions.length} financial transactions`);
  }
};

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

const seed = async () => {
  await connectMongo();
  logger.info('🌱 Starting comprehensive seed process...\n');

  // Wipe all collections
  const collections = [
    UserModel,
    CategoryModel,
    ProductModel,
    PartnerModel,
    WarehouseNodeModel,
    InventoryModel
  ];

  try {
    const { NotificationModel } = await import('../src/models/notification.model.js');
    if (NotificationModel) await NotificationModel.deleteMany({});

    const { FinancialTransactionModel } = await import('../src/models/transaction.model.js');
    if (FinancialTransactionModel) await FinancialTransactionModel.deleteMany({});

    const { ReceiptModel } = await import('../src/models/receipt.model.js');
    if (ReceiptModel) await ReceiptModel.deleteMany({});

    const { DeliveryModel } = await import('../src/models/delivery.model.js');
    if (DeliveryModel) await DeliveryModel.deleteMany({});

    const { StocktakeModel } = await import('../src/models/stocktake.model.js');
    if (StocktakeModel) await StocktakeModel.deleteMany({});

    const { AdjustmentModel } = await import('../src/models/adjustment.model.js');
    if (AdjustmentModel) await AdjustmentModel.deleteMany({});
  } catch (e) {
    logger.warn('Some collections skipped during wipe');
  }

  await Promise.all(collections.map((model) => (model as any).deleteMany({})));
  logger.info('✓ Wiped all collections\n');

  // Seed data
  await seedUsers();
  const users = await UserModel.find({});

  const categories = await seedCategories();
  const products = await seedProducts(categories);

  await seedPartners();
  const partners = await PartnerModel.find({});

  const bins = await createWarehouseTree();
  await seedInventory(products, bins);

  await seedNotifications(users);
  await seedFinancials(partners);

  logger.info('\n✅ Seed completed successfully!');
  logger.info(`
📊 Summary:
   - Users: ${users.length}
   - Categories: ${categories.length}
   - Products: ${products.length}
   - Partners: ${partners.length}
   - Warehouse Bins: ${bins.length}
   - Inventory Records: ~${products.length * 3}
   - Notifications: ~${users.length * 2}
   - Financial Transactions: ~22
  `);
};

seed()
  .catch((error) => {
    logger.error('Seed failed', { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
