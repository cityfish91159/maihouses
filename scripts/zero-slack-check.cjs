#!/usr/bin/env node
/**
 * zero-slack-check.cjs — Zero Slack Coder 強制檢查腳本
 *
 * 兩種觸發模式:
 *   1. 自動: PostToolUse hook 每次 Edit/Write 後執行 (掃描 git diff staged)
 *   2. 手動: 用戶執行 `node scripts/zero-slack-check.cjs --full` (掃描全專案)
 *
 * 任何 error = exit 1 = hook block AI
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const isFullScan = process.argv.includes('--full');

// ─── 顏色 ───
const c = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bgRed: '\x1b[41m\x1b[37m',
  bgGreen: '\x1b[42m\x1b[30m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(msg, color = 'reset') {
  console.error(`${c[color]}${msg}${c.reset}`);
}

function header(title) {
  console.error(`\n${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.error(`${c.bold} ${title}${c.reset}`);
  console.error(`${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
}

// ─── 取得要掃描的檔案 ───
function getTargetFiles() {
  if (isFullScan) {
    // 全專案掃描: src/ + api/ 下的 .ts/.tsx 檔案
    const result = [];
    const dirs = ['src', 'api'];
    for (const dir of dirs) {
      const dirPath = path.join(ROOT, dir);
      if (!fs.existsSync(dirPath)) continue;
      walkDir(dirPath, result);
    }
    return result;
  }

  // 自動模式: 掃描最近修改的檔案 (unstaged + staged)
  try {
    const diff = execSync('git diff --name-only --diff-filter=ACM HEAD', {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    const staged = execSync('git diff --cached --name-only --diff-filter=ACM', {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    const files = [...new Set([...diff.split('\n'), ...staged.split('\n')])]
      .filter((f) => f.trim() && /\.(ts|tsx)$/.test(f))
      .filter((f) => !f.includes('node_modules') && !f.includes('.test.'))
      .filter((f) => !isExcluded(f));
    return files;
  } catch {
    return [];
  }
}

// 排除清單：開發中模組或特殊檔案
const EXCLUDED_PATHS = [
  'src/pages/Muse/',
  'src/pages/Admin/GodView.tsx',
  'api/muse-chat.ts',
  'api/muse-voice.ts',
  'src/types/api.generated.ts',
];

function isExcluded(filePath) {
  return EXCLUDED_PATHS.some((ex) => filePath.startsWith(ex) || filePath === ex);
}

function walkDir(dir, result) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name === '.git') continue;
      if (isExcluded(rel + '/')) continue;
      walkDir(full, result);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.')) {
      if (isExcluded(rel)) continue;
      result.push(rel);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 檢查模組
// ═══════════════════════════════════════════════════════════════

let totalErrors = 0;
let totalWarnings = 0;
const violations = [];

function addError(file, line, rule, message) {
  totalErrors++;
  violations.push({ file, line, rule, message, level: 'error' });
}

function addWarning(file, line, rule, message) {
  totalWarnings++;
  violations.push({ file, line, rule, message, level: 'warn' });
}

// ─── 模組 3: 零半成品偵測 ───
const HALF_BAKED_PATTERNS = [
  { pattern: /:\s*any\b/, rule: 'no-any', msg: '禁止使用 : any 型別' },
  { pattern: /as\s+any\b/, rule: 'no-as-any', msg: '禁止使用 as any 型別斷言' },
  { pattern: /as\s+unknown\s+as\s+/, rule: 'no-double-assertion', msg: '禁止使用 as unknown as X 雙重斷言' },
  { pattern: /\/\/\s*TODO\b/i, rule: 'no-todo', msg: '禁止留下 TODO（必須當場實作）' },
  { pattern: /\/\/\s*FIXME\b/i, rule: 'no-fixme', msg: '禁止留下 FIXME（必須當場修完）' },
  { pattern: /\/\/\s*\.{3}\s*(rest|same|implement|remaining)/i, rule: 'no-placeholder', msg: '禁止 placeholder 註解' },
  { pattern: /console\.log\(/, rule: 'no-console-log', msg: '禁止 console.log（使用 logger）' },
  { pattern: /\/\/\s*@ts-ignore\b/, rule: 'no-ts-ignore', msg: '禁止 @ts-ignore（修根本問題）' },
];

// @ts-expect-error 無說明
const TS_EXPECT_NO_REASON = /\/\/\s*@ts-expect-error\s*$/;

// eslint-disable 無說明
const ESLINT_DISABLE_NO_REASON = /\/\/\s*eslint-disable(?:-next-line|-line)?\s*$/;
const ESLINT_DISABLE_WITH_RULE_NO_REASON = /\/\/\s*eslint-disable(?:-next-line|-line)?\s+[\w\/@-]+\s*$/;

function checkHalfBaked(file, lines) {
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    // 跳過純註解行中的 pattern（如 SKILL.md 引用）
    if (trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

    // 代碼模式規則：在 // 註解行中出現不算違規（只有 TODO/FIXME/ts-ignore 等註解指令才需要偵測 // 行）
    const isCommentLine = trimmed.startsWith('//');
    const CODE_ONLY_RULES = new Set(['no-any', 'no-as-any', 'no-double-assertion', 'no-console-log']);

    for (const { pattern, rule, msg } of HALF_BAKED_PATTERNS) {
      if (pattern.test(line)) {
        // 純註解行中的代碼模式不算違規
        if (isCommentLine && CODE_ONLY_RULES.has(rule)) continue;
        // 允許 any 在 Supabase 型別檔案中
        if (rule === 'no-any' && file.includes('supabase')) return;
        if (rule === 'no-any' && /SupabaseClient<any/.test(line)) return;
        // 允許在 type 定義檔中使用 any（第三方型別）
        if (rule === 'no-any' && file.includes('types/') && /type\s+\w+\s*=/.test(line)) return;
        addError(file, i + 1, rule, msg);
      }
    }

    // @ts-expect-error 無說明
    if (TS_EXPECT_NO_REASON.test(trimmed)) {
      addError(file, i + 1, 'ts-expect-no-reason', '@ts-expect-error 必須附上理由');
    }

    // eslint-disable 無說明（沒有指定規則名）
    if (ESLINT_DISABLE_NO_REASON.test(trimmed)) {
      addError(file, i + 1, 'eslint-disable-no-reason', 'eslint-disable 必須指定規則名和理由');
    }
  });
}

// ─── 模組 4: 安全碼刪除偵測（僅 diff 模式） ───
function checkSafetyDeletion() {
  if (isFullScan) return; // 全掃描模式不需要 diff 比對

  try {
    const diff = execSync('git diff HEAD', { cwd: ROOT, encoding: 'utf-8' });
    const deletedLines = diff
      .split('\n')
      .filter((l) => l.startsWith('-') && !l.startsWith('---'));

    const safetyPatterns = [
      { pattern: /try\s*\{/, name: 'try/catch' },
      { pattern: /\.safeParse\(/, name: 'Zod safeParse' },
      { pattern: /\.parse\(/, name: 'Zod parse' },
      { pattern: /auth\.uid\(\)/, name: 'auth.uid()' },
      { pattern: /encodeURIComponent\(/, name: 'encodeURIComponent' },
      { pattern: /sanitize/, name: 'sanitize 函數' },
    ];

    for (const line of deletedLines) {
      for (const { pattern, name } of safetyPatterns) {
        if (pattern.test(line)) {
          addWarning('(diff)', 0, 'safety-deletion', `偵測到刪除安全碼: ${name}`);
        }
      }
    }
  } catch {
    // 非 git 環境，跳過
  }
}

// ─── 模組 5: 大塊貼上偵測 ───
// 排除資料定義檔案的函數長度檢查（常數、mock、seed、configs 等）
const FUNC_LENGTH_SKIP_PATTERNS = [
  /constants\//,
  /mockData/,
  /mock\//,
  /seed/i,
  /configs?\./,
  /demo\//i,
  /\.demo\./,
  /story\./,
];

function checkChunkSize(file, lines) {
  // 排除資料/常數檔案的大小檢查
  const isDataFile = FUNC_LENGTH_SKIP_PATTERNS.some((p) => p.test(file)) || file.includes('persona');
  if (!isDataFile && lines.length > 800) {
    addWarning(file, 0, 'file-too-large', `檔案 ${lines.length} 行，建議拆分 (>800 行)`);
  }

  // 偵測單函數 >200 行（排除資料定義檔案）
  if (FUNC_LENGTH_SKIP_PATTERNS.some((p) => p.test(file))) return;
  let funcStart = -1;
  let braceDepth = 0;
  let funcName = '';

  lines.forEach((line, i) => {
    const funcMatch = line.match(/(?:function|const|export\s+(?:default\s+)?function)\s+(\w+)/);
    if (funcMatch && braceDepth === 0) {
      funcStart = i;
      funcName = funcMatch[1];
    }

    for (const ch of line) {
      if (ch === '{') braceDepth++;
      if (ch === '}') {
        braceDepth--;
        if (braceDepth === 0 && funcStart >= 0) {
          const funcLength = i - funcStart + 1;
          if (funcLength > 200) {
            addWarning(file, funcStart + 1, 'func-too-long', `函數 ${funcName} 共 ${funcLength} 行 (建議 <200)`);
          }
          funcStart = -1;
        }
      }
    }
  });
}

// ─── 模組 6: 上下文脫離偵測 ───
function checkContextDrift(file, lines) {
  // 硬編碼密鑰偵測
  const secretPatterns = [
    { pattern: /AIza[0-9A-Za-z_-]{35}/, name: 'Google API Key' },
    { pattern: /sk-[a-zA-Z0-9]{20,}/, name: 'OpenAI Key' },
    { pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]ey/, name: 'Supabase service_role' },
  ];

  // 前端代碼中禁止 service_role
  if (file.startsWith('src/')) {
    lines.forEach((line, i) => {
      if (/service_role/.test(line) && !line.trim().startsWith('//')) {
        addError(file, i + 1, 'no-service-role-client', '前端代碼禁止出現 service_role');
      }
    });
  }

  lines.forEach((line, i) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    for (const { pattern, name } of secretPatterns) {
      if (pattern.test(line)) {
        addError(file, i + 1, 'hardcoded-secret', `偵測到硬編碼密鑰: ${name}`);
      }
    }
  });
}

// ─── 新增: 錯誤處理品質檢查 ───
function checkErrorHandling(file, lines) {
  // 偵測空 catch
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    const nextLine = (lines[i + 1] || '').trim();
    if (/catch\s*\(/.test(line) && (nextLine === '}' || nextLine === '')) {
      addWarning(file, i + 1, 'empty-catch', '空的 catch 區塊，必須有錯誤處理邏輯');
    }
  }

  // 偵測禁止的錯誤文案
  const badErrorMessages = [
    { pattern: /['"]系統錯誤['"]/, msg: '禁止使用「系統錯誤」（改用「送出失敗」等具體描述）' },
    { pattern: /['"]Error['"]/, msg: '禁止使用英文 "Error" 作為用戶面向訊息' },
    { pattern: /['"]操作失敗['"]/, msg: '「操作失敗」太冷漠，改用更具體的描述' },
  ];

  lines.forEach((line, i) => {
    if (line.trim().startsWith('//')) return;
    for (const { pattern, msg } of badErrorMessages) {
      if (pattern.test(line) && /notify\.|toast\./.test(line)) {
        addWarning(file, i + 1, 'bad-error-msg', msg);
      }
    }
  });
}

// ─── 新增: A11y 最低標準檢查 ───
function checkA11y(file, lines) {
  if (!file.endsWith('.tsx')) return;

  lines.forEach((line, i) => {
    // 沒有 aria-label 的 icon-only button
    if (/<button\b/.test(line) && !lines.slice(i, i + 3).join(' ').includes('aria-label')) {
      // 檢查按鈕內是否有文字內容
      const btnContent = lines.slice(i, Math.min(i + 5, lines.length)).join(' ');
      if (/<button[^>]*>\s*<(?:svg|[A-Z])/.test(btnContent) && !/aria-label/.test(btnContent)) {
        addWarning(file, i + 1, 'a11y-button-label', 'icon-only button 必須有 aria-label');
      }
    }

    // img 沒有 alt（多行 JSX：檢查 <img 到 /> 之間是否有 alt）
    if (/<img\b/.test(line) && !/alt=/.test(line)) {
      // 往後最多看 10 行，尋找閉合 /> 或 alt=
      let hasAlt = false;
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (/alt=/.test(lines[j])) { hasAlt = true; break; }
        if (/\/>/.test(lines[j]) || />/.test(lines[j])) break;
      }
      if (!hasAlt) {
        addError(file, i + 1, 'a11y-img-alt', '<img> 必須有 alt 屬性');
      }
    }
  });
}

// ─── 新增: 文案術語檢查 ───
function checkCopyConsistency(file, lines) {
  if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;

  const termViolations = [
    { pattern: /['"`].*房仲.*['"`]/, correct: '經紀人', msg: '文案應使用「經紀人」而非「房仲」' },
    { pattern: /['"`].*預約參觀.*['"`]/, correct: '預約看屋', msg: '文案應使用「預約看屋」而非「預約參觀」' },
    { pattern: /['"`].*預約賞屋.*['"`]/, correct: '預約看屋', msg: '文案應使用「預約看屋」而非「預約賞屋」' },
  ];

  // 「您」偵測（JSX 字串中）
  lines.forEach((line, i) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

    // 術語檢查
    for (const { pattern, msg } of termViolations) {
      if (pattern.test(line)) {
        addWarning(file, i + 1, 'copy-term', msg);
      }
    }

    // 您 → 你 檢查（排除 code 和 comment）
    if (/['"`>].*您.*['"`<]/.test(line) && !/privacy|policy|法律|條款|隱私/i.test(line)) {
      addWarning(file, i + 1, 'copy-honorific', '全站統一使用「你」而非「您」');
    }
  });
}

// ─── 新增: 新增檔案無測試偵測 ───
function checkMissingTests(files) {
  for (const file of files) {
    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
    if (file.includes('.test.') || file.includes('__tests__')) continue;
    if (file.includes('types/') || file.includes('constants/')) continue;
    if (file.startsWith('supabase/')) continue;
    // 只檢查核心業務模組（services/hooks/lib/api/），排除 UI 組件和頁面
    const needsTest = file.includes('services/') || file.includes('hooks/') || file.includes('lib/') || file.startsWith('api/');
    if (!needsTest) continue;

    // 檢查是否有對應的測試檔
    const base = file.replace(/\.(tsx?)$/, '');
    const testVariants = [
      `${base}.test.ts`,
      `${base}.test.tsx`,
      path.join(path.dirname(file), '__tests__', path.basename(base) + '.test.ts'),
      path.join(path.dirname(file), '__tests__', path.basename(base) + '.test.tsx'),
    ];

    const hasTest = testVariants.some((t) => fs.existsSync(path.join(ROOT, t)));
    if (!hasTest) {
      // 只在全掃描模式下報告（自動模式太頻繁）
      if (isFullScan) {
        addWarning(file, 0, 'missing-test', '缺少對應的測試檔案');
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 主流程
// ═══════════════════════════════════════════════════════════════

console.error(`\n${c.magenta}${c.bold} zero-slack-coder 強制檢查 ${isFullScan ? '(全專案掃描)' : '(差異掃描)'}${c.reset}`);

const files = getTargetFiles();

if (files.length === 0) {
  log('\n 無檔案需要檢查', 'green');
  process.exit(0);
}

log(`\n 掃描 ${files.length} 個檔案...`, 'dim');

// 執行所有檢查模組
for (const file of files) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  checkHalfBaked(file, lines);
  checkChunkSize(file, lines);
  checkContextDrift(file, lines);
  checkErrorHandling(file, lines);
  checkA11y(file, lines);
  checkCopyConsistency(file, lines);
}

checkSafetyDeletion();
checkMissingTests(files);

// ═══════════════════════════════════════════════════════════════
// 報告
// ═══════════════════════════════════════════════════════════════

if (violations.length > 0) {
  header('違規清單');

  const errors = violations.filter((v) => v.level === 'error');
  const warnings = violations.filter((v) => v.level === 'warn');

  if (errors.length > 0) {
    log(`\n ${c.red}ERRORS (${errors.length})${c.reset} — 必須修復，否則 block`);
    for (const v of errors) {
      const loc = v.line > 0 ? `:${v.line}` : '';
      log(`  ${c.red}[${v.rule}]${c.reset} ${v.file}${loc}`, 'reset');
      log(`    ${v.message}`, 'dim');
    }
  }

  if (warnings.length > 0) {
    log(`\n ${c.yellow}WARNINGS (${warnings.length})${c.reset} — 建議修復`);
    const showAll = process.argv.includes('--verbose');
    const displayWarnings = showAll ? warnings : warnings.slice(0, 20);
    for (const v of displayWarnings) {
      const loc = v.line > 0 ? `:${v.line}` : '';
      log(`  ${c.yellow}[${v.rule}]${c.reset} ${v.file}${loc}`, 'reset');
      log(`    ${v.message}`, 'dim');
    }
    if (!showAll && warnings.length > 20) {
      log(`  ... 還有 ${warnings.length - 20} 個 warnings`, 'dim');
    }

    // 按規則分類統計
    const ruleCounts = {};
    for (const v of warnings) {
      ruleCounts[v.rule] = (ruleCounts[v.rule] || 0) + 1;
    }
    log(`\n ${c.cyan}Warning 分類統計:${c.reset}`);
    for (const [rule, count] of Object.entries(ruleCounts).sort((a, b) => b[1] - a[1])) {
      log(`  ${c.yellow}[${rule}]${c.reset} × ${count}`, 'reset');
    }
  }
}

console.error('');

if (totalErrors > 0) {
  console.error(`${c.bgRed} ZERO-SLACK FAILED: ${totalErrors} errors, ${totalWarnings} warnings ${c.reset}`);
  process.exit(1);
} else if (totalWarnings > 0) {
  console.error(`${c.yellow}${c.bold} ZERO-SLACK PASSED (${totalWarnings} warnings) ${c.reset}`);
  process.exit(0);
} else {
  console.error(`${c.bgGreen} ZERO-SLACK CLEAN ${c.reset}`);
  process.exit(0);
}
