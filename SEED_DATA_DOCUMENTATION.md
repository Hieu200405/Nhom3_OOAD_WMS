# 📊 Tài Liệu Dữ Liệu Seed - WMS Project

## 🎯 Tổng Quan

File seed data đã được **nâng cấp toàn diện** với dữ liệu **thực tế, đa dạng và phong phú** để mô phỏng một hệ thống quản lý kho thực tế tại Việt Nam.

---

## 📈 So Sánh Trước và Sau

| Thành Phần | Trước | Sau | Cải Thiện |
|------------|-------|-----|-----------|
| **Users** | 3 | 6 | +100% |
| **Categories** | 5 | 10 | +100% |
| **Products** | 20 (generic) | 50 (realistic) | +150% |
| **Partners** | 4 | 16 | +300% |
| **Warehouses** | 1 | 2 | +100% |
| **Zones** | 2 | 7 | +250% |
| **Bins** | 32 | ~500 | +1,462% |
| **Inventory Records** | 30 | ~150 | +400% |
| **Notifications** | 2 | ~12 | +500% |
| **Financial Transactions** | 2 | 22 | +1,000% |

---

## 👥 Users (6 người dùng)

### Administrators
- **Nguyễn Văn An** - `admin@wms.local` (Admin)

### Managers
- **Trần Thị Bình** - `manager@wms.local` (Manager)
- **Lê Hoàng Cường** - `manager2@wms.local` (Manager)

### Staff
- **Phạm Minh Đức** - `staff@wms.local` (Staff)
- **Võ Thị Hoa** - `staff2@wms.local` (Staff)
- **Đặng Quốc Khánh** - `staff3@wms.local` (Staff)

**Password:** `123456` (tất cả users)

---

## 📦 Categories (10 danh mục)

1. **Điện tử - Công nghệ** (ELEC)
2. **Thực phẩm & Đồ uống** (FOOD)
3. **Dược phẩm** (PHAR)
4. **Văn phòng phẩm** (STAT)
5. **Gia dụng** (HOME)
6. **Thời trang** (FASH)
7. **Mỹ phẩm** (COSM)
8. **Đồ chơi** (TOYS)
9. **Thể thao** (SPOR)
10. **Sách & Báo** (BOOK)

---

## 🛍️ Products (50 sản phẩm thực tế)

### Điện tử (8 sản phẩm)
- Laptop Dell Inspiron, HP Pavilion
- iPhone 14 Pro, Samsung Galaxy S23
- Tai nghe Sony, Màn hình LG
- Chuột Logitech, Bàn phím Keychron

### Thực phẩm (8 sản phẩm)
- Cà phê Trung Nguyên, Highlands
- Gạo ST25, Mì Hảo Hảo
- Sữa Vinamilk, Dầu ăn Neptune

### Và 34 sản phẩm khác...

---

## 🏭 Warehouse Structure

- **2 Warehouses:** Hà Nội + TP.HCM
- **7 Zones:** Phân theo loại hàng
- **504 Bins:** Tổng cộng
- **Hierarchy:** Warehouse → Zone → Aisle → Rack → Bin

---

## 💰 Financial Transactions

- **22 giao dịch** trong 30 ngày qua
- **10 Expenses:** 10M - 60M VNĐ
- **12 Income:** 20M - 100M VNĐ
- **Tổng:** ~1.5 tỷ VNĐ

---

## 🚀 Cách Sử Dụng

```bash
cd wms/server
npm run seed
```

**Login:** admin@wms.local / 123456

---

*Version 2.0 - Realistic Vietnamese WMS Data*
