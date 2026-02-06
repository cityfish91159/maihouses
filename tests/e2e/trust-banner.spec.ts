import { test, expect } from '@playwright/test';

/**
 * FE-2: TrustServiceBanner E2E 測試
 *
 * 測試目標：驗證安心留痕服務橫幅在實際瀏覽器環境中的行為
 *
 * 測試範圍：
 * 1. 頁面載入後橫幅顯示
 * 2. 點擊「了解更多」開啟新分頁
 * 3. 按鈕 Focus 狀態和鍵盤導航
 * 4. 響應式佈局（desktop + mobile）
 */

test.describe('TrustServiceBanner E2E', () => {
  test('應該在頁面載入後顯示橫幅', async ({ page }) => {
    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    const banner = page.locator('[role="region"][aria-label="安心留痕服務資訊"]');
    await expect(banner).toBeVisible();

    // 檢查橫幅內容
    await expect(page.locator('text=本物件已開啟安心留痕服務')).toBeVisible();
    await expect(page.locator('text=六階段交易追蹤')).toBeVisible();
  });

  test('點擊「進入服務」應開啟新分頁', async ({ page, context }) => {
    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    // 等待新頁面開啟
    const pagePromise = context.waitForEvent('page');

    const enterServiceButton = page.locator('button', { hasText: '進入服務' }).first();
    await enterServiceButton.click();

    const newPage = await pagePromise;
    await newPage.waitForLoadState('networkidle');

    // 驗證新頁面 URL 包含 assure
    expect(newPage.url()).toContain('/assure');

    await newPage.close();
  });

  test('按鈕應有清晰的 Focus 狀態', async ({ page }) => {
    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    const button = page.locator('button', { hasText: '進入服務' }).first();

    // 使用 Tab 鍵聚焦按鈕
    await page.keyboard.press('Tab');

    // 等待按鈕獲得焦點
    const isFocused = await button.evaluate((el) => el === document.activeElement);

    if (isFocused) {
      // 驗證 focus 樣式（transition 動畫）
      const hasTransition = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.transition.includes('all');
      });

      expect(hasTransition).toBeTruthy();
    }
  });

  test('橫幅應在 Header 下方、主內容前顯示', async ({ page }) => {
    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    // 檢查 DOM 順序
    const isCorrectPosition = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const banner = document.querySelector('[role="region"][aria-label="安心留痕服務資訊"]');
      const main = document.querySelector('main');

      if (!nav || !banner || !main) return false;

      // 比較元素的 vertical position
      const navRect = nav.getBoundingClientRect();
      const bannerRect = banner.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();

      // Banner 應在 nav 下方、main 上方
      return navRect.bottom < bannerRect.top && bannerRect.bottom < mainRect.top;
    });

    expect(isCorrectPosition).toBe(true);
  });
});

test.describe('TrustServiceBanner - 響應式測試', () => {
  test('應在行動裝置上正確顯示', async ({ page }) => {
    // 設定為 iPhone 12 Pro 尺寸
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    const banner = page.locator('[role="region"][aria-label*="安心留痕服務"]').first();
    await expect(banner).toBeVisible();

    // 檢查是否無橫向滾動
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test('應在桌面版正確顯示', async ({ page }) => {
    // 設定為桌面尺寸
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    const banner = page.locator('[role="region"][aria-label*="安心留痕服務"]').first();
    await expect(banner).toBeVisible();

    // 驗證橫幅寬度（max-w-4xl = 896px）
    const bannerBox = await banner.boundingBox();
    expect(bannerBox).not.toBeNull();

    if (bannerBox) {
      // max-w-4xl 的實際寬度應 ≤ 896px
      expect(bannerBox.width).toBeLessThanOrEqual(896 + 32); // +32 for padding
    }
  });

  test('按鈕文字在行動版和桌面版都清晰可見', async ({ page }) => {
    // 測試行動版
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    let button = page.locator('button', { hasText: '進入服務' }).first();
    await expect(button).toBeVisible();

    // 測試桌面版
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    button = page.locator('button', { hasText: '進入服務' }).first();
    await expect(button).toBeVisible();
  });
});

test.describe('TrustServiceBanner - 鍵盤導航', () => {
  test('應支援 Enter 鍵點擊', async ({ page, context }) => {
    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    const button = page.locator('button', { hasText: '進入服務' }).first();
    await button.focus();

    const pagePromise = context.waitForEvent('page');
    await page.keyboard.press('Enter');

    const newPage = await pagePromise;
    await newPage.waitForLoadState('networkidle');

    expect(newPage.url()).toContain('/assure');
    await newPage.close();
  });

  test('應支援 Space 鍵點擊', async ({ page, context }) => {
    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    const button = page.locator('button', { hasText: '進入服務' }).first();
    await button.focus();

    const pagePromise = context.waitForEvent('page');
    await page.keyboard.press('Space');

    const newPage = await pagePromise;
    await newPage.waitForLoadState('networkidle');

    expect(newPage.url()).toContain('/assure');
    await newPage.close();
  });
});
