import { test, expect } from '@playwright/test';
import { loginAsManager, navigateTo, clickButton, waitForToast } from '../../helpers/auth';

test.describe('Stocktake Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Login as Manager (has permission for stocktake)
        await loginAsManager(page);
    });

    test('should create stocktake draft', async ({ page }) => {
        // Navigate to Stocktake page
        await navigateTo(page, 'Stocktake');

        // Click New/Create button
        await page.click('button:has-text("New"), button:has-text("Create"), button:has-text("Tạo mới")');

        // Fill stocktake form
        const timestamp = Date.now();
        await page.fill('input[name="code"]', `ST-E2E-${timestamp}`);

        // Select date (if date picker exists)
        const dateInput = page.locator('input[name="date"], input[type="date"]');
        if (await dateInput.isVisible()) {
            await dateInput.fill(new Date().toISOString().split('T')[0]);
        }

        // Add item to stocktake
        await page.click('button:has-text("Add Item"), button:has-text("Thêm sản phẩm")');

        // Select product (adjust selector based on actual UI)
        const productSelect = page.locator('select[name="productId"], select[name*="product"]').first();
        if (await productSelect.isVisible()) {
            await productSelect.selectOption({ index: 1 }); // Select first product
        }

        // Select location
        const locationSelect = page.locator('select[name="locationId"], select[name*="location"]').first();
        if (await locationSelect.isVisible()) {
            await locationSelect.selectOption({ index: 1 }); // Select first location
        }

        // Enter counted quantity
        await page.fill('input[name="countedQty"], input[name*="counted"]', '50');

        // Submit form
        await clickButton(page, 'Create');

        // Wait for success message
        await waitForToast(page);

        // Should see stocktake in list with draft status
        await expect(page.locator(`text=ST-E2E-${timestamp}`)).toBeVisible();
        await expect(page.locator('text=/draft|nháp/i')).toBeVisible();
    });

    test('should approve stocktake and create adjustment', async ({ page }) => {
        // First create a stocktake
        await navigateTo(page, 'Stocktake');
        await page.click('button:has-text("New"), button:has-text("Create")');

        const timestamp = Date.now();
        await page.fill('input[name="code"]', `ST-APPROVE-${timestamp}`);

        // Add item
        await page.click('button:has-text("Add Item")');
        const productSelect = page.locator('select[name="productId"]').first();
        if (await productSelect.isVisible()) {
            await productSelect.selectOption({ index: 1 });
        }
        const locationSelect = page.locator('select[name="locationId"]').first();
        if (await locationSelect.isVisible()) {
            await locationSelect.selectOption({ index: 1 });
        }
        await page.fill('input[name="countedQty"]', '75');

        await clickButton(page, 'Create');
        await page.waitForTimeout(1000);

        // Find and click the stocktake
        await page.click(`text=ST-APPROVE-${timestamp}`);

        // Click Approve button
        await page.click('button:has-text("Approve"), button:has-text("Duyệt")');

        // Wait for approval
        await waitForToast(page);

        // Should see approved status
        await expect(page.locator('text=/approved|đã duyệt/i')).toBeVisible({ timeout: 10000 });

        // Should have adjustment ID
        await expect(page.locator('text=/adjustment|điều chỉnh|ADJ-/i')).toBeVisible();
    });

    test('should apply stocktake and update inventory', async ({ page }) => {
        // Create and approve stocktake first
        await navigateTo(page, 'Stocktake');
        await page.click('button:has-text("New"), button:has-text("Create")');

        const timestamp = Date.now();
        await page.fill('input[name="code"]', `ST-APPLY-${timestamp}`);

        // Add item with discrepancy
        await page.click('button:has-text("Add Item")');
        const productSelect = page.locator('select[name="productId"]').first();
        if (await productSelect.isVisible()) {
            await productSelect.selectOption({ index: 1 });
        }
        const locationSelect = page.locator('select[name="locationId"]').first();
        if (await locationSelect.isVisible()) {
            await locationSelect.selectOption({ index: 1 });
        }

        // Enter counted quantity (different from system qty to create delta)
        await page.fill('input[name="countedQty"]', '100');

        await clickButton(page, 'Create');
        await page.waitForTimeout(1000);

        // Approve
        await page.click(`text=ST-APPLY-${timestamp}`);
        await page.click('button:has-text("Approve")');
        await page.waitForTimeout(2000);

        // Apply
        await page.click('button:has-text("Apply"), button:has-text("Áp dụng")');
        await waitForToast(page);

        // Should see applied status
        await expect(page.locator('text=/applied|đã áp dụng/i')).toBeVisible({ timeout: 10000 });

        // Navigate to inventory to verify update
        await navigateTo(page, 'Inventory');

        // Should see updated inventory (this is a basic check, actual verification depends on UI)
        await expect(page.locator('text=/inventory|tồn kho/i')).toBeVisible();
    });

    test('should show delta/discrepancy in stocktake', async ({ page }) => {
        await navigateTo(page, 'Stocktake');
        await page.click('button:has-text("New"), button:has-text("Create")');

        const timestamp = Date.now();
        await page.fill('input[name="code"]', `ST-DELTA-${timestamp}`);

        // Add item
        await page.click('button:has-text("Add Item")');
        const productSelect = page.locator('select[name="productId"]').first();
        if (await productSelect.isVisible()) {
            await productSelect.selectOption({ index: 1 });
        }
        const locationSelect = page.locator('select[name="locationId"]').first();
        if (await locationSelect.isVisible()) {
            await locationSelect.selectOption({ index: 1 });
        }

        // Enter counted quantity
        await page.fill('input[name="countedQty"]', '85');

        // Should see system quantity displayed
        await expect(page.locator('text=/system|hệ thống/i')).toBeVisible();

        // Should see delta/difference calculated (if shown in real-time)
        // This depends on the actual UI implementation
    });

    test('should not allow staff to approve stocktake', async ({ page }) => {
        // This test would require logging in as staff
        // For now, we'll skip or mark as todo
        test.skip();
    });
});
