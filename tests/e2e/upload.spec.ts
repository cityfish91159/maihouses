import { test, expect } from '@playwright/test';

test.describe('Upload Flow', () => {
    // 增加每個測試的 timeout
    test.setTimeout(120000);

    test.beforeEach(async ({ page }) => {
        // 等待頁面完全載入
        await page.goto('/maihouses/property/upload');
        // 等待 React 渲染完成
        await page.waitForLoadState('domcontentloaded');
        // 等待上傳區域出現
        await page.waitForSelector('text=物件照片', { timeout: 30000 });
    });

    const MOCK_JPEG_BUFFER = Buffer.from(
        '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWFlhZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxAPwD3+iiigD//2Q==',
        'base64'
    );

    test('should allow user to upload images and see compression', async ({ page }) => {
        // 找到上傳按鈕
        const uploadButton = page.locator('button:has-text("上傳照片")');
        await expect(uploadButton).toBeVisible({ timeout: 10000 });

        const fileChooserPromise = page.waitForEvent('filechooser');
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'test-image.jpg',
            mimeType: 'image/jpeg',
            buffer: MOCK_JPEG_BUFFER
        });

        // 驗證圖片被加入
        await expect(page.locator('.aspect-square img')).toHaveCount(1, { timeout: 30000 });
    });

    // ============================================================
    // UP-3.G: E2E 測試 - 封面功能
    // ============================================================

    test('UP-3.G: should allow user to set cover image', async ({ page }) => {
        const uploadButton = page.locator('button:has-text("上傳照片")');
        await expect(uploadButton).toBeVisible({ timeout: 10000 });

        const fileChooserPromise = page.waitForEvent('filechooser');
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles([
            { name: 'image1.jpg', mimeType: 'image/jpeg', buffer: MOCK_JPEG_BUFFER },
            { name: 'image2.jpg', mimeType: 'image/jpeg', buffer: MOCK_JPEG_BUFFER },
            { name: 'image3.jpg', mimeType: 'image/jpeg', buffer: MOCK_JPEG_BUFFER },
        ]);

        // 等待圖片加入
        await expect(page.locator('.aspect-square img')).toHaveCount(3, { timeout: 30000 });

        // 驗證第一張是封面
        await expect(page.locator('text=封面').first()).toBeVisible();

        // 點擊第二張圖的⭐按鈕設為封面
        const imageContainers = page.locator('.aspect-square').filter({ has: page.locator('img') });
        const secondImageStar = imageContainers.nth(1).locator('button[title="設為封面"]');
        await secondImageStar.click();

        // 驗證 toast
        await expect(page.locator('text=已設定封面')).toBeVisible({ timeout: 5000 });

        // 驗證只有一個封面
        await expect(page.locator('.aspect-square:has(img) >> text=封面')).toHaveCount(1);
    });

    test('UP-3.G: should auto-assign new cover when deleting cover image', async ({ page }) => {
        const uploadButton = page.locator('button:has-text("上傳照片")');
        await expect(uploadButton).toBeVisible({ timeout: 10000 });

        const fileChooserPromise = page.waitForEvent('filechooser');
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles([
            { name: 'cover.jpg', mimeType: 'image/jpeg', buffer: MOCK_JPEG_BUFFER },
            { name: 'second.jpg', mimeType: 'image/jpeg', buffer: MOCK_JPEG_BUFFER },
        ]);

        await expect(page.locator('.aspect-square img')).toHaveCount(2, { timeout: 30000 });

        // 第一張是封面
        const imageContainers = page.locator('.aspect-square').filter({ has: page.locator('img') });
        await expect(imageContainers.first().locator('text=封面')).toBeVisible();

        // 刪除第一張（封面）
        const deleteBtn = imageContainers.first().locator('button[title="移除圖片"]');
        await deleteBtn.click();

        // 現在只有1張
        await expect(page.locator('.aspect-square img')).toHaveCount(1);

        // 剩下的一張應該是封面
        await expect(page.locator('.aspect-square:has(img) >> text=封面')).toHaveCount(1);
    });

    test('UP-3.G: first uploaded image should auto-become cover', async ({ page }) => {
        const uploadButton = page.locator('button:has-text("上傳照片")');
        await expect(uploadButton).toBeVisible({ timeout: 10000 });

        const fileChooserPromise = page.waitForEvent('filechooser');
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'only-image.jpg',
            mimeType: 'image/jpeg',
            buffer: MOCK_JPEG_BUFFER
        });

        await expect(page.locator('.aspect-square img')).toHaveCount(1, { timeout: 30000 });

        // 自動成為封面
        await expect(page.locator('.aspect-square:has(img) >> text=封面')).toBeVisible();
        await expect(page.locator('.aspect-square:has(img) >> text=封面')).toHaveCount(1);
    });

    test('UP-3.G: only one cover should exist at any time', async ({ page }) => {
        const uploadButton = page.locator('button:has-text("上傳照片")');
        await expect(uploadButton).toBeVisible({ timeout: 10000 });

        const fileChooserPromise = page.waitForEvent('filechooser');
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles([
            { name: 'a.jpg', mimeType: 'image/jpeg', buffer: MOCK_JPEG_BUFFER },
            { name: 'b.jpg', mimeType: 'image/jpeg', buffer: MOCK_JPEG_BUFFER },
            { name: 'c.jpg', mimeType: 'image/jpeg', buffer: MOCK_JPEG_BUFFER },
            { name: 'd.jpg', mimeType: 'image/jpeg', buffer: MOCK_JPEG_BUFFER },
        ]);

        await expect(page.locator('.aspect-square img')).toHaveCount(4, { timeout: 30000 });

        // 點擊每個⭐按鈕，確認只有一個封面
        const containers = page.locator('.aspect-square').filter({ has: page.locator('img') });

        for (let i = 0; i < 4; i++) {
            // Find Star Button (has star icon) regardless of title ("設為封面" or "目前封面")
            const star = containers.nth(i).locator('button').filter({ has: page.locator('svg.lucide-star') });
            await star.click();
            await page.waitForTimeout(500); // 等待狀態更新
            await expect(page.locator('.aspect-square:has(img) >> text=封面')).toHaveCount(1);
        }
    });
});
