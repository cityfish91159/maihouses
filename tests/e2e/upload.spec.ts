import { test, expect } from '@playwright/test';

test.describe('Upload Flow', () => {
    test('should allow user to upload images and see compression', async ({ page }) => {
        await page.goto('/maihouses/property/upload');

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=上傳照片');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'test-image.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.alloc(2 * 1024 * 1024)
        });

        await expect(page.locator('text=正在優化圖片')).toBeVisible();
        await expect(page.locator('text=100%')).toBeVisible({ timeout: 10000 });

        const images = page.locator('.aspect-square img');
        await expect(images).toHaveCount(1);

        await expect(page.locator('text=查看壓縮效果 (Demo)')).toBeVisible();

        await page.click('text=查看壓縮效果 (Demo)');
        await expect(page.locator('text=壓縮效果對比')).toBeVisible();
        await expect(page.locator('text=Before (100%)')).toBeVisible();

        await page.click('text=關閉');
        await expect(page.locator('text=壓縮效果對比')).not.toBeVisible();
    });

    // ============================================================
    // UP-3.G: E2E 測試 - 封面功能
    // ============================================================

    test('UP-3.G: should allow user to set cover image', async ({ page }) => {
        await page.goto('/maihouses/property/upload');

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=上傳照片');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles([
            { name: 'image1.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(100 * 1024) },
            { name: 'image2.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(100 * 1024) },
            { name: 'image3.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(100 * 1024) },
        ]);

        await expect(page.locator('.aspect-square img')).toHaveCount(3, { timeout: 10000 });
        await expect(page.locator('text=封面').first()).toBeVisible();

        const imageContainers = page.locator('.aspect-square').filter({ has: page.locator('img') });
        const secondImageStar = imageContainers.nth(1).locator('button').first();
        await secondImageStar.click();

        await expect(page.locator('text=已設定封面')).toBeVisible();
        await expect(page.locator('.aspect-square:has(img) >> text=封面')).toHaveCount(1);
    });

    test('UP-3.G: should auto-assign new cover when deleting cover image', async ({ page }) => {
        await page.goto('/maihouses/property/upload');

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=上傳照片');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles([
            { name: 'cover.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(100 * 1024) },
            { name: 'second.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(100 * 1024) },
        ]);

        await expect(page.locator('.aspect-square img')).toHaveCount(2, { timeout: 10000 });

        const imageContainers = page.locator('.aspect-square').filter({ has: page.locator('img') });
        await expect(imageContainers.first().locator('text=封面')).toBeVisible();

        const deleteBtn = imageContainers.first().locator('button').filter({ has: page.locator('svg') }).last();
        await deleteBtn.click();

        await expect(page.locator('.aspect-square img')).toHaveCount(1);
        await expect(page.locator('.aspect-square:has(img) >> text=封面')).toHaveCount(1);
    });

    test('UP-3.G: first uploaded image should auto-become cover', async ({ page }) => {
        await page.goto('/maihouses/property/upload');

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=上傳照片');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles({
            name: 'only-image.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.alloc(100 * 1024)
        });

        await expect(page.locator('.aspect-square img')).toHaveCount(1, { timeout: 10000 });
        await expect(page.locator('.aspect-square:has(img) >> text=封面')).toBeVisible();
        await expect(page.locator('.aspect-square:has(img) >> text=封面')).toHaveCount(1);
    });

    test('UP-3.G: only one cover should exist at any time', async ({ page }) => {
        await page.goto('/maihouses/property/upload');

        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=上傳照片');
        const fileChooser = await fileChooserPromise;

        await fileChooser.setFiles([
            { name: 'a.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(50 * 1024) },
            { name: 'b.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(50 * 1024) },
            { name: 'c.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(50 * 1024) },
            { name: 'd.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(50 * 1024) },
        ]);

        await expect(page.locator('.aspect-square img')).toHaveCount(4, { timeout: 10000 });

        const containers = page.locator('.aspect-square').filter({ has: page.locator('img') });

        for (let i = 0; i < 4; i++) {
            const star = containers.nth(i).locator('button').first();
            await star.click();
            await expect(page.locator('.aspect-square:has(img) >> text=封面')).toHaveCount(1);
        }
    });
});
