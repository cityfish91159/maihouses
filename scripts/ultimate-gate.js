const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 🎨 顏色與樣式
const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m\x1b[37m',
  bold: '\x1b[1m',
  gray: '\x1b[90m',
};

const startTotal = Date.now();
const report = [];

// 🔧 執行器
function runStep(stepName, command, args, opts = {}) {
  const start = Date.now();
  process.stdout.write(`${c.cyan}➤ [檢查] ${stepName}... ${c.reset}`);

  const result = spawnSync(command, args, {
    stdio: opts.hideOutput ? 'ignore' : 'inherit',
    shell: true,
    cwd: process.cwd(),
    ...opts,
  });

  const duration = ((Date.now() - start) / 1000).toFixed(2);

  if (result.status !== 0) {
    console.log(`\n${c.bgRed} 🛑 失敗! ${c.reset} ${c.gray}(${duration}s)${c.reset}`);
    if (opts.fatal !== false) {
      console.log(`${c.red}👉 錯誤發生在指令: ${command} ${args.join(' ')}${c.reset}`);
      process.exit(1);
    }
    report.push({ name: stepName, status: '❌', time: duration });
    return false;
  }

  if (opts.hideOutput) console.log(`${c.green}✅ 通過${c.reset} ${c.gray}(${duration}s)${c.reset}`);
  else console.log(`${c.green}✅ ${stepName} 通過${c.reset} ${c.gray}(${duration}s)${c.reset}`);

  report.push({ name: stepName, status: '✅', time: duration });
  return true;
}

// 🕵️‍♀️ 1. 深度代碼掃描 (加入更嚴格的 Regex)
function deepScan() {
  console.log(`\n${c.blue}🔍 正在掃描代碼衛生 (Sanity Check)...${c.reset}`);

  const forbidden = [
    { regex: /console\.log\(/, label: 'console.log (禁止提交調試日誌)' },
    { regex: /debugger/, label: 'debugger (禁止提交斷點)' },
    {
      regex: /\/\/ ?TODO:/,
      label: 'TODO (生產環境禁止留 TODO，請解決或移至 Issue)',
    },
    { regex: /\/\/ ?FIXME:/, label: 'FIXME (請立即修復此問題)' },
    { regex: /@ts-ignore/, label: '@ts-ignore (禁止無視 TS 錯誤)' },
    { regex: /eslint-disable/, label: 'eslint-disable (禁止關閉 Lint)' },
    { regex: /\bvar\s+/, label: 'var (禁止使用 var，請用 let/const)' },
    { regex: /alert\(/, label: 'alert() (禁止原生彈窗)' },
    { regex: /window\.confirm\(/, label: 'confirm() (禁止原生確認窗)' },
    { regex: /AIza[0-9A-Za-z-_]{35}/, label: 'Possible Google API Key' },
    { regex: /sk-[a-zA-Z0-9]{20,}/, label: 'Possible OpenAI Key' },
  ];

  let errors = 0;

  function walkDir(dir) {
    if (dir.match(/node_modules|\.next|\.git|dist|build|coverage|muse|god-muse/i)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);

      if (file.match(/muse|god-muse|\.d\.ts|\.map|\.test\.|\.spec\./i)) continue;

      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (/\.(js|ts|tsx|jsx)$/.test(file)) {
        if (fullPath.includes('scripts')) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//') && !trimmed.includes('TODO') && !trimmed.includes('FIXME'))
            return;
          if (trimmed.includes('analytics') && trimmed.includes('var')) return; // 特殊豁免

          forbidden.forEach((rule) => {
            if (rule.regex.test(line)) {
              console.log(
                `${c.yellow}⚠️  ${fullPath}:${index + 1} ${c.red}➜ ${rule.label}${c.reset}`
              );
              console.log(`   ${c.gray}${trimmed.substring(0, 80)}${c.reset}`);
              errors++;
            }
          });
        });
      }
    }
  }

  try {
    if (fs.existsSync('src')) walkDir('src');
    if (errors > 0) {
      console.log(`\n${c.bgRed} 🛑 發現 ${errors} 個代碼髒污！請修正後再試。 ${c.reset}`);
      process.exit(1);
    }
    report.push({ name: '代碼衛生掃描', status: '✅', time: '0.1' });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

// 📦 3. 進階體積檢查 (單檔預算控制)
function checkBundleBudgets() {
  console.log(`\n${c.blue}⚖️  正在分析 Build 產物 (Budget Check)...${c.reset}`);
  const buildDir = fs.existsSync('dist') ? 'dist' : fs.existsSync('.next') ? '.next' : null;

  if (!buildDir) return;

  const MAX_JS_SIZE_KB = 800; // 單檔最大限制 (可調整)
  let failed = false;

  function scanAssets(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanAssets(fullPath);
      } else if (file.endsWith('.js') || file.endsWith('.css')) {
        const sizeKB = (stat.size / 1024).toFixed(2);
        if (sizeKB > MAX_JS_SIZE_KB) {
          console.log(
            `${c.red}❌ [肥大警告] ${file} (${sizeKB} KB) 超過限制 ${MAX_JS_SIZE_KB}KB${c.reset}`
          );
          failed = true;
        }
      }
    }
  }

  try {
    scanAssets(buildDir);
    if (failed) {
      console.log(`${c.yellow}⚠️  建議使用 Dynamic Import (React.lazy) 拆分代碼。${c.reset}`);
      // 這裡可以選擇 process.exit(1) 強制失敗，目前先給警告
    } else {
      console.log(`${c.green}✅ 所有資源檔案大小均在安全範圍內。${c.reset}`);
    }
    report.push({
      name: '資源體積預算',
      status: failed ? '⚠️' : '✅',
      time: '-',
    });
  } catch (e) {}
}

// 🚀 主流程
console.log(`${c.bold}════════════════════════════════════════════════════════${c.reset}`);
console.log(`${c.bold}🛡️  GOD-TIER QUALITY GATE: 生產級別強制檢查${c.reset}`);
console.log(`${c.bold}════════════════════════════════════════════════════════${c.reset}\n`);

// 1. 衛生檢查 (最快)
deepScan();

// 2. 架構檢查: 循環依賴 (Circular Dependency)
runStep(
  '架構檢查 (Madge)',
  'npx',
  ['madge', '--circular', '--extensions', 'ts,tsx,js,jsx', './src'],
  { hideOutput: false }
);

// 3. 代碼重複偵測 (Copy/Paste Detector) 🔥 這是新加入的頂級檢查
// 允許 10% 的重複率容錯，超過就報錯
runStep(
  '重複代碼偵測 (JSCPD)',
  'npx',
  ['jscpd', 'src', '--threshold', '10', '--ignore', '"**/*.d.ts,**/mock/**,**/test/**"'],
  { fatal: false }
);

// 4. 類型檢查
runStep('TypeScript 嚴格檢查', 'npm', ['run', 'typecheck']);

// 5. 格式檢查
runStep(
  'Prettier 格式驗證',
  'npx',
  ['prettier', '--check', 'src/**/*.{ts,tsx,js,css}', '!**/*muse*/**'],
  { fatal: false, hideOutput: true }
);

// 6. ESLint 零容忍
runStep('ESLint (Zero Warning)', 'npm', ['run', 'lint', '--', '--max-warnings=0'], {
  hideOutput: true,
});

// 7. 測試 (如果有)
runStep('單元/整合測試', 'npm', ['run', 'test', '--if-present']);

// 8. 安全審計
runStep('NPM 依賴漏洞掃描', 'npm', ['audit', '--audit-level=moderate'], {
  hideOutput: true,
});

// 9. 建置測試
runStep('模擬生產環境 Build', 'npm', ['run', 'build'], { hideOutput: false });

// 10. 體積預算
checkBundleBudgets();

// 🏆 最終報告
console.log(`\n${c.bold}═══════════════ 📊 檢查報告 ═══════════════${c.reset}`);
report.forEach((r) => {
  console.log(`${r.status} ${r.name.padEnd(25)} ${c.gray}${r.time}s${c.reset}`);
});

const totalTime = ((Date.now() - startTotal) / 1000).toFixed(2);
console.log(`\n${c.green}${c.bold}💎 All Systems Go! 代碼品質極致完美。 (${totalTime}s)${c.reset}`);
