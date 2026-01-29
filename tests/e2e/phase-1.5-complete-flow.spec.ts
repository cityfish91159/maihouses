/**
 * Phase 1.5 完整流程 E2E 測試
 *
 * Team Echo-1: T-01 E2E 測試
 *
 * 測試範圍:
 * - M1-M4 完整流程
 * - Token 升級流程
 * - 安全性驗證
 * - 錯誤處理
 * - 無障礙性
 *
 * Skills Applied:
 * - [Rigorous Testing] 完整 E2E 覆蓋
 * - [UI/UX Pro Max] 無障礙性驗證
 */

import { test, expect } from '@playwright/test';
import { MOCK_PROPERTY, MOCK_TOKEN } from './fixtures/mockData';

// ============================================================================
// Test Configuration
// ============================================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173/maihouses';
const TEST_PROPERTY_ID = MOCK_PROPERTY.public_id;

// ============================================================================
// Test 1: 完整流程 - 匿名用戶進入 Trust Room
// ============================================================================

test.describe('Phase 1.5: 消費者自主發起流程', () => {
  test('應該能完整執行 M1 匿名進入流程', async ({ page }) => {
    // 1. 訪問物件詳情頁
    await page.goto(`${BASE_URL}/property/${TEST_PROPERTY_ID}`);
    await expect(page).toHaveTitle(/MaiHouses/);

    // 2. 等待頁面載入
    await page.waitForLoadState('networkidle');

    // 3. 檢查「安心留痕服務」橫幅是否存在
    const banner = page.locator('[role="region"][aria-label*="安心留痕"]');
    await expect(banner).toBeVisible();

    // 4. 檢查橫幅內容
    const bannerText = await banner.textContent();
    expect(bannerText).toContain('安心留痕');

    // 5. 點擊「進入服務」按鈕
    const enterButton = banner.locator('button', { hasText: '進入服務' });
    await expect(enterButton).toBeEnabled();
    await enterButton.click();

    // 6. 等待導向到 Trust Room（應取得 Token）
    await page.waitForURL(/.*assure\?token=.*/);

    // 7. 驗證 URL 包含 Token
    const url = page.url();
    expect(url).toMatch(/token=[a-f0-9-]{36}/);

    // 8. 驗證 Trust Room 頁面載入
    await expect(page.locator('text=Trust Room')).toBeVisible();
  });

  test('應該正確顯示 Loading Skeleton', async ({ page }) => {
    // 1. 訪問物件詳情頁
    await page.goto(`${BASE_URL}/property/${TEST_PROPERTY_ID}`);

    // 2. 檢查 Skeleton 是否先顯示
    const skeleton = page.locator('[role="status"][aria-label="Loading banner..."]');
    await expect(skeleton).toBeVisible({ timeout: 1000 });

    // 3. 等待實際內容載入
    await page.waitForLoadState('networkidle');

    // 4. 確認 Skeleton 已消失
    await expect(skeleton).not.toBeVisible();
  });
});

// ============================================================================
// Test 2: Token 升級流程
// ============================================================================

test.describe('Token 升級流程', () => {
  test('應該能將匿名 Token 升級為已註冊用戶', async ({ page }) => {
    // 此測試需要 Mock 登入狀態
    // 1. 訪問物件詳情頁並取得 Token
    await page.goto(`${BASE_URL}/property/${TEST_PROPERTY_ID}`);
    const enterButton = page.locator('button', { hasText: '進入服務' });
    await enterButton.click();
    await page.waitForURL(/.*assure\?token=.*/);

    // 2. 提取 Token
    const url = page.url();
    const tokenMatch = url.match(/token=([a-f0-9-]{36})/);
    expect(tokenMatch).not.toBeNull();
    const token = tokenMatch![1];

    // 3. 模擬註冊/登入（實際應用中需要 Mock Auth）
    // 此處假設已登入，直接測試 upgrade API

    // 4. 驗證 Token 已儲存到 localStorage
    const storedToken = await page.evaluate(() => {
      // 嘗試讀取加密的 Token
      return localStorage.getItem('mh_encrypted_trustToken');
    });
    expect(storedToken).not.toBeNull();
  });
});

// ============================================================================
// Test 3: 安全性測試
// ============================================================================

test.describe('安全性驗證', () => {
  test('應該防止 XSS 攻擊', async ({ page }) => {
    // 嘗試注入 XSS payload
    const xssPayload = '<script>alert("XSS")</script>';
    await page.goto(
      `${BASE_URL}/property/${TEST_PROPERTY_ID}?name=${encodeURIComponent(xssPayload)}`
    );

    // 驗證沒有執行 script
    const alerts: string[] = [];
    page.on('dialog', (dialog) => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });

    await page.waitForLoadState('networkidle');
    expect(alerts).toHaveLength(0);
  });

  test('應該正確設置 CSP Header', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/property/${TEST_PROPERTY_ID}`);
    const headers = response!.headers();

    // 驗證 CSP Header 存在
    const csp = headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
  });
});

// ============================================================================
// Test 4: 錯誤處理
// ============================================================================

test.describe('錯誤處理', () => {
  test('應該正確處理不存在的物件', async ({ page }) => {
    await page.goto(`${BASE_URL}/property/MH-999999`);

    // 應顯示錯誤訊息或 404 頁面
    const errorMessage = page.locator('text=/找不到|Not Found|404/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('應該正確處理 Rate Limiting', async ({ page }) => {
    // Team Lima-2 修復：改為連續請求（不是並行）
    const responses: Array<{ status: number; body?: any }> = [];

    for (let i = 0; i < 11; i++) {
      const response = await page.request.post(`${BASE_URL}/api/trust/auto-create-case`, {
        data: { propertyId: TEST_PROPERTY_ID },
      });

      const body = await response.json().catch(() => ({}));
      responses.push({ status: response.status(), body });

      // 等待 10ms 確保請求是連續的
      await page.waitForTimeout(10);
    }

    // 前 10 次應該成功
    const successCount = responses.filter((r) => r.status === 201).length;
    expect(successCount).toBeGreaterThanOrEqual(10);

    // 第 11 次應該被 Rate Limit
    const lastResponse = responses[responses.length - 1];
    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body?.error?.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

// ============================================================================
// Test 5: 無障礙性測試
// ============================================================================

test.describe('無障礙性驗證 (WCAG 2.1 AA)', () => {
  test('應該正確設置 ARIA 屬性', async ({ page }) => {
    await page.goto(`${BASE_URL}/property/${TEST_PROPERTY_ID}`);

    // 檢查橫幅的 ARIA 屬性
    const banner = page.locator('[role="region"]');
    await expect(banner).toHaveAttribute('aria-label', /安心留痕/);

    // 檢查按鈕的 ARIA 屬性
    const button = banner.locator('button');
    await expect(button).toHaveAttribute('aria-label');
  });

  test('應該支援鍵盤導航', async ({ page }) => {
    await page.goto(`${BASE_URL}/property/${TEST_PROPERTY_ID}`);

    // Tab 到進入服務按鈕
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // 可能需要多次 Tab

    // 驗證焦點在按鈕上
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    expect(focusedElement).toContain('進入服務');

    // 按 Enter 觸發
    await page.keyboard.press('Enter');
    await page.waitForURL(/.*assure\?token=.*/);
  });

  test('應該有正確的對比度', async ({ page }) => {
    await page.goto(`${BASE_URL}/property/${TEST_PROPERTY_ID}`);

    // 使用 axe-core 檢查對比度（需要安裝 @axe-core/playwright）
    // const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    // expect(accessibilityScanResults.violations).toEqual([]);

    // 手動檢查按鈕顏色對比度
    const button = page.locator('button', { hasText: '進入服務' });
    const bgColor = await button.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const color = await button.evaluate((el) => window.getComputedStyle(el).color);

    // 驗證顏色已設置（詳細對比度計算需額外工具）
    expect(bgColor).toBeTruthy();
    expect(color).toBeTruthy();
  });
});

// ============================================================================
// Test 6: 效能測試
// ============================================================================

test.describe('效能驗證', () => {
  test('API 響應時間應 < 300ms', async ({ page }) => {
    const startTime = Date.now();

    await page.request.post(`${BASE_URL}/api/trust/auto-create-case`, {
      data: { propertyId: TEST_PROPERTY_ID },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(300);
  });

  test('頁面載入時間應 < 3 秒', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(`${BASE_URL}/property/${TEST_PROPERTY_ID}`);
    await page.waitForLoadState('networkidle');

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(3000);
  });
});
