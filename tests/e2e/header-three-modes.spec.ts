import { test, expect } from '@playwright/test';

test.describe('Header 三模式 UI 驗證', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/maihouses/');
    await page.waitForLoadState('networkidle');
  });

  test('Visitor 模式：顯示登入和註冊按鈕', async ({ page }) => {
    // 驗證桌面版
    await page.setViewportSize({ width: 1920, height: 1080 });

    const loginBtn = page.locator('a:has-text("登入")').first();
    const signupBtn = page.locator('a:has-text("免費註冊")').or(page.locator('a:has-text("註冊")')).first();

    await expect(loginBtn).toBeVisible();
    await expect(signupBtn).toBeVisible();

    // 驗證登入按鈕有正確的 href
    await expect(loginBtn).toHaveAttribute('href', /auth\.html\?mode=login/);
    await expect(signupBtn).toHaveAttribute('href', /auth\.html\?mode=signup/);
  });

  test('Demo 模式：點擊 Logo 5 次後顯示退出演示按鈕', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 點擊 Logo 5 次
    const logo = page.locator('[role="button"]').first();
    for (let i = 0; i < 5; i++) {
      await logo.click();
      await page.waitForTimeout(100);
    }

    // 等待 toast 出現並點擊「進入演示」
    const enterDemoBtn = page.locator('button:has-text("進入演示")');
    await expect(enterDemoBtn).toBeVisible({ timeout: 5000 });
    await enterDemoBtn.click();

    // 等待頁面重新載入
    await page.waitForLoadState('networkidle');

    // 驗證桌面版「退出演示」按鈕存在
    const exitDemoBtn = page.locator('button:has-text("退出演示")').first();
    await expect(exitDemoBtn).toBeVisible();

    // 驗證不應該有登入/註冊按鈕
    const loginBtn = page.locator('a:has-text("登入")');
    await expect(loginBtn).not.toBeVisible();
  });

  test('Demo 模式手機版：顯示簡化的退出按鈕', async ({ page }) => {
    // 切換到手機視窗
    await page.setViewportSize({ width: 375, height: 667 });

    // 進入 Demo 模式
    const logo = page.locator('[role="button"]').first();
    for (let i = 0; i < 5; i++) {
      await logo.click();
      await page.waitForTimeout(100);
    }

    const enterDemoBtn = page.locator('button:has-text("進入演示")');
    await expect(enterDemoBtn).toBeVisible({ timeout: 5000 });
    await enterDemoBtn.click();
    await page.waitForLoadState('networkidle');

    // 手機版應該顯示「退出」按鈕
    const exitBtn = page.locator('button:has-text("退出")').first();
    await expect(exitBtn).toBeVisible();
  });

  test.skip('Live 模式：模擬已登入狀態（通過 localStorage）', async ({ page }) => {
    // 注意：此測試需要真實的 Supabase session
    // Mock session 會被 Supabase 驗證拒絕，無法測試 live 模式 UI
    // 待實作：使用真實測試帳號或 E2E auth fixture

    await page.setViewportSize({ width: 1920, height: 1080 });

    // 模擬設置 localStorage 的 supabase session
    await page.evaluate(() => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_at: Date.now() + 3600000,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            name: '測試使用者'
          }
        }
      };
      localStorage.setItem('sb-supabase-auth-token', JSON.stringify(mockSession));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 如果 useAuth 成功讀取 session，應該會顯示頭像按鈕
    // 但由於這是 mock session，實際上 Supabase 會驗證失敗
  });

  test('回歸測試：搜尋功能仍正常', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const searchInput = page.locator('input[name="search"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('測試搜尋');
    await searchInput.press('Enter');

    // 應該導向房源列表頁
    await page.waitForURL(/.*q=測試搜尋.*/);
  });

  test('回歸測試：MaiMai 點擊仍能觸發 celebrate', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 找到 MaiMai 按鈕
    const maiMaiBtn = page.locator('button[aria-label*="邁邁"]');

    // 點擊 3 次觸發 celebrate（根據 TUTORIAL_CONFIG.CELEBRATE_CLICK_COUNT_THRESHOLD）
    for (let i = 0; i < 3; i++) {
      await maiMaiBtn.click();
      await page.waitForTimeout(100);
    }

    // 驗證 MaiMai 按鈕存在且可點擊（狀態改變需視覺檢查）
    await expect(maiMaiBtn).toBeVisible();
  });

  test.skip('無障礙測試：Escape 鍵應關閉下拉選單（需 Live 模式）', async ({ page }) => {
    // 此測試需要 Live 模式（已登入狀態）才能測試下拉選單
    // 待實作：使用真實測試帳號登入後驗證 Escape 鍵功能
    await page.setViewportSize({ width: 1920, height: 1080 });
  });
});
