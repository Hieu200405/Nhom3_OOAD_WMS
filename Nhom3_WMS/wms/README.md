# Hệ thống Quản lý Kho (WMS)
Monorepo gồm frontend Vite/React, backend Express + TypeScript/MongoDB và gói dùng chung `shared`. Ứng dụng hỗ trợ quản lý nhập/xuất, kiểm kê, điều chỉnh tồn, báo cáo và phân quyền (Admin/Manager/Staff) với xác thực JWT.

## Cấu trúc thư mục
```
wms/
 ├─ frontend/   # Ứng dụng React (Vite + Tailwind)
 ├─ server/     # API Express + MongoDB, Swagger, Jest
 ├─ shared/     # Hằng số / schema dùng chung
 ├─ docker-compose.yml
 ├─ scripts/    # setup-env, tiện ích
 └─ package.json
```

## Yêu cầu
- Node.js >= 18, npm 9+.
- Docker Desktop (tùy chọn, nếu chạy qua docker-compose).
- Nếu chạy local không dùng Docker: cần MongoDB đang lắng nghe `mongodb://127.0.0.1:27017`.

## Chuẩn bị biến môi trường
Chạy một lần để tạo file `.env` từ mẫu:
```bash
cd wms
npm install
npm run setup
```
Sau đó sửa các file:
- `server/.env` — cấu hình backend.
- `frontend/.env` — cấu hình URL API cho frontend.

### server/.env (mẫu có sẵn)
- `PORT` (mặc định 4000) — cổng API.
- `MONGODB_URI` — chuỗi kết nối MongoDB.
- `CLIENT_URL` — origin cho CORS, mặc định `http://localhost:5173`.
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — **phải** đổi thành chuỗi bí mật riêng.
- `JWT_EXPIRES`, `JWT_REFRESH_EXPIRES` — thời gian sống access/refresh token (ví dụ `1h`, `7d`).
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` — giới hạn tốc độ request.
- `BCRYPT_ROUNDS` — số vòng băm mật khẩu.
- `UPLOAD_DIR` — thư mục lưu file upload (tự tạo nếu chưa có).
- `DISPOSAL_BOARD_THRESHOLD` — ngưỡng giá trị yêu cầu duyệt hủy bởi hội đồng.
- `DEFAULT_PAGE`, `DEFAULT_LIMIT` — phân trang mặc định.

### frontend/.env (mẫu có sẵn)
- `VITE_API_BASE_URL` — URL gốc của API, ví dụ `http://localhost:4000/api/v1`.
- `VITE_API_URL` — fallback tùy chọn (để trống nếu không dùng).
- `VITE_USE_MOCK` — `false` để gọi API thật, `true` để dùng mock handler.

## Chạy nhanh với Docker
```bash
cd wms
npm run docker:up        # build & start mongo + server + frontend
```
Dịch vụ:
- API: http://localhost:4000/api/v1
- Swagger UI: http://localhost:4000/api-docs
- Web app: http://localhost:5173

Dừng stack: `npm run docker:down`. Xem log: `npm run docker:logs`.

## Chạy local (không Docker)
```bash
cd wms
npm install
npm run setup            # tạo .env từ .env.example nếu chưa có
npm run dev              # song song server (4000) + frontend (5173)
```
Chạy riêng lẻ:
- Backend: `npm run dev:server`
- Frontend: `npm run dev:frontend`

## Seed dữ liệu demo
```bash
npm run seed
```
Tài khoản mẫu được tạo:
- Admin: `admin@wms.local` / `123456`
- Manager: `manager@wms.local` / `123456`
- Staff: `staff@wms.local` / `123456`

## Kiểm thử & lint
- Chạy toàn bộ test trong workspace backend: `npm run test --workspace server`
- Lint tất cả workspace: `npm run lint`

## Tài liệu & endpoints
- Health check: `GET /health`
- API gốc: `/api/v1`
- Swagger UI: `http://localhost:4000/api-docs`
- Uploads tĩnh: `/uploads/*`

## Triển khai nhanh
- Backend: `npm --prefix server run build` sau đó chạy `node server/dist/index.js` (cần biến môi trường như trong `server/.env`).
- Frontend: `npm --prefix frontend run build`, deploy thư mục `frontend/dist`.

## Script hữu ích
- `npm run build` — build tất cả workspace.
- `npm run docker:up|down|logs` — tiện ích Docker Compose.
- `npm run prepare` — cài đặt husky (tự chạy khi `npm install`).
