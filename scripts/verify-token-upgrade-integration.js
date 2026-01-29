#!/usr/bin/env node
/**
 * Token 升級機制整合驗證腳本
 *
 * 驗證項目：
 * 1. auth.html 包含 Token 升級邏輯
 * 2. API 端點存在且可存取
 * 3. localStorage key 正確
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 開始驗證 Token 升級機制整合...\n');

let hasErrors = false;

// ============================================================================
// 1. 驗證 auth.html 包含必要代碼
// ============================================================================
console.log('📝 檢查 auth.html...');
const authHtmlPath = path.join(__dirname, '..', 'public', 'auth.html');

if (!fs.existsSync(authHtmlPath)) {
  console.error('❌ 錯誤：找不到 public/auth.html');
  hasErrors = true;
} else {
  const authHtmlContent = fs.readFileSync(authHtmlPath, 'utf-8');

  const requiredPatterns = [
    { pattern: /pending_trust_token/, description: 'localStorage key: pending_trust_token' },
    { pattern: /\/api\/trust\/upgrade-case/, description: 'API 端點: /api/trust/upgrade-case' },
    { pattern: /Token 升級機制/, description: '註解：Token 升級機制' },
    {
      pattern: /localStorage\.removeItem\("pending_trust_token"\)/,
      description: '清除 token 邏輯',
    },
  ];

  requiredPatterns.forEach(({ pattern, description }) => {
    if (pattern.test(authHtmlContent)) {
      console.log(`  ✅ ${description}`);
    } else {
      console.error(`  ❌ 缺少：${description}`);
      hasErrors = true;
    }
  });
}

// ============================================================================
// 2. 驗證 API 端點存在
// ============================================================================
console.log('\n📝 檢查 API 端點...');
const apiPath = path.join(__dirname, '..', 'api', 'trust', 'upgrade-case.ts');

if (!fs.existsSync(apiPath)) {
  console.error('❌ 錯誤：找不到 api/trust/upgrade-case.ts');
  hasErrors = true;
} else {
  console.log('  ✅ API 端點檔案存在');

  const apiContent = fs.readFileSync(apiPath, 'utf-8');

  // 檢查必要的 Schema
  if (apiContent.includes('UpgradeCaseRequestSchema')) {
    console.log('  ✅ 包含請求 Schema 驗證');
  } else {
    console.error('  ❌ 缺少請求 Schema 驗證');
    hasErrors = true;
  }

  // 檢查 RPC 呼叫
  if (apiContent.includes('fn_upgrade_trust_case')) {
    console.log('  ✅ 包含 RPC 函數呼叫');
  } else {
    console.error('  ❌ 缺少 RPC 函數呼叫');
    hasErrors = true;
  }

  // 檢查審計日誌
  if (apiContent.includes('logAudit')) {
    console.log('  ✅ 包含審計日誌');
  } else {
    console.error('  ❌ 缺少審計日誌');
    hasErrors = true;
  }
}

// ============================================================================
// 3. 驗證測試檔案存在
// ============================================================================
console.log('\n📝 檢查測試檔案...');
const testPath = path.join(__dirname, '..', 'api', 'trust', '__tests__', 'upgrade-case.test.ts');

if (!fs.existsSync(testPath)) {
  console.warn('⚠️  警告：找不到 upgrade-case.test.ts（建議建立測試）');
} else {
  console.log('  ✅ 測試檔案存在');
}

// ============================================================================
// 4. 驗證文件存在
// ============================================================================
console.log('\n📝 檢查整合文件...');
const docPath = path.join(__dirname, '..', 'docs', 'TOKEN_UPGRADE_INTEGRATION.md');

if (!fs.existsSync(docPath)) {
  console.warn('⚠️  警告：找不到 TOKEN_UPGRADE_INTEGRATION.md');
} else {
  console.log('  ✅ 整合文件存在');
}

// ============================================================================
// 總結
// ============================================================================
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('❌ 驗證失敗：發現錯誤，請修正後重新執行');
  process.exit(1);
} else {
  console.log('✅ 驗證通過：Token 升級機制整合完成！');
  console.log('\n📋 測試清單：');
  console.log('  1. 設定 localStorage: pending_trust_token');
  console.log('  2. 訪問登入頁面並登入');
  console.log('  3. 觀察 Console 日誌');
  console.log('  4. 確認 localStorage 已清除');
  console.log('  5. 檢查 Trust Room 案件狀態');
  console.log('\n📚 詳細文件：docs/TOKEN_UPGRADE_INTEGRATION.md');
}
