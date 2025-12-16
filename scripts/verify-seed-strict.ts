/**
 * D7 修正：以 Zod 原生解析取代「假自動化」Schema
 * - 直接用 SeedFileSchema.parse 驗證 seed JSON 與 Mock
 * - Zod Schema 一變，這裡立刻報錯，杜絕脫節
 */
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createContext, runInContext } from 'vm';
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
  return (sandbox.window as Record<string, unknown>).propertyMockData;
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

  console.log('🎉 驗證成功：Zod 定義與種子資料完全一致');
  process.exit(0);
} catch (error) {
  printIssues('Zod 原生嚴格驗證', error);
  process.exit(1);
}
