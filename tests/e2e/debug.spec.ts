import { test, expect } from '@playwright/test';

// 診斷測試 - 檢查 console 錯誤
test('DEBUG: check console errors', async ({ page }) => {
    // 監聽 console 錯誤
    const errors: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });

    page.on('pageerror', err => {
        errors.push(`Page Error: ${err.message}`);
    });

    await page.goto('/maihouses/property/upload');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('=== Console Errors ===');
    errors.forEach(e => console.log(e));
    console.log('=== End Console Errors ===');
    console.log('Total errors:', errors.length);

    // 檢查 HTML 內容
    const html = await page.content();
    console.log('HTML includes #root:', html.includes('id="root"'));
    console.log('HTML includes script:', html.includes('<script'));

    // 檢查 #root 內容
    const rootContent = await page.locator('#root').innerHTML();
    console.log('#root innerHTML length:', rootContent.length);
    console.log('#root innerHTML preview:', rootContent.substring(0, 200));

    await page.screenshot({ path: 'debug-console.png', fullPage: true });

    expect(false).toBe(true);
});
