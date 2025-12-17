/**
 * D7 修正：以 Zod 原生解析取代「假自動化」Schema
 * - 直接用 SeedFileSchema.parse 驗證 seed JSON 與 Mock
 * - Zod Schema 一變，這裡立刻報錯，杜絕脫節
 * - 內容同步檢查：確保 JSON ↔ Mock 無資料漂移
 */
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createContext, runInContext } from 'vm';
import { deepStrictEqual } from 'assert';
import {
  SeedFileSchema,
  normalizeFeaturedReview,
  normalizeListingReview
} from '../src/types/property-page';
import { handleScriptError, handleScriptSuccess } from './lib/error-handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadJsonSeed() {
  const jsonPath = resolve(__dirname, '../public/data/seed-property-page.json');
  return JSON.parse(readFileSync(jsonPath, 'utf8'));
}

function loadMockSeed() {
  const mockPath = resolve(__dirname, '../public/js/property-data.js');
  const code = readFileSync(mockPath, 'utf8');
  const sandbox = { window: {} as Record<string, unknown> };
  createContext(sandbox);
  runInContext(code, sandbox);
  const data = (sandbox.window as Record<string, unknown>).propertyMockData;
  if (!data) throw new Error('Mock JS 執行後未發現 window.propertyMockData');
  return data;
}

function normalizeSeed(seed: unknown) {
  // 移除 JSON 專屬的 $schema，並用 JSON 序列化排除 undefined
  const copy = JSON.parse(JSON.stringify(seed));
  if (copy && typeof copy === 'object' && '$schema' in copy) {
    delete (copy as Record<string, unknown>).$schema;
  }
  return copy;
}

interface CardWithReviews {
  reviews?: { author: string; content: string; rating: number; date?: string }[];
}
interface SeedData {
  default?: {
    featured?: { main?: CardWithReviews; sideTop?: CardWithReviews; sideBottom?: CardWithReviews };
    listings?: { reviews?: { author: string; content: string; date?: string }[] }[];
  };
}

function assertAdaptersWork(seed: unknown) {
  const data = normalizeSeed(seed) as SeedData;
  const featured = data?.default?.featured;
  const listings = data?.default?.listings ?? [];
  let featuredCount = 0;
  let listingCount = 0;

  if (featured) {
    [featured.main, featured.sideTop, featured.sideBottom].forEach((card) => {
      (card?.reviews ?? []).forEach((r) => {
        const normalized = normalizeFeaturedReview(r);
        // D14 修正：檢查輸出格式，不只是「呼叫」
        if (!normalized.author || !normalized.content) {
          throw new Error(`normalizeFeaturedReview 輸出異常: ${JSON.stringify(normalized)}`);
        }
        featuredCount++;
      });
    });
  }

  listings.forEach((item) => {
    (item?.reviews ?? []).forEach((r) => {
      const normalized = normalizeListingReview(r);
      // D14 修正：檢查輸出格式，不只是「呼叫」
      if (!normalized.author || !normalized.content) {
        throw new Error(`normalizeListingReview 輸出異常: ${JSON.stringify(normalized)}`);
      }
      listingCount++;
    });
  });

  console.log(`   • Featured reviews 解析: ${featuredCount} 則`);
  console.log(`   • Listing reviews 解析: ${listingCount} 則`);
}

// D13: 使用統一錯誤處理，移除舊的 printIssues

try {
  console.log('🛡️  啟動 Zod 原生嚴格驗證 (JSON + Mock)...');

  const jsonSeed = loadJsonSeed();
  SeedFileSchema.parse(jsonSeed);
  console.log('✅ JSON 種子通過 Zod 驗證');

  const mockSeed = loadMockSeed();
  SeedFileSchema.parse(mockSeed);
  console.log('✅ Mock 種子通過 Zod 驗證');

   // 內容一致性檢查：防止 JSON 與 Mock 漂移
  console.log('⚖️  比對 JSON ↔ Mock 資料內容...');
  try {
    const normalizedJson = normalizeSeed(jsonSeed);
    const normalizedMock = normalizeSeed(mockSeed);
    deepStrictEqual(normalizedJson, normalizedMock);
    console.log('✅ JSON 與 Mock 完全同步');
  } catch (driftErr) {
    throw new Error('資料內容脫節 (Data Drift)：JSON 與 Mock 不一致');
  }

  // 3. 適配器可用性檢查：確保定義的 Adapter 不是死代碼
  console.log('🔗 驗證 Review Adapter 可正常運作...');
  assertAdaptersWork(jsonSeed);
  console.log('✅ Review Adapter 解析完成（featured/listings）');

  handleScriptSuccess('verify-seed-strict', 'Zod 定義與種子資料完全一致');
  process.exit(0);
} catch (error) {
  handleScriptError('verify-seed-strict', error);
}
