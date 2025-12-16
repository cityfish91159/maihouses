/**
 * D5 修正：Mock ↔ JSON 同步檢查
 * 
 * 用途：
 * 1. 確保 property-data.js (Mock) 和 seed-property-page.json 結構一致
 * 2. pre-commit 自動檢查，防止不同步
 * 
 * 邏輯：
 * 1. 讀取 property-data.js，用 VM 執行取得 window.propertyMockData
 * 2. 讀取 seed-property-page.json
 * 3. Deep equal 比對 default 資料集
 * 4. 不一致就報錯並列出差異
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createContext, runInContext } from 'vm';

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

// 3. Deep equal 比對
function deepEqual(a: unknown, b: unknown, path = ''): string[] {
  const errors: string[] = [];
  
  if (typeof a !== typeof b) {
    errors.push(`${path}: 類型不同 (Mock: ${typeof a}, JSON: ${typeof b})`);
    return errors;
  }
  
  if (a === null || b === null) {
    if (a !== b) {
      errors.push(`${path}: 值不同 (Mock: ${a}, JSON: ${b})`);
    }
    return errors;
  }
  
  if (typeof a !== 'object') {
    if (a !== b) {
      errors.push(`${path}: 值不同 (Mock: "${a}", JSON: "${b}")`);
    }
    return errors;
  }
  
  if (Array.isArray(a) !== Array.isArray(b)) {
    errors.push(`${path}: 一個是陣列，一個不是`);
    return errors;
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      errors.push(`${path}: 陣列長度不同 (Mock: ${a.length}, JSON: ${b.length})`);
    }
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      errors.push(...deepEqual(a[i], b[i], `${path}[${i}]`));
    }
    return errors;
  }
  
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj).sort();
  const bKeys = Object.keys(bObj).sort();
  
  const missingInJson = aKeys.filter(k => !bKeys.includes(k));
  const missingInMock = bKeys.filter(k => !aKeys.includes(k));
  
  for (const key of missingInJson) {
    errors.push(`${path}.${key}: Mock 有但 JSON 沒有`);
  }
  for (const key of missingInMock) {
    errors.push(`${path}.${key}: JSON 有但 Mock 沒有`);
  }
  
  for (const key of aKeys.filter(k => bKeys.includes(k))) {
    errors.push(...deepEqual(aObj[key], bObj[key], path ? `${path}.${key}` : key));
  }
  
  return errors;
}

const errors = deepEqual(mockData, jsonDataClean);

if (errors.length > 0) {
  console.error('❌ Mock ↔ JSON 不同步！發現以下差異：\n');
  errors.slice(0, 20).forEach(err => console.error(`  • ${err}`));
  if (errors.length > 20) {
    console.error(`\n  ... 還有 ${errors.length - 20} 個差異`);
  }
  console.error('\n請確保 property-data.js 和 seed-property-page.json 內容一致！');
  process.exit(1);
} else {
  console.log('✅ Mock ↔ JSON 完全同步！');
  console.log('   • property-data.js');
  console.log('   • seed-property-page.json');
}
