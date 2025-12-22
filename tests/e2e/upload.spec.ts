import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Upload Flow', () => {
    test('should allow user to upload images and see compression', async ({ page }) => {
        // 1. Navigate to Upload Page
        await page.goto('/maihouses/property/upload');

        // 2. Click Upload Button (using hidden input)
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('text=上傳照片');
        const fileChooser = await fileChooserPromise;

        // 3. Upload a large image
        // Note: detailed path handling depends on where the test runner is executed
        // We assume a fixture 'test-image.jpg' exists or we generate one
        await fileChooser.setFiles({
            name: 'test-image.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.alloc(2 * 1024 * 1024) // 2MB dummy file
        });

        // 4. Verify Compression UI appears
        await expect(page.locator('text=正在優化圖片')).toBeVisible();
        await expect(page.locator('text=100%')).toBeVisible({ timeout: 10000 }); // Wait for completion

        // 5. Verify Image is added to grid
        const images = page.locator('.aspect-square img');
        await expect(images).toHaveCount(1);

        // 6. Verify "Comparison Demo" link appears
        await expect(page.locator('text=查看壓縮效果 (Demo)')).toBeVisible();

        // 7. Click Comparison
        await page.click('text=查看壓縮效果 (Demo)');
        await expect(page.locator('text=壓縮效果對比')).toBeVisible();
        await expect(page.locator('text=Before (100%)')).toBeVisible();

        // 8. Close Modal
        await page.click('text=關閉');
        await expect(page.locator('text=壓縮效果對比')).not.toBeVisible();
    });
});
