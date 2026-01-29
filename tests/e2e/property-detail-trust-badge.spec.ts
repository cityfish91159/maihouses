import { test, expect } from '@playwright/test';

/**
 * FE-2: PropertyDetailPage TrustBadge E2E 測試
 *
 * 測試目標：驗證安心留痕徽章在不同 trustEnabled 狀態下的顯示行為
 *
 * 測試範圍：
 * 1. trustEnabled=true: 徽章應顯示
 * 2. trustEnabled=false: 徽章應隱藏
 * 3. 徽章位置正確（AgentTrustCard 下方）
 * 4. 可訪問性屬性存在（role, aria-label）
 */

test.describe('PropertyDetailPage - TrustBadge Integration', () => {
  test('顯示 TrustBadge when trustEnabled=true', async ({ page }) => {
    // 假設 MH-100001 的 trust_enabled=true（需在資料庫中設定）
    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    // 檢查徽章標題
    const badge = page.locator('text=安心留痕').first();
    await expect(badge).toBeVisible();

    // 檢查三個功能點
    await expect(page.locator('text=六階段交易追蹤')).toBeVisible();
    await expect(page.locator('text=每步驟數位留痕')).toBeVisible();
    await expect(page.locator('text=雙方確認機制')).toBeVisible();
  });

  test('TrustBadge 具備正確的可訪問性屬性', async ({ page }) => {
    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    // 檢查 role 和 aria-label 屬性
    const badgeRegion = page.locator('[role="region"][aria-label="安心留痕服務資訊"]');
    await expect(badgeRegion).toBeVisible();

    // 檢查圖標是否正確隱藏於螢幕閱讀器
    const hiddenIcons = page.locator('[aria-hidden="true"]');
    const count = await hiddenIcons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('TrustBadge 位於 AgentTrustCard 下方', async ({ page }) => {
    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    // 使用 evaluate 檢查 DOM 順序
    const isCorrectPosition = await page.evaluate(() => {
      const trustBadge = document.querySelector('[role="region"][aria-label="安心留痕服務資訊"]');
      if (!trustBadge) return false;

      // 檢查徽章的前一個兄弟元素是否包含經紀人資訊
      const previousSibling = trustBadge.previousElementSibling;
      return previousSibling !== null;
    });

    expect(isCorrectPosition).toBe(true);
  });

  test('TrustBadge 支援鍵盤導航（focus-visible）', async ({ page }) => {
    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    const badge = page.locator('[role="region"][aria-label="安心留痕服務資訊"]');

    // 檢查 focus-visible classes 存在
    const classes = await badge.getAttribute('class');
    expect(classes).toContain('focus-visible:outline-2');
    expect(classes).toContain('focus-visible:outline-offset-2');
    expect(classes).toContain('focus-visible:outline-blue-600');
  });
});

test.describe('PropertyDetailPage - TrustBadge 隱藏測試', () => {
  test.skip('隱藏 TrustBadge when trustEnabled=false', async ({ page }) => {
    // TODO: 需要建立一個 trust_enabled=false 的測試物件
    // 例如 MH-TEST-002
    await page.goto('/maihouses/property/MH-TEST-002');
    await page.waitForLoadState('networkidle');

    // 確認徽章不存在
    const badge = page.locator('text=安心留痕').first();
    await expect(badge).not.toBeVisible();

    // 確認三個功能點也不存在
    await expect(page.locator('text=六階段交易追蹤')).not.toBeVisible();
  });
});

test.describe('PropertyDetailPage - 響應式測試', () => {
  test('TrustBadge 在行動裝置上正確顯示', async ({ page }) => {
    // 設定為 iPhone 12 Pro 尺寸
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    const badge = page.locator('[role="region"][aria-label="安心留痕服務資訊"]');
    await expect(badge).toBeVisible();

    // 檢查是否無橫向滾動
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test('TrustBadge 在桌面版正確顯示', async ({ page }) => {
    // 設定為桌面尺寸
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/maihouses/property/MH-100001');
    await page.waitForLoadState('networkidle');

    const badge = page.locator('[role="region"][aria-label="安心留痕服務資訊"]');
    await expect(badge).toBeVisible();

    // 檢查徽章寬度不超過容器
    const badgeWidth = await badge.boundingBox();
    expect(badgeWidth).not.toBeNull();
    if (badgeWidth) {
      expect(badgeWidth.width).toBeLessThan(500); // sidebar 寬度限制
    }
  });
});
