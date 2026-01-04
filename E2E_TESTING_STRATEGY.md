# E2E Testing Strategy - WMS Project

## 🎯 Mục Tiêu

Thiết lập End-to-End testing để đảm bảo toàn bộ hệ thống WMS hoạt động đúng từ góc nhìn người dùng cuối, bao gồm cả Frontend, Backend, và Database.

---

## 🛠 Công Cụ

**Framework:** Playwright
- ✅ Hỗ trợ đa trình duyệt (Chromium, Firefox, WebKit)
- ✅ Auto-wait và retry mechanisms
- ✅ Screenshot và video recording
- ✅ Network interception
- ✅ TypeScript support

---

## 📋 Test Scenarios

### Scenario 1: Luồng Đăng Nhập (Authentication Flow)
**Mục tiêu:** Kiểm tra quy trình đăng nhập và phân quyền

**Test Cases:**
1. ✅ Đăng nhập thành công với Admin credentials
2. ✅ Đăng nhập thành công với Manager credentials
3. ✅ Đăng nhập thành công với Staff credentials
4. ✅ Đăng nhập thất bại với credentials sai
5. ✅ Redirect đúng sau khi đăng nhập
6. ✅ Token được lưu và sử dụng đúng cách

**Steps:**
```typescript
test('Admin login flow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.fill('[name="email"]', 'admin@wms.local');
  await page.fill('[name="password"]', '123456');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
});
```

---

### Scenario 2: Luồng Nhập Hàng (Receipt Flow)
**Mục tiêu:** Kiểm tra toàn bộ quy trình nhập hàng vào kho

**Test Cases:**
1. ✅ Tạo phiếu nhập kho mới
2. ✅ Thêm sản phẩm vào phiếu nhập
3. ✅ Duyệt phiếu nhập (Manager/Admin)
4. ✅ Kiểm tra tồn kho tăng lên
5. ✅ Kiểm tra giao dịch chi (Expense) được tạo tự động
6. ✅ Kiểm tra báo cáo tài chính cập nhật

**Steps:**
```typescript
test('Complete receipt flow', async ({ page }) => {
  // 1. Login as Admin
  await loginAsAdmin(page);
  
  // 2. Navigate to Receipts
  await page.click('text=Receipts');
  
  // 3. Create new receipt
  await page.click('text=New Receipt');
  await page.fill('[name="code"]', 'REC-TEST-001');
  await page.selectOption('[name="partnerId"]', { label: 'Supplier A' });
  
  // 4. Add items
  await page.click('text=Add Item');
  await page.selectOption('[name="productId"]', { label: 'Product A' });
  await page.fill('[name="quantity"]', '100');
  await page.fill('[name="price"]', '50');
  
  // 5. Submit
  await page.click('button:has-text("Create")');
  await expect(page.locator('text=Receipt created')).toBeVisible();
  
  // 6. Approve
  await page.click('button:has-text("Approve")');
  await expect(page.locator('text=approved')).toBeVisible();
  
  // 7. Verify inventory
  await page.click('text=Inventory');
  await expect(page.locator('text=Product A')).toContainText('100');
});
```

---

### Scenario 3: Luồng Xuất Hàng (Delivery Flow)
**Mục tiêu:** Kiểm tra quy trình xuất hàng ra khỏi kho

**Test Cases:**
1. ✅ Tạo phiếu xuất kho
2. ✅ Chọn sản phẩm và số lượng
3. ✅ Kiểm tra tồn kho đủ
4. ✅ Duyệt phiếu xuất
5. ✅ Kiểm tra tồn kho giảm
6. ✅ Kiểm tra giao dịch thu (Revenue) được tạo

---

### Scenario 4: Luồng Kiểm Kê (Stocktake Flow)
**Mục tiêu:** Kiểm tra quy trình kiểm kê và điều chỉnh tồn kho

**Test Cases:**
1. ✅ Tạo phiếu kiểm kê
2. ✅ Nhập số lượng thực tế
3. ✅ Hiển thị chênh lệch (delta)
4. ✅ Approve stocktake
5. ✅ Apply adjustment
6. ✅ Kiểm tra tồn kho cập nhật
7. ✅ Kiểm tra transaction điều chỉnh được tạo

**Steps:**
```typescript
test('Stocktake flow with adjustment', async ({ page }) => {
  await loginAsManager(page);
  
  // Create stocktake
  await page.click('text=Stocktake');
  await page.click('text=New Stocktake');
  await page.fill('[name="code"]', 'ST-TEST-001');
  
  // Add item with discrepancy
  await page.click('text=Add Item');
  await page.selectOption('[name="productId"]', { label: 'Product A' });
  await page.fill('[name="countedQty"]', '95'); // System: 100, Counted: 95, Delta: -5
  
  // Submit
  await page.click('button:has-text("Create")');
  
  // Approve
  await page.click('button:has-text("Approve")');
  await expect(page.locator('text=approved')).toBeVisible();
  
  // Apply
  await page.click('button:has-text("Apply")');
  await expect(page.locator('text=applied')).toBeVisible();
  
  // Verify inventory updated
  await page.click('text=Inventory');
  await expect(page.locator('text=Product A')).toContainText('95');
});
```

---

### Scenario 5: Luồng Báo Cáo (Reporting Flow)
**Mục tiêu:** Kiểm tra chức năng báo cáo và dashboard

**Test Cases:**
1. ✅ Xem dashboard với metrics
2. ✅ Xem báo cáo tồn kho
3. ✅ Xem báo cáo giao dịch
4. ✅ Filter và search
5. ✅ Export PDF/Excel
6. ✅ Charts hiển thị đúng

---

### Scenario 6: Luồng Quản Lý Kho (Warehouse Management)
**Mục tiêu:** Kiểm tra quản lý cấu trúc kho

**Test Cases:**
1. ✅ Tạo warehouse mới
2. ✅ Tạo zones, aisles, racks, bins
3. ✅ Di chuyển hàng giữa các vị trí
4. ✅ Xem inventory theo location
5. ✅ Kiểm tra hierarchy

---

## 🔧 Setup & Configuration

### 1. Cài đặt Playwright
```bash
cd wms
npm init playwright@latest e2e
```

### 2. Cấu hình playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false, // Run sequentially for E2E
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for E2E
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 3. Helpers & Fixtures
```typescript
// e2e/helpers/auth.ts
export async function loginAsAdmin(page) {
  await page.goto('/');
  await page.fill('[name="email"]', 'admin@wms.local');
  await page.fill('[name="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/);
}

export async function loginAsManager(page) {
  await page.goto('/');
  await page.fill('[name="email"]', 'manager@wms.local');
  await page.fill('[name="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/);
}
```

---

## 📊 Test Coverage Goals

### Critical Paths (Must Have)
- ✅ Authentication & Authorization
- ✅ Receipt Flow (Nhập hàng)
- ✅ Delivery Flow (Xuất hàng)
- ✅ Stocktake Flow (Kiểm kê)

### Important Paths (Should Have)
- ⏳ Warehouse Management
- ⏳ Reporting & Dashboard
- ⏳ User Management
- ⏳ Partner Management

### Nice to Have
- ⏳ Notifications
- ⏳ Settings
- ⏳ Audit Logs

---

## 🚀 Execution Plan

### Phase 1: Setup (Day 1)
- [x] Install Playwright
- [ ] Configure playwright.config.ts
- [ ] Create helper functions
- [ ] Setup test data seeding

### Phase 2: Critical Flows (Day 2-3)
- [ ] Write Authentication tests
- [ ] Write Receipt flow tests
- [ ] Write Delivery flow tests
- [ ] Write Stocktake flow tests

### Phase 3: Extended Coverage (Day 4-5)
- [ ] Write Warehouse management tests
- [ ] Write Reporting tests
- [ ] Write User management tests

### Phase 4: CI/CD Integration (Day 6)
- [ ] Add E2E to CI pipeline
- [ ] Configure test reporting
- [ ] Setup failure notifications

---

## 📈 Success Metrics

**Target:**
- ✅ 100% critical paths covered
- ✅ 80% important paths covered
- ✅ All tests passing
- ✅ < 5 minutes total execution time
- ✅ < 5% flakiness rate

**Current Status:**
- 🔄 Setup in progress
- ⏳ 0% coverage

---

## 🐛 Known Issues & Workarounds

### Issue 1: Database State
**Problem:** Tests may interfere with each other
**Solution:** Use test database or reset DB before each test

### Issue 2: Timing Issues
**Problem:** Elements not ready
**Solution:** Use Playwright's auto-wait, avoid hardcoded waits

### Issue 3: Authentication State
**Problem:** Re-login for each test is slow
**Solution:** Use Playwright's storageState to save auth

---

## 📝 Next Steps

1. ✅ Complete Playwright installation
2. ⏳ Create test helpers and fixtures
3. ⏳ Write first E2E test (Login flow)
4. ⏳ Expand to critical business flows
5. ⏳ Integrate with CI/CD

---

*Document created: 2026-01-04*  
*Last updated: 2026-01-04*
