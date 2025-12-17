/**
 * D5 修正：Mock ↔ JSON 同步檢查
 * D12 修正：改用 Node.js 標準庫 deepStrictEqual，移除自寫 deepEqual
 * 
 * 用途：
 * 1. 確保 property-data.js (Mock) 和 seed-property-page.json 結構一致
 * 2. pre-commit 自動檢查，防止不同步
 * 
 * 邏輯：
 * 1. 讀取 property-data.js，用 VM 執行取得 window.propertyMockData
 * 2. 讀取 seed-property-page.json
 * 3. 用 assert.deepStrictEqual 比對（標準庫自動處理所有 edge case）
 * 4. 不一致就報錯
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createContext, runInContext } from 'vm';
import { deepStrictEqual } from 'assert';
import { handleScriptError, handleScriptSuccess } from './lib/error-handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MOCK_PATH = resolve(__dirname, '../public/js/property-data.js');
const JSON_PATH = resolve(__dirname, '../public/data/seed-property-page.json');

console.log('🔍 檢查 Mock ↔ JSON 同步狀態...\n');

// 1. 讀取 Mock 資料 (用 VM 沙箱執行)
const mockCode = readFileSync(MOCK_PATH, 'utf8');
const sandbox = { window: {} as Record<string, unknown> };
createContext(sandbox);
runInContext(mockCode, sandbox);
const mockData = (sandbox.window as Record<string, unknown>).propertyMockData;

// 2. 讀取 JSON 資料
const jsonRaw = readFileSync(JSON_PATH, 'utf8');
const jsonData = JSON.parse(jsonRaw);

// 移除 $schema 欄位進行比對
const { $schema, ...jsonDataClean } = jsonData;

// 3. 用標準庫 deepStrictEqual 比對
// 先 JSON.stringify → JSON.parse 確保兩邊結構相同（消除原型差異）
try {
  const normalizedMock = JSON.parse(JSON.stringify(mockData));
  const normalizedJson = JSON.parse(JSON.stringify(jsonDataClean));
  deepStrictEqual(normalizedMock, normalizedJson);
  handleScriptSuccess('check-ssot-sync', 'Mock ↔ JSON 完全同步');
  process.exit(0);
} catch (err) {
  handleScriptError('check-ssot-sync', err);
}
