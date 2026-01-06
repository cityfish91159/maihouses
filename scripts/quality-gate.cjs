#!/usr/bin/env node
/**
 * Quality Gate Script - Claude Code Stop Hook
 *
 * 執行品質檢查，任何失敗都會阻止 Claude 回應
 * 這是 Layer 1 防護，無法被 AI 修改繞過
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 顏色輸出
const c = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(msg, color = 'reset') {
  console.error(`${c[color]}${msg}${c.reset}`);
}

// ═══════════════════════════════════════════════════════════════
// 檢查項目
// ═══════════════════════════════════════════════════════════════

const checks = [];
let hasError = false;

// 1. TypeScript 檢查
log('\n[1/3] TypeScript 類型檢查...', 'cyan');
try {
  execSync('npm run typecheck', { cwd: ROOT, stdio: 'pipe' });
  checks.push({ name: 'TypeScript', status: 'pass' });
  log('  ✓ 通過', 'green');
} catch (err) {
  checks.push({ name: 'TypeScript', status: 'fail', error: err.stdout?.toString() || err.message });
  log('  ✗ 失敗', 'red');
  hasError = true;
}

// 2. ESLint 檢查 (只檢查 error，忽略 warning)
log('\n[2/3] ESLint 錯誤檢查...', 'cyan');
try {
  const lintOutput = execSync('npm run lint 2>&1', { cwd: ROOT, encoding: 'utf-8' });

  // 解析錯誤數量
  const errorMatch = lintOutput.match(/(\d+)\s+error/);
  const errorCount = errorMatch ? parseInt(errorMatch[1], 10) : 0;

  if (errorCount > 0) {
    checks.push({ name: 'ESLint', status: 'fail', error: `${errorCount} errors` });
    log(`  ✗ ${errorCount} 個錯誤`, 'red');
    hasError = true;
  } else {
    checks.push({ name: 'ESLint', status: 'pass' });
    log('  ✓ 無錯誤 (warnings 忽略)', 'green');
  }
} catch (err) {
  // lint 失敗時檢查輸出
  const output = err.stdout?.toString() || '';
  const errorMatch = output.match(/(\d+)\s+error/);
  const errorCount = errorMatch ? parseInt(errorMatch[1], 10) : 0;

  if (errorCount > 0) {
    checks.push({ name: 'ESLint', status: 'fail', error: `${errorCount} errors` });
    log(`  ✗ ${errorCount} 個錯誤`, 'red');
    hasError = true;
  } else {
    // 可能是其他錯誤
    checks.push({ name: 'ESLint', status: 'fail', error: err.message });
    log(`  ✗ 執行失敗: ${err.message}`, 'red');
    hasError = true;
  }
}

// 3. 檢查 staged 檔案中的 console.log
log('\n[3/3] console.log 檢查...', 'cyan');
try {
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
    cwd: ROOT,
    encoding: 'utf-8'
  }).split('\n').filter(f => f.trim() && (f.endsWith('.ts') || f.endsWith('.tsx')));

  let consoleLogCount = 0;
  const filesWithConsoleLog = [];

  // 排除的目錄（開發/調試用頁面）
  const EXCLUDED_PATHS = [
    'src/pages/Muse/',
    'src/pages/Admin/GodView',
  ];

  for (const file of stagedFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    if (file.includes('.test.') || file.includes('__tests__')) continue;
    // 排除 Muse 和 GodView 頁面
    if (EXCLUDED_PATHS.some(p => file.includes(p))) continue;

    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, i) => {
      if (line.trim().startsWith('//')) return;
      if (/console\.log\(/.test(line)) {
        consoleLogCount++;
        filesWithConsoleLog.push(`${file}:${i + 1}`);
      }
    });
  }

  if (consoleLogCount > 0) {
    checks.push({ name: 'console.log', status: 'warn', count: consoleLogCount });
    log(`  ⚠ ${consoleLogCount} 個 console.log (staged files)`, 'yellow');
    filesWithConsoleLog.slice(0, 5).forEach(f => log(`    ${f}`, 'yellow'));
    // 警告但不阻止
  } else {
    checks.push({ name: 'console.log', status: 'pass' });
    log('  ✓ 無 console.log', 'green');
  }
} catch {
  // git 錯誤時跳過此檢查
  checks.push({ name: 'console.log', status: 'skip' });
  log('  ⏭ 跳過 (非 git 環境)', 'cyan');
}

// ═══════════════════════════════════════════════════════════════
// 結果輸出
// ═══════════════════════════════════════════════════════════════

log('\n' + '═'.repeat(50), hasError ? 'red' : 'green');

if (hasError) {
  log('❌ QUALITY GATE FAILED', 'red');
  log('', 'reset');
  checks.filter(c => c.status === 'fail').forEach(c => {
    log(`  • ${c.name}: ${c.error || 'failed'}`, 'red');
  });
  log('', 'reset');
  log('請修復以上問題後再繼續', 'yellow');
  log('═'.repeat(50) + '\n', 'red');
  process.exit(1);
}

log('✅ QUALITY GATE PASSED', 'green');
log('═'.repeat(50) + '\n', 'green');
process.exit(0);
