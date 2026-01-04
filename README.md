# Hệ thống Quản lý Kho (WMS) - Nâng Cao

Hệ thống quản lý kho toàn diện được xây dựng theo kiến trúc Monorepo hiện đại, tối ưu hóa cho hiệu suất, khả năng mở rộng và trải nghiệm người dùng.

## 🚀 Tính năng nổi bật

*   **Quản lý tồn kho thời gian thực:** Theo dõi chính xác số lượng hàng hóa tại từng vị trí (Zone, Aisle, Rack, Bin).
*   **Quy trình vận hành chuẩn:** Nhập hàng, Xuất hàng, Kiểm kê, Điều chỉnh tồn kho, Trả hàng, Hủy hàng.
*   **Tài chính tích hợp:** Tự động ghi nhận doanh thu, chi phí từ các hoạt động nhập xuất và thanh toán.
*   **Báo cáo thông minh:** Dashboard trực quan, biểu đồ thống kê, xuất báo cáo PDF.
*   **Hệ thống thông báo:** Cảnh báo tồn kho thấp, thông báo trạng thái đơn hàng realtime.
*   **Phân quyền chặt chẽ:** Admin, Manager, Staff với quyền hạn được kiểm soát chi tiết (RBAC).
*   **Bảo mật cao:** Xác thực JWT, Refresh Token, mã hóa mật khẩu Bcrypt.

## 🛠 Công nghệ sử dụng

*   **Frontend:** React (Vite), TailwindCSS, Recharts, Lucide Icons.
*   **Backend:** Node.js, Express, TypeScript, Mongoose (MongoDB).
*   **Shared:** Gói thư viện chia sẻ type, enum, schema validation (Zod) giữa FE và BE.
*   **DevOps:** Docker, Docker Compose, ESLint, Prettier, Husky.

## 📂 Cấu trúc dự án (Monorepo)

```
wms/
 ├─ frontend/   # Giao diện người dùng (React 18)
 ├─ server/     # API Server (Express + TypeScript)
 ├─ shared/     # Thư viện dùng chung (Types, Schemas, Constants)
 ├─ docker-compose.yml
 ├─ scripts/    # Scripts tiện ích
 └─ package.json
```

## ⚙️ Cài đặt và Chạy ứng dụng

### 1. Chuẩn bị môi trường
*   Node.js >= 18
*   MongoDB (hoặc Docker)

### 2. Cài đặt dependencies
```bash
cd wms
npm install
npm run setup # Tạo file .env từ mẫu .env.example
```

### 3. Cấu hình
Kiểm tra file `server/src/config/env.ts` hoặc `.env` để điều chỉnh các thông số:
*   **Rate Limit:** Đã được tối ưu lên 1000 req/15p cho môi trường phát triển.
*   **Cổng API:** Mặc định 4001 (hoặc theo file .env).

### 4. Khởi tạo dữ liệu mẫu (Seed Data)
Để có dữ liệu ban đầu (Sản phẩm, Kho, Đối tác, Tài chính, Thông báo...):
```bash
npm run seed
```
*Tài khoản mặc định:*
*   **Admin:** `admin@wms.local` / `123456`
*   **Manager:** `manager@wms.local` / `123456`
*   **Staff:** `staff@wms.local` / `123456`

### 5. Chạy ứng dụng (Dev Mode)
```bash
npm run dev
```
*   **Frontend:** http://localhost:5173
*   **Backend API:** http://localhost:4001/api/v1
*   **Swagger Docs:** http://localhost:4001/api-docs

## 🐳 Chạy với Docker
```bash
npm run docker:up
```

## 🧪 Testing & Quality Assurance

### Chạy Tests

**Backend Tests (Jest + Supertest):**
```bash
cd wms/server
npm test
```

**Frontend Tests (Vitest + React Testing Library):**
```bash
cd wms/frontend
npm test
```

### Kết Quả Kiểm Thử

✅ **Backend:** 8 test suites, 21 tests - **100% PASSED**  
✅ **Frontend:** 5 test files, 14 tests - **100% PASSED**

**Modules đã kiểm thử:**
- Authentication & Authorization
- Inventory Management
- Product CRUD Operations
- Receipt & Delivery Workflows
- Stocktake & Adjustments
- Warehouse Management
- Reports & Analytics
- UI Components & User Flows

### Tài Liệu Kiểm Thử

Xem chi tiết tại:
- 📚 [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) - Hướng dẫn toàn diện về dự án, testing, E2E
- 📊 [SEED_DATA.md](./SEED_DATA.md) - Tài liệu dữ liệu seed chi tiết

## 📚 Tài liệu API
Hệ thống cung cấp tài liệu API chuẩn OpenAPI (Swagger) tại đường dẫn `/api-docs` khi server đang chạy.

## 🛡️ Tác giả & Bản quyền
Dự án được thực hiện bởi Nhóm 3 - OOAD.
