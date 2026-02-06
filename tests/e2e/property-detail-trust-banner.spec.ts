import { test, expect, type Page } from '@playwright/test';

const PROPERTY_URL = '/maihouses/property/MH-100001';

const getBanner = (page: Page) => page.locator('[role="region"][aria-label*="安心留痕服務"]');

test.describe('PropertyDetailPage - TrustServiceBanner (Phase 2)', () => {
  test('已開啟狀態顯示橫幅並可進入安心留痕服務', async ({ page, context }) => {
    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('本物件已開啟安心留痕服務', { exact: true })).toBeVisible();
    await expect(page.getByText(/六階段交易追蹤/)).toBeVisible();

    const enterButton = page.getByRole('button', {
      name: /進入安心留痕服務/,
    });
    await expect(enterButton).toBeVisible();

    const popupPromise = context.waitForEvent('page');
    await enterButton.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/\/maihouses\/assure/);
  });

  test('未開啟狀態顯示要求開啟並回報成功 toast', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');

    // 使用語意化選擇器：尋找「要求房仲開啟」按鈕來切換狀態
    // 注意：此測試假設頁面有切換機制，若無則需調整測試策略
    const mockToggle = page.getByRole('button', { name: /要求房仲開啟/ }).first();
    if (await mockToggle.isVisible()) {
      await mockToggle.click();
    }

    await expect(page.getByText('本物件尚未開啟安心留痕服務', { exact: true })).toBeVisible();
    await expect(page.getByText(/讓房仲開啟六階段交易追蹤/)).toBeVisible();

    const requestButton = page.getByRole('button', {
      name: /要求房仲開啟安心留痕服務/,
    });
    await requestButton.click();

    await expect(page.getByText('要求已送出')).toBeVisible({ timeout: 3000 });
  });

  test('響應式布局：Desktop 與 Mobile 呈現正確寬度', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');

    const banner = getBanner(page).first();
    await expect(banner).toBeVisible();

    const bannerBox = await banner.boundingBox();
    expect(bannerBox).not.toBeNull();
    if (bannerBox) {
      expect(bannerBox.width).toBeLessThanOrEqual(928);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    const mobileBanner = getBanner(page).first();
    const mobileButton = mobileBanner.getByRole('button').first();
    const mobileButtonBox = await mobileButton.boundingBox();
    const mobileBannerBox = await mobileBanner.boundingBox();

    if (mobileButtonBox && mobileBannerBox) {
      expect(mobileButtonBox.width).toBeGreaterThan(mobileBannerBox.width * 0.9);
    }
  });

  test('響應式布局：Tablet 不出現水平卷軸', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test('舊版保證區塊已移除', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=實價登錄查證')).toHaveCount(0);
    await expect(page.locator('text=履約保證專戶')).toHaveCount(0);
    await expect(page.locator('text=房屋檢查報告')).toHaveCount(0);
  });

  test('TrustBadge 在已開啟狀態仍保留顯示', async ({ page }) => {
    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');

    const badge = page.locator('[role="region"][aria-label="安心留痕服務資訊"]');
    await expect(badge).toBeVisible();
  });

  test('鍵盤可操作並具備必要 ARIA 標記', async ({ page, context }) => {
    await page.goto(PROPERTY_URL);
    await page.waitForLoadState('networkidle');

    const banner = getBanner(page).first();
    await expect(banner).toHaveAttribute('aria-label');

    const enterButton = banner.getByRole('button', {
      name: /進入安心留痕服務/,
    });
    await enterButton.focus();

    const popupPromise = context.waitForEvent('page');
    await page.keyboard.press('Enter');
    const popup = await popupPromise;
    await expect(popup).toHaveURL(/\/maihouses\/assure/);
  });
});
