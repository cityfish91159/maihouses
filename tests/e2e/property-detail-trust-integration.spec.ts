import { test, expect } from '@playwright/test';

/**
 * PropertyDetailPage TrustServiceBanner E2E Integration Tests
 *
 * 測試完整用戶流程：
 * - 頁面載入
 * - 橫幅顯示
 * - 按鈕互動
 * - Toast 通知
 */

test.describe('PropertyDetailPage - TrustServiceBanner Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to property detail page
    await page.goto('/maihouses/property/MH-100001');
  });

  test('應該顯示未開啟狀態橫幅並可以點擊要求開啟', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check banner is visible
    const banner = page.locator('text=本物件尚未開啟安心留痕服務');
    await expect(banner).toBeVisible();

    // Check button exists
    const requestButton = page.getByRole('button', { name: /要求房仲開啟安心留痕服務/ });
    await expect(requestButton).toBeVisible();

    // Click button
    await requestButton.click();

    // Check toast notification
    const successToast = page.locator('text=要求已送出');
    await expect(successToast).toBeVisible({ timeout: 3000 });
  });

  test('trustEnabled=true 時應該顯示已開啟狀態並可以點擊了解更多', async ({ page, context }) => {
    // Mock trustEnabled=true
    await page.route('**/api/property/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          publicId: 'MH-100001',
          title: '測試物件',
          price: 12800000,
          trustEnabled: true,
          address: '台北市信義區',
          images: ['https://example.com/image.jpg'],
          size: 30,
          rooms: 2,
          halls: 1,
          agent: {
            id: 'agent-001',
            name: '測試經紀人',
          },
        }),
      });
    });

    await page.reload();

    // Check banner is visible
    const banner = page.locator('text=本物件已開啟安心留痕服務');
    await expect(banner).toBeVisible();

    // Check "了解更多" button
    const learnMoreButton = page.getByRole('button', { name: /開啟安心留痕說明頁面/ });
    await expect(learnMoreButton).toBeVisible();

    // Listen for popup
    const popupPromise = context.waitForEvent('page');
    await learnMoreButton.click();

    // Verify new tab opened
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/\/maihouses\/trust-room/);
  });

  test('按鈕點擊時應該顯示 loading 狀態', async ({ page }) => {
    const requestButton = page.getByRole('button', { name: /要求房仲開啟安心留痕服務/ });

    // Slow down network to see loading state
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await requestButton.click();

    // Check loading state
    await expect(requestButton).toHaveAttribute('aria-busy', 'true');
    await expect(requestButton).toBeDisabled();
  });

  test('響應式設計：手機版應該顯示縱向佈局', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const banner = page.locator('[role="region"][aria-label*="安心留痕服務"]').first();
    await expect(banner).toBeVisible();

    // Check button is full width on mobile
    const button = banner.locator('button').first();
    const buttonBox = await button.boundingBox();
    const bannerBox = await banner.boundingBox();

    if (buttonBox && bannerBox) {
      expect(buttonBox.width).toBeGreaterThan(bannerBox.width * 0.9);
    }
  });

  test('響應式設計：桌面版應該顯示橫向佈局', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    const banner = page.locator('[role="region"][aria-label*="安心留痕服務"]').first();
    await expect(banner).toBeVisible();

    // Check button is auto width on desktop
    const button = banner.locator('button').first();
    const buttonBox = await button.boundingBox();
    const bannerBox = await banner.boundingBox();

    if (buttonBox && bannerBox) {
      expect(buttonBox.width).toBeLessThan(bannerBox.width * 0.5);
    }
  });

  test('無障礙：鍵盤導航應該可以操作按鈕', async ({ page }) => {
    // Focus button with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const requestButton = page.getByRole('button', { name: /要求房仲開啟安心留痕服務/ });
    await expect(requestButton).toBeFocused();

    // Activate with Enter
    await page.keyboard.press('Enter');

    // Check toast notification
    const successToast = page.locator('text=要求已送出');
    await expect(successToast).toBeVisible({ timeout: 3000 });
  });

  test('無障礙：Screen Reader 應該可以讀取橫幅內容', async ({ page }) => {
    const banner = page.locator('[role="region"][aria-label*="安心留痕服務"]').first();

    // Check ARIA attributes
    await expect(banner).toHaveAttribute('role', 'region');
    await expect(banner).toHaveAttribute('aria-label');

    // Check button ARIA attributes
    const button = banner.locator('button').first();
    await expect(button).toHaveAttribute('aria-label');
    await expect(button).toHaveAttribute('type', 'button');
  });
});
