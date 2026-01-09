import { test, expect } from '@playwright/test';

test.describe('Receipt (Nhập kho) Workflow', () => {

    test.beforeEach(async ({ page }) => {
        // Login as Staff
        await page.goto('/');
        await page.locator('input[type="text"], input:not([type="password"])').first().fill('staff@wms.local');
        await page.locator('input[type="password"]').fill('123456');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*\/dashboard/);
    });

    test('should create partial receipt and approve it', async ({ page }) => {
        console.log('Test started: Navigating to Receipts');

        // 1. Navigate to Receipts
        await page.click('text=Nhập kho');
        await expect(page).toHaveURL(/.*\/receipts/);

        // 2. Click Create to open Modal
        await page.waitForTimeout(1000);
        console.log('Opening Create Modal...');

        // Setup API wait
        const partnersPromise = page.waitForResponse((response) => response.url().includes('/partners') && response.status() === 200);
        const productsPromise = page.waitForResponse((response) => response.url().includes('/products') && response.status() === 200);

        await page.click('button:has-text("Thêm phiếu nhập"), button:has-text("Tạo mới")');

        console.log('Waiting for API data...');
        // Wait for Modal and API data
        await page.waitForSelector('form#receipt-form', { state: 'visible' });
        await Promise.all([partnersPromise, productsPromise]);
        console.log('API data loaded.');

        // 3. Fill Form (Modal)
        // Select Supplier
        const supplierSelect = page.locator('label', { hasText: 'Nhà cung cấp' }).locator('select');
        await expect(supplierSelect).toBeVisible();
        await supplierSelect.selectOption({ index: 1 });
        console.log('Supplier selected.');

        // Select Product
        const productSelect = page.locator('label', { hasText: 'Product' }).locator('select');
        await productSelect.selectOption({ index: 1 });
        console.log('Product selected.');

        // Input Quantity
        await page.locator('label', { hasText: 'Quantity' }).locator('input').fill('50');

        // Input Price
        await page.locator('label', { hasText: 'Unit price' }).locator('input').fill('20000');

        // 4. Save
        console.log('Saving...');
        await page.click('button[form="receipt-form"]');

        // Wait for success toast
        await expect(page.locator('text=Đã lưu thành công')).toBeVisible();
        console.log('Receipt saved.');

        // 5. Verify and Detail
        // Check if new receipt appears in the table (first row)
        // Refresh to be safe or wait for socket/fetch
        await page.reload();
        await expect(page.locator('tbody tr').first()).toBeVisible();

        // Go to detail
        await page.locator('tbody tr').first().click();
        // The detail button is specific: "Detail" (Hardcoded in ReceiptsPage.jsx column render)
        await page.locator('button:has-text("Detail")').first().click();
        await expect(page).toHaveURL(/.*\/receipts\/[a-zA-Z0-9]+/);

        // 6. Approve
        console.log('Approving...');
        // Wait for detail page load
        await page.waitForSelector('text=Approve');
        await page.click('button:has-text("Approve")');

        // 7. Verify Status Changed
        // Toast "Đã cập nhật trạng thái"
        await expect(page.locator('text=Đã cập nhật trạng thái')).toBeVisible();
        // Badge should change. "Approve" -> status becomes APPROVED -> Badge shows "Approved" or translation?
        // StatusBadge probably translates. "receipts.status.Approved" -> "Đã duyệt"
        await expect(page.locator('text=Đã duyệt')).toBeVisible();
        console.log('Receipt approved. Test Complete.');
    });
});
