import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-chromium';

const targetUrl = process.env.PHASE4_URL || 'https://maihouses.vercel.app/maihouses/property.html';
const outDir = path.join(process.cwd(), 'arena', 'results', 'phase4');

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function run() {
  await ensureDir(outDir);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const runs: Array<{ index: number; versions: unknown; telemetry: unknown; screenshot: string }> = [];

  for (let i = 0; i < 5; i += 1) {
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const versions = await page.evaluate(() => (window as unknown as { __renderVersionLog?: unknown }).__renderVersionLog || []);
    const telemetry = await page.evaluate(() => (window as unknown as { __phase4Telemetry?: unknown }).__phase4Telemetry || {});

    const screenshot = path.join(outDir, `flicker-run-${i + 1}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });

    runs.push({ index: i + 1, versions, telemetry, screenshot });
    await page.waitForTimeout(200);
  }

  await browser.close();
  const reportPath = path.join(outDir, 'flicker-report.json');
  await fs.promises.writeFile(reportPath, JSON.stringify({ targetUrl, runs }, null, 2));
  console.log(`Phase4 visual report written to ${reportPath}`);
}

run().catch((error) => {
  console.error('[phase4:flicker-visual] failed', error);
  process.exitCode = 1;
});
