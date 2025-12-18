import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { chromium, type Page, type Route } from 'playwright-chromium';

interface Phase4Telemetry {
  events: Array<{ name: string; ts: number; [key: string]: unknown }>;
  lcp: number | null;
  fcp: number | null;
}

interface WindowWithApi extends Window {
  PropertyAPI: { getPageData: () => Promise<unknown> };
  __phase4Telemetry?: Phase4Telemetry;
  __renderVersionLog?: unknown[];
}

const BASE_URL = process.env.P5_URL || 'https://maihouses.vercel.app/maihouses/property.html';
const API_PATH = '/api/property/page-data';

const seedPath = path.join(process.cwd(), 'public', 'data', 'seed-property-page.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

function logStep(title: string) {
  console.log(`\n[Step] ${title}`);
}

async function runHappyPath(page: Page) {
  logStep('Happy path render + telemetry');
  await page.goto(`${BASE_URL}?t=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const { renderLog, telemetry, listingCount, mainHtml } = await page.evaluate(() => {
    const win = window as unknown as WindowWithApi;
    const log = win.__renderVersionLog || [];
    const tm = win.__phase4Telemetry || { events: [], lcp: null, fcp: null };
    const listings = document.querySelectorAll('#listing-grid-container article').length;
    const mainInner = (document.getElementById('featured-main-container') || {}).innerHTML || '';
    return { renderLog: log, telemetry: tm, listingCount: listings, mainHtml: mainInner };
  });

  assert(mainHtml.includes('<img'), 'featured main missing image');
  assert(listingCount > 0, 'listing cards not rendered');
  assert(Array.isArray(renderLog) && renderLog.length > 0, 'render log missing');
  assert(telemetry && telemetry.events && telemetry.events.length > 0, 'telemetry missing');
  console.log('[OK] happy path render + telemetry captured');
}

async function runFallbackTest(page: Page) {
  logStep('Fallback when API fails');
  await page.route(`**${API_PATH}`, (route: Route) => {
    route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false }) });
  });

  await page.goto(`${BASE_URL}?fallback=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const { telemetry, renderLog, listingCount } = await page.evaluate(() => {
    const win = window as unknown as WindowWithApi;
    return {
      telemetry: win.__phase4Telemetry || { events: [], lcp: null, fcp: null },
      renderLog: win.__renderVersionLog || [],
      listingCount: document.querySelectorAll('#listing-grid-container article').length
    };
  });

  const lastEvent = Array.isArray(telemetry.events) ? telemetry.events.at(-1) : null;
  assert(lastEvent?.name === 'render:fallback', 'fallback event not recorded');
  assert(listingCount > 0, 'fallback did not render listings');
  assert(Array.isArray(renderLog) && renderLog.length > 0, 'render log missing under fallback');
  console.log('[OK] fallback path renders and logs');
}

async function runRaceGuardTest(page: Page) {
  logStep('Race guard aborts stale request');
  let hit = 0;
  await page.route(`**${API_PATH}`, async (route: Route) => {
    hit += 1;
    const body = { success: true, data: seed.default };
    if (hit === 1) {
      await new Promise((r) => setTimeout(r, 800));
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.goto(`${BASE_URL}?race=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const results = await page.evaluate(async () => {
    const win = window as unknown as WindowWithApi;
    const api = win.PropertyAPI;
    const settled = await Promise.allSettled([api.getPageData(), api.getPageData()]);
    return settled.map((r) => (r.status === 'fulfilled' ? r.value : null));
  });

  assert(results.length === 2, 'race test missing results');
  assert(results[0] === null, 'first (aborted) call should be null');
  assert(results[1] && (results[1] as any).featured, 'second call should succeed with data');
  console.log('[OK] race guard aborts stale request and returns fresh data');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    await runHappyPath(page);
    await page.context().clearCookies();
    await runFallbackTest(page);
    await page.context().clearCookies();
    await runRaceGuardTest(page);
    console.log('\n✅ Phase5 tests passed');
  } catch (error) {
    console.error('\n❌ Phase5 tests failed:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
