# Chiến lược Kiểm thử Chất lượng Toàn diện (QA Strategy)

Để đảm bảo hệ thống WMS vận hành hoàn hảo và loại bỏ mọi lỗi tiềm tàng, chúng ta sẽ áp dụng chiến lược kiểm thử đa tầng (Testing Pyramid).

## 1. Backend Testing (API & Logic) - Đã có nền tảng
Hiện tại Backend đã sử dụng **Jest** và **Supertest**.
*   **Unit Tests:** Kiểm tra logic các Service (tính toán tồn kho, validate dữ liệu).
*   **Integration Tests:** Kiểm tra toàn bộ luồng API (Request -> Controller -> DB -> Response).

**Kế hoạch mở rộng:**
*   Chạy lại bộ test hiện có để đảm bảo core functions ổn định.
*   Viết thêm test cho các module mới: `Financials`, `Notifications`, `Stocktake`.
*   Kiểm tra các trường hợp biên (Edge cases): Tồn kho âm, nhập số liệu sai, lỗi kết nối DB.

## 2. Frontend Testing (Interface & User Flow) - Cần thiết lập mới
Frontend hiện chưa có công cụ kiểm thử tự động. Chúng ta sẽ tích hợp **Vitest** và **React Testing Library**.
*   **Unit Tests:** Kiểm tra các hàm utility (`formatCurrency`, `formatDate`) và các components nhỏ (Button, Input).
*   **Component Tests:** Đảm bảo `ReceiptPage`, `Dashboard` render đúng dữ liệu và xử lý state loading/error chính xác.

## 3. End-to-End (E2E) Testing - Tiêu chuẩn vàng
Đây là mức kiểm thử quan trọng nhất để mô phỏng hành vi người dùng thật. Đề xuất sử dụng **Playwright** hoặc **Cypress**.
*   **Scenario 1: Luồng Nhập hàng:**
    1. Đăng nhập Admin.
    2. Tạo Phiếu nhập kho (Receipt).
    3. Duyệt phiếu -> Nhập kho hoàn tất.
    4. Kiểm tra Tồn kho tăng lên & Giao dịch chi (Expense) được tạo tự động.
*   **Scenario 2: Luồng Kiểm kê:**
    1. Tạo phiếu kiểm kê -> Ghi nhận lệch -> Apply.
    2. Kiểm tra tồn kho cập nhật & Transaction điều chỉnh được tạo.

## 4. Manual Testing (Checklist thủ công)
Bên cạnh tự động hóa, cần thực hiện kiểm tra thủ công các yếu tố UI/UX:
*   Responsive trên Mobile/Tablet.
*   Trải nghiệm người dùng khi mạng chậm (Loading states).
*   Kiểm tra chính tả, màu sắc, căn chỉnh giao diện.

---

## Lộ trình thực hiện ngay:
1.  **Bước 1:** Chạy toàn bộ test Backend hiện tại để "bắt mạch" hệ thống. (✅ Hoàn thành)
2.  **Bước 2:** Cài đặt môi trường test cho Frontend (Vitest). (✅ Hoàn thành)
3.  **Bước 3:** Viết 1 test case mẫu cho luồng quan trọng nhất (LoginPage, TransactionsPage). (✅ Hoàn thành)
4.  **Bước 4:** Mở rộng độ phủ test cho các module Inventory và Warehouse.
