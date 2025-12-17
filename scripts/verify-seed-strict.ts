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
import { SeedFileSchema } from '../src/types/property-page';

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

function printIssues(title: string, error: unknown) {
  console.error(`❌ ${title} 驗證失敗`);
  if (error && typeof error === 'object' && 'issues' in error) {
    console.error(JSON.stringify((error as { issues: unknown }).issues, null, 2));
  } else {
    console.error(error);
  }
}

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

  console.log('🎉 驗證成功：Zod 定義與種子資料完全一致');
  process.exit(0);
} catch (error) {
  printIssues('Zod 原生嚴格驗證', error);
  process.exit(1);
}
