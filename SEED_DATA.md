# 📊 WMS Seed Data Documentation

**Version:** 2.0 - Realistic Vietnamese Data  
**Last Updated:** 2026-01-04

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Comparison](#comparison)
3. [Users](#users)
4. [Categories](#categories)
5. [Products](#products)
6. [Partners](#partners)
7. [Warehouse Structure](#warehouse-structure)
8. [Inventory](#inventory)
9. [Financial Transactions](#financial-transactions)
10. [Notifications](#notifications)
11. [Usage](#usage)

---

## 🎯 Overview

Seed data đã được **nâng cấp toàn diện** với dữ liệu **thực tế, đa dạng và phong phú** mô phỏng hệ thống quản lý kho thực tế tại Việt Nam.

### Key Features
✅ Tên sản phẩm thực tế (Laptop Dell, Cà phê Trung Nguyên, iPhone...)  
✅ Giá cả phù hợp thị trường Việt Nam (VNĐ)  
✅ Tên công ty và đối tác Việt Nam hóa  
✅ Đơn vị tính phù hợp (cái, hộp, thùng, túi...)  
✅ Cấu trúc kho realistic (2 warehouses, 504 bins)  
✅ Dữ liệu đủ để test mọi tính năng  

---

## 📈 Comparison

### Before vs After

| Component | Before (v1.0) | After (v2.0) | After (v3.0 MASSIVE) | Improvement |
|-----------|---------------|--------------|----------------------|-------------|
| Users | 3 | 6 | **20** | +567% |
| Categories | 5 | 10 | **40** | +700% |
| Products | 20 (generic) | 50 (realistic) | **500** | +2,400% |
| Partners | 4 | 16 | **150** | +3,650% |
| Warehouses | 1 | 2 | **3** | +200% |
| Zones | 2 | 7 | **15** | +650% |
| Bins | 32 | 504 | **2,400** | +7,400% |
| Inventory Records | 30 | ~150 | **~1,500** | +4,900% |
| Notifications | 2 | 12 | **~100** | +4,900% |
| Transactions | 2 | 22 | **250** | +12,400% |

**Total Data Points:** ~4,500 records!

---

## 👥 Users

**Total:** 6 users with different roles

### Administrators (1)
- **Nguyễn Văn An** - `admin@wms.local`

### Managers (2)
- **Trần Thị Bình** - `manager@wms.local`
- **Lê Hoàng Cường** - `manager2@wms.local`

### Staff (3)
- **Phạm Minh Đức** - `staff@wms.local`
- **Võ Thị Hoa** - `staff2@wms.local`
- **Đặng Quốc Khánh** - `staff3@wms.local`

**Default Password:** `123456` (all users)

---

## 📦 Categories

**Total:** 10 categories

1. **Điện tử - Công nghệ** (ELEC) - Thiết bị điện tử, máy tính, phụ kiện
2. **Thực phẩm & Đồ uống** (FOOD) - Thực phẩm khô, đồ uống, gia vị
3. **Dược phẩm** (PHAR) - Thuốc, thực phẩm chức năng, dụng cụ y tế
4. **Văn phòng phẩm** (STAT) - Dụng cụ văn phòng, giấy tờ, bút viết
5. **Gia dụng** (HOME) - Đồ gia dụng, nội thất, trang trí
6. **Thời trang** (FASH) - Quần áo, giày dép, phụ kiện
7. **Mỹ phẩm** (COSM) - Mỹ phẩm, chăm sóc cá nhân
8. **Đồ chơi** (TOYS) - Đồ chơi trẻ em, đồ chơi giáo dục
9. **Thể thao** (SPOR) - Dụng cụ thể thao, trang phục
10. **Sách & Báo** (BOOK) - Sách, tạp chí, báo

---

## 🛍️ Products

**Total:** 50 realistic products

### Electronics (8 products)
- **LAPTOP-001** - Laptop Dell Inspiron 15 3000 (12M - 15M VNĐ)
- **LAPTOP-002** - Laptop HP Pavilion 14 (14M - 17.5M VNĐ)
- **MOUSE-001** - Chuột Logitech M331 (150K - 250K VNĐ)
- **KEYB-001** - Bàn phím cơ Keychron K2 (1.8M - 2.5M VNĐ)
- **HEADPHONE-001** - Tai nghe Sony WH-1000XM4 (6M - 8M VNĐ)
- **MONITOR-001** - Màn hình LG 24" IPS (2.5M - 3.5M VNĐ)
- **PHONE-001** - iPhone 14 Pro 128GB (24M - 28M VNĐ)
- **PHONE-002** - Samsung Galaxy S23 (18M - 22M VNĐ)

### Food & Beverage (8 products)
- **COFFEE-001** - Cà phê Trung Nguyên G7 3in1 (45K - 65K VNĐ)
- **COFFEE-002** - Cà phê Highlands Phin Drip (120K - 180K VNĐ)
- **TEA-001** - Trà xanh Lipton 100 túi (80K - 120K VNĐ)
- **NOODLE-001** - Mì Hảo Hảo tôm chua cay (95K - 135K VNĐ/thùng)
- **RICE-001** - Gạo ST25 túi 5kg (120K - 180K VNĐ)
- **OIL-001** - Dầu ăn Neptune 2L (65K - 95K VNĐ)
- **MILK-001** - Sữa tươi Vinamilk 1L (28K - 42K VNĐ)
- **SNACK-001** - Snack Oishi 42g (8K - 12K VNĐ)

### Pharmaceuticals (5 products)
- **MED-001** - Paracetamol 500mg (15K - 25K VNĐ)
- **MED-002** - Vitamin C 1000mg (120K - 180K VNĐ)
- **MED-003** - Khẩu trang y tế 4 lớp (45K - 70K VNĐ)
- **MED-004** - Dung dịch sát khuẩn 500ml (35K - 55K VNĐ)
- **MED-005** - Băng cá nhân (25K - 40K VNĐ)

### Stationery (5 products)
- **PEN-001** - Bút bi Thiên Long TL-079 (3K - 5K VNĐ)
- **PEN-002** - Bút gel Pentel BL77 (12K - 18K VNĐ)
- **NOTEBOOK-001** - Sổ tay Campus 200 trang (25K - 40K VNĐ)
- **PAPER-001** - Giấy A4 Double A 70gsm (85K - 120K VNĐ)
- **STAPLER-001** - Dập ghim Deli 0352 (35K - 55K VNĐ)

### Home & Living (5 products)
- **CHAIR-001** - Ghế văn phòng ergonomic (1.2M - 1.8M VNĐ)
- **DESK-001** - Bàn làm việc gỗ 120x60cm (1.5M - 2.2M VNĐ)
- **LAMP-001** - Đèn bàn LED chống cận (250K - 400K VNĐ)
- **BOTTLE-001** - Bình giữ nhiệt Lock&Lock 500ml (180K - 280K VNĐ)
- **TOWEL-001** - Khăn tắm cotton 70x140cm (120K - 200K VNĐ)

### Fashion (4 products)
- **TSHIRT-001** - Áo thun cotton nam (80K - 150K VNĐ)
- **JEANS-001** - Quần jean nam slim fit (250K - 450K VNĐ)
- **SHOES-001** - Giày thể thao Nike Air Max (1.8M - 2.5M VNĐ)
- **BAG-001** - Balo laptop 15.6 inch (350K - 550K VNĐ)

### Cosmetics (4 products)
- **SHAMPOO-001** - Dầu gội Dove 650ml (95K - 145K VNĐ)
- **SOAP-001** - Sữa tắm Lifebuoy 850ml (75K - 115K VNĐ)
- **CREAM-001** - Kem dưỡng da Olay 50g (180K - 280K VNĐ)
- **LIPSTICK-001** - Son môi Maybelline (120K - 200K VNĐ)

### Toys (3 products)
- **LEGO-001** - LEGO Classic 500 mảnh (450K - 700K VNĐ)
- **PUZZLE-001** - Tranh ghép 1000 mảnh (180K - 300K VNĐ)
- **DOLL-001** - Búp bê Barbie (250K - 400K VNĐ)

### Sports (3 products)
- **BALL-001** - Bóng đá Molten size 5 (280K - 450K VNĐ)
- **YOGA-001** - Thảm yoga TPE 6mm (250K - 400K VNĐ)
- **DUMBBELL-001** - Tạ tay 5kg (cặp) (180K - 300K VNĐ)

### Books (3 products)
- **BOOK-001** - Đắc Nhân Tâm (65K - 95K VNĐ)
- **BOOK-002** - Nhà Giả Kim (55K - 85K VNĐ)
- **BOOK-003** - Sapiens - Lược Sử Loài Người (120K - 180K VNĐ)

---

## 🤝 Partners

**Total:** 16 partners (8 suppliers + 8 customers)

### Suppliers (8)
1. **Công ty TNHH Điện Tử Việt Nam** (SUP-ELEC-001)
2. **Công ty CP Thực Phẩm Sạch** (SUP-FOOD-001)
3. **Công ty TNHH Dược Phẩm ABC** (SUP-PHAR-001)
4. **Công ty CP Văn Phòng Phẩm Thiên Long** (SUP-STAT-001)
5. **Công ty TNHH Nội Thất Hoàng Gia** (SUP-HOME-001)
6. **Công ty CP Thời Trang Việt** (SUP-FASH-001)
7. **Công ty TNHH Mỹ Phẩm Quốc Tế** (SUP-COSM-001)
8. **Công ty CP Đồ Chơi Trẻ Em** (SUP-TOYS-001)

### Customers (8)
1. **Siêu Thị Co.opMart** (CUST-RETAIL-001)
2. **Chuỗi Cửa Hàng FPT Shop** (CUST-RETAIL-002)
3. **Siêu Thị Điện Máy Xanh** (CUST-RETAIL-003)
4. **Nhà Thuốc Long Châu** (CUST-PHAR-001)
5. **Cửa Hàng Sách Fahasa** (CUST-BOOK-001)
6. **Chuỗi Gym California Fitness** (CUST-SPORT-001)
7. **Siêu Thị BigC** (CUST-RETAIL-004)
8. **Cửa Hàng Thời Trang H&M** (CUST-FASH-001)

---

## 🏭 Warehouse Structure

**Total:** 2 warehouses, 7 zones, 504 bins

### Kho Trung Tâm Hà Nội (WH-HN-001)

**4 Zones:**

#### Khu A - Điện Tử (WH-HN-001-ZA)
- 3 Aisles × 4 Racks × 6 Bins = **72 bins**

#### Khu B - Thực Phẩm (WH-HN-001-ZB)
- 3 Aisles × 4 Racks × 6 Bins = **72 bins**

#### Khu C - Dược Phẩm (WH-HN-001-ZC)
- 3 Aisles × 4 Racks × 6 Bins = **72 bins**

#### Khu D - Văn Phòng Phẩm (WH-HN-001-ZD)
- 3 Aisles × 4 Racks × 6 Bins = **72 bins**

**Subtotal:** 288 bins

### Kho Phân Phối TP.HCM (WH-HCM-001)

**3 Zones:**

#### Khu A - Thời Trang (WH-HCM-001-ZA)
- 3 Aisles × 4 Racks × 6 Bins = **72 bins**

#### Khu B - Gia Dụng (WH-HCM-001-ZB)
- 3 Aisles × 4 Racks × 6 Bins = **72 bins**

#### Khu C - Mỹ Phẩm (WH-HCM-001-ZC)
- 3 Aisles × 4 Racks × 6 Bins = **72 bins**

**Subtotal:** 216 bins

### Hierarchy
```
Warehouse
└── Zone (Khu)
    └── Aisle (Lối)
        └── Rack (Kệ)
            └── Bin (Ngăn)
```

---

## 📊 Inventory

**Total:** ~150 inventory records

### Distribution Strategy
- Each product stored in **2-5 different bins** for redundancy
- Quantities based on product type and minStock:
  - **High-value items** (laptops, phones): 10-50 units
  - **Fast-moving items** (food, stationery): 100-500 units
  - **Medium items**: 50-200 units

### Example Distribution
- **LAPTOP-001** → 3 bins (15, 22, 18 units)
- **COFFEE-001** → 5 bins (150, 200, 180, 220, 175 units)
- **MED-001** → 4 bins (80, 95, 110, 88 units)

---

## 💰 Financial Transactions

**Total:** 22 transactions over 30 days

### Expenses (10 transactions)
- **Type:** Supplier payments
- **Amount:** 10M - 60M VNĐ per transaction
- **Status:** 7 completed, 3 pending
- **Total:** ~350M VNĐ

### Income (12 transactions)
- **Type:** Customer payments
- **Amount:** 20M - 100M VNĐ per transaction
- **Status:** 9 completed, 3 pending
- **Total:** ~750M VNĐ

### Total Transaction Value
**~1.1 tỷ VNĐ** over 30 days

### Example Transactions
```
[7 days ago] Expense: 15M VNĐ - Công ty TNHH Điện Tử Việt Nam
[5 days ago] Income: 85M VNĐ - Siêu Thị Co.opMart
[2 days ago] Income: 45M VNĐ - FPT Shop
[Today] Expense: 28M VNĐ - Công ty CP Thực Phẩm Sạch (Pending)
```

---

## 🔔 Notifications

**Total:** 12 notifications

### Admin Notifications (3)
1. **Info** - "Hệ thống khởi động thành công"
2. **Warning** - "Cảnh báo tồn kho thấp (15 sản phẩm)"
3. **Success** - "Đơn hàng mới từ Co.opMart (150M VNĐ)" ✓ Read

### Manager Notifications (per manager, 2 each)
1. **Info** - "Nhiệm vụ mới: 3 phiếu nhập kho cần duyệt"
2. **Warning** - "Kiểm kê định kỳ tháng 1/2026"

---

## 🚀 Usage

### Run Seed

```bash
cd wms/server
npm run seed
```

### Expected Output
```
🌱 Starting comprehensive seed process...

✓ Wiped all collections
✓ Seeded 6 users
✓ Seeded 10 categories
✓ Seeded 50 products across 10 categories
✓ Seeded 16 partners (8 suppliers, 8 customers)
✓ Created warehouse structure: 2 warehouses, 7 zones, 504 bins
✓ Seeded ~150 inventory records across 504 bins
✓ Seeded 12 notifications
✓ Seeded 22 financial transactions

✅ Seed completed successfully!

📊 Summary:
   - Users: 6
   - Categories: 10
   - Products: 50
   - Partners: 16
   - Warehouse Bins: 504
   - Inventory Records: ~150
   - Notifications: ~12
   - Financial Transactions: 22
```

### Login Credentials

```
Admin:    admin@wms.local / 123456
Manager:  manager@wms.local / 123456
Manager2: manager2@wms.local / 123456
Staff:    staff@wms.local / 123456
Staff2:   staff2@wms.local / 123456
Staff3:   staff3@wms.local / 123456
```

### Test Scenarios

**Inventory Management:**
- 50 products across 504 bins
- Multiple locations per product
- Realistic quantities

**Receipts:**
- 8 suppliers ready to use
- Create receipts with real products
- Test approval workflow

**Deliveries:**
- 8 customers ready to use
- Create deliveries with inventory
- Test stock deduction

**Stocktake:**
- Sufficient inventory for stocktaking
- Test discrepancy detection
- Test adjustment creation

**Reports:**
- 22 transactions for financial reports
- 30-day historical data
- Mix of completed/pending status

**Notifications:**
- 12 notifications for different scenarios
- Test read/unread status
- Test filtering by type

---

## 📝 Notes

### Data Characteristics
✅ All names in **Vietnamese**  
✅ Prices in **VNĐ** matching **Vietnam market 2026**  
✅ Warehouse structure mimics **real warehouses**  
✅ Financial transactions have **realistic timestamps**  
✅ Inventory quantities **match product types**  
✅ Partner names are **realistic Vietnamese companies**  

### Data Quality
- **Realistic:** Real brand names and products
- **Diverse:** 10 categories, 50 products
- **Scalable:** 504 bins for growth
- **Testable:** Enough data for all features
- **Localized:** Vietnamese context

---

## 🔗 Related Files

- **PROJECT_GUIDE.md** - Complete testing guide
- **README.md** - Project overview
- **wms/server/scripts/seed.ts** - Seed script source

---

*Document maintained by: Antigravity AI Assistant*  
*Seed Version: 2.0*  
*Last Updated: 2026-01-04*
