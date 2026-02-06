#!/usr/bin/env node
/**
 * 🔒 LOCKED FILE: DO NOT EDIT
 * This script is read-only. Any attempt to modify it will fail.
 * Quality Gate Script - Enhanced
 * 執行品質檢查，任何失敗都會阻止提交/回應。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 顏色與格式
const c = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(msg, color = 'reset') {
  console.error(`${c[color]}${msg}${c.reset}`);
}

function header(title) {
  console.error(`\n${c.cyan}══════════════════════════════════════════════════════${c.reset}`);
  console.error(`${c.bold} ${title}${c.reset}`);
  console.error(`${c.cyan}══════════════════════════════════════════════════════${c.reset}`);
}

const checks = [];
let hasError = false;

// ═══════════════════════════════════════════════════════════════
// 1. TypeScript 檢查
// ═══════════════════════════════════════════════════════════════
header('[1/4] TypeScript 類型檢查');
try {
  // 使用 --noEmit 加快檢查速度，不產生檔案
  execSync('npm run typecheck', { cwd: ROOT, stdio: 'pipe' });
  checks.push({ name: 'TypeScript', status: 'pass' });
  log(' ✅ 通過', 'green');
} catch (err) {
  const output = err.stdout?.toString() || err.message;
  // 擷取前幾行錯誤，避免洗版
  const shortError = output.split('\n').slice(0, 5).join('\n') + '\n... (more)';
  checks.push({ name: 'TypeScript', status: 'fail', error: 'Type check failed' });
  log(' ❌ 失敗', 'red');
  console.error(c.yellow + shortError + c.reset);
  hasError = true;
}

// ═══════════════════════════════════════════════════════════════
// 2. ESLint 檢查 (使用 JSON 模式解析，更精準)
// ═══════════════════════════════════════════════════════════════
header('[2/4] ESLint 錯誤檢查');
try {
  // 嘗試強制輸出 JSON 格式以便解析
  const lintCmd = 'npm run lint -- --format json';
  const lintOutput = execSync(lintCmd, { cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });

  const results = JSON.parse(lintOutput || '[]');
  const totalErrors = results.reduce((acc, curr) => acc + curr.errorCount, 0);

  if (totalErrors > 0) {
    checks.push({ name: 'ESLint', status: 'fail', error: `${totalErrors} errors` });
    log(` ❌ 發現 ${totalErrors} 個錯誤`, 'red');
    hasError = true;
  } else {
    checks.push({ name: 'ESLint', status: 'pass' });
    log(' ✅ 無錯誤', 'green');
  }
} catch (err) {
  try {
    const output = err.stdout?.toString();
    if (output && output.trim().startsWith('[')) {
       const results = JSON.parse(output);
       const totalErrors = results.reduce((acc, curr) => acc + curr.errorCount, 0);
       if (totalErrors > 0) {
         checks.push({ name: 'ESLint', status: 'fail', error: `${totalErrors} errors` });
         log(` ❌ 發現 ${totalErrors} 個錯誤`, 'red');
         hasError = true;
       }
    } else {
       // 如果不是 JSON，可能是指令錯誤，顯示原始訊息
       checks.push({ name: 'ESLint', status: 'fail', error: 'Lint command failed' });
       log(` ❌ Lint 執行失敗 (非代碼錯誤): ${err.message}`, 'red');
       hasError = true;
    }
  } catch (parseErr) {
    checks.push({ name: 'ESLint', status: 'fail', error: 'Execution failed' });
    log(` ❌ 執行失敗或解析錯誤`, 'red');
    hasError = true;
  }
}

// 取得 Staged Files (供後續步驟使用)
let stagedFiles = [];
try {
  stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
    cwd: ROOT,
    encoding: 'utf-8'
  }).split('\n').filter(f => f.trim());
} catch (e) {
  // 如果不在 git 環境，這步跳過
}

// ═══════════════════════════════════════════════════════════════
// 3. 敏感資訊與 console.log 檢查 (掃描 Staged Files)
// ═══════════════════════════════════════════════════════════════
header('[3/4] 代碼內容掃描 (Logs & Secrets)');

if (stagedFiles.length > 0) {
  let consoleLogCount = 0;
  let secretCount = 0;
  const filesWithConsoleLog = [];
  const filesWithSecrets = [];

  // 敏感關鍵字 Regex (簡易版)
  const secretPatterns = [
    /AIza[0-9A-Za-z-_]{35}/, // Google API Key
    /sk-[a-zA-Z0-9]{20,}/,   // OpenAI Key
    /AWS_ACCESS_KEY_ID/,
    /Authorization:\s*Bearer/i
  ];

  for (const file of stagedFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    // 只檢查代碼檔
    if (!/\.(ts|tsx|js|jsx|cjs|mjs|py|go|env)$/.test(file)) continue;
    // 排除 scripts 資料夾（工具腳本可以有 console.log）
    if (file.startsWith('scripts/')) continue;

    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('#')) return;

      // Check: console.log
      if (/console\.log\(/.test(line)) {
        consoleLogCount++;
        filesWithConsoleLog.push(`${file}:${i + 1}`);
      }

      // Check: Secrets (排除有 nosemgrep 註釋的行)
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const hasNosemgrep = prevLine.includes('nosemgrep:') || trimmed.includes('nosemgrep:');

      if (!hasNosemgrep) {
        for (const pattern of secretPatterns) {
          if (pattern.test(line)) {
              secretCount++;
              filesWithSecrets.push(`${file}:${i + 1}`);
          }
        }
      }
    });
  }

  if (secretCount > 0) {
    checks.push({ name: 'Security', status: 'fail', error: 'Secrets detected' });
    log(` ❌ 發現 ${secretCount} 個潛在敏感資訊 (API Keys)!`, 'red');
    filesWithSecrets.forEach(f => log(`    ${f}`, 'red'));
    hasError = true;
  } else {
    checks.push({ name: 'Security', status: 'pass' });
    log(' ✅ 安全掃描通過', 'green');
  }

  if (consoleLogCount > 0) {
    checks.push({ name: 'console.log', status: 'warn', count: consoleLogCount });
    log(` ⚠️ 發現 ${consoleLogCount} 個 console.log`, 'yellow');
    filesWithConsoleLog.slice(0, 5).forEach(f => log(`    ${f}`, 'yellow'));
  } else {
    checks.push({ name: 'console.log', status: 'pass' });
    log(' ✅ 無 console.log', 'green');
  }

} else {
  log(' ⏭ 無 staged files，跳過內容掃描', 'cyan');
}

// ═══════════════════════════════════════════════════════════════
// 4. 總結
// ═══════════════════════════════════════════════════════════════

console.log('\n');
if (hasError) {
  console.log(c.bgRed + ' 🛑 QUALITY GATE FAILED ' + c.reset);
  process.exit(1);
} else {
  console.log(c.green + c.bold + ' 🚀 QUALITY GATE PASSED ' + c.reset);
  process.exit(0);
}
