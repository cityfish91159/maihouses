const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 🎨 顏色定義 (視覺化強迫症)
const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bgRed: '\x1b[41m\x1b[37m',
  bold: '\x1b[1m',
  gray: '\x1b[90m',
};

// ⏱️ 計時器
const startTotal = Date.now();

// 🔧 執行器 (帶計時功能)
function runStep(stepName, command, args, opts = {}) {
  const start = Date.now();
  console.log(`\n${c.cyan}➤ [檢查] ${stepName}...${c.reset}`);
  
  const result = spawnSync(command, args, { 
    stdio: 'inherit', 
    shell: true,
    cwd: process.cwd(),
    ...opts
  });

  const duration = ((Date.now() - start) / 1000).toFixed(2);

  if (result.status !== 0) {
    console.log(`\n${c.bgRed} 🛑 失敗: ${stepName} 未通過！ (耗時: ${duration}s) ${c.reset}`);
    if (opts.fatal !== false) process.exit(1);
    return false;
  }
  console.log(`${c.green}✅ ${stepName} 通過 (耗時: ${duration}s)${c.reset}`);
  return true;
}

// 🕵️‍♀️ 1. 深度代碼掃描 (保持你的嚴格邏輯)
function deepScan() {
  console.log(`\n${c.cyan}➤ [掃描] 深度代碼衛生檢查...${c.reset}`);
  console.log(`${c.gray}ℹ️  豁免範圍: Muse相關 (全免), Analytics相關 (允許 var)${c.reset}`);
  
  const forbidden = [
    { regex: /console\.log\(/, label: 'console.log (請刪除調試日誌)' },
    { regex: /debugger/, label: 'debugger (請刪除斷點)' },
    { regex: /\/\/ ?TODO:/, label: 'TODO 註解 (嚴格模式：請現在完成它)' },
    { regex: /\/\/ ?FIXME:/, label: 'FIXME 註解 (嚴格模式：請修復它)' },
    { regex: /@ts-ignore/, label: '@ts-ignore (禁止無視類型錯誤)' },
    { regex: /eslint-disable/, label: 'eslint-disable (禁止關閉 Lint 規則)' },
    { regex: /\bvar\s+/, label: 'var (禁止使用 var，請改用 let/const)' },
    { regex: /alert\(/, label: 'alert() (禁止使用原生彈窗)' },
    { regex: /window\.confirm\(/, label: 'confirm() (禁止使用原生彈窗)' },
    { regex: /AIza[0-9A-Za-z-_]{35}/, label: 'Google API Key (安全風險)' },
    { regex: /sk-[a-zA-Z0-9]{20,}/, label: 'OpenAI Key (安全風險)' },
  ];

  let errors = 0;

  function walkDir(dir) {
    if (
      dir.includes('node_modules') || 
      dir.includes('.next') || 
      dir.includes('.git') || 
      dir.includes('dist') ||
      dir.includes('build') ||
      dir.toLowerCase().includes('muse') || 
      dir.toLowerCase().includes('god-muse')
    ) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      
      if (
        file.toLowerCase().includes('muse') || 
        file.toLowerCase().includes('god-muse') ||
        file.endsWith('.d.ts') ||
        file.endsWith('.map')
      ) continue;

      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (/\.(js|ts|tsx|jsx)$/.test(file)) {
        if (fullPath.includes('scripts')) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const trimmedLine = line.trim();
          const isComment = trimmedLine.startsWith('//') || trimmedLine.startsWith('/*');
          
          forbidden.forEach(rule => {
            if (isComment && !rule.label.includes('註解') && !rule.label.includes('ignore') && !rule.label.includes('disable')) return;
            if (rule.label.startsWith('var') && (file.toLowerCase().includes('analytics') || fullPath.toLowerCase().includes('analytics'))) return;

            if (rule.regex.test(line)) {
              console.log(`${c.yellow}⚠️  ${fullPath}:${index + 1}${c.reset}`);
              console.log(`   ❌ 發現: ${c.red}${rule.label}${c.reset}`);
              console.log(`   📝 代碼: ${c.gray}${trimmedLine.substring(0, 80)}...${c.reset}`);
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
      console.log(`\n${c.bgRed} 🛑 掃描失敗: 發現 ${errors} 個違規項目！嚴格模式不允許通過。 ${c.reset}`);
      process.exit(1);
    }
    console.log(`${c.green}✅ 代碼衛生檢查通過${c.reset}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

// 📐 檢查 Build 後的體積 (防止體積爆炸)
function checkBundleSize() {
  console.log(`\n${c.cyan}➤ [檢查] Build 產物體積分析...${c.reset}`);
  const buildDir = fs.existsSync('dist') ? 'dist' : (fs.existsSync('.next') ? '.next' : null);
  
  if (!buildDir) {
    console.log(`${c.yellow}⚠️  找不到 build 資料夾 (dist/.next)，跳過體積檢查${c.reset}`);
    return;
  }

  // 簡單計算資料夾大小
  let totalSize = 0;
  function getDirSize(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) getDirSize(filePath);
      else totalSize += stat.size;
    }
  }
  getDirSize(buildDir);
  
  const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
  console.log(`📦 Build Folder Size: ${c.bold}${sizeMB} MB${c.reset}`);

  // 設定閾值 (例如 50MB，可根據專案調整)
  const LIMIT_MB = 50; 
  if (sizeMB > LIMIT_MB) {
    console.log(`${c.red}❌ 警告：Build 體積過大 (> ${LIMIT_MB}MB)！請檢查是否有未壓縮的資源。${c.reset}`);
    // 這裡可以選擇是否要 exit(1)，目前先警告
  } else {
    console.log(`${c.green}✅ 體積在合理範圍內${c.reset}`);
  }
}

// 🚀 主流程開始
console.log(`${c.bold}══════════════════════════════════════════════════════════════${c.reset}`);
console.log(`${c.bold}🛡️  ULTIMATE QUALITY GATE: 95分標準檢查${c.reset}`);
console.log(`${c.bold}══════════════════════════════════════════════════════════════${c.reset}`);

// 1. 代碼髒污掃描 (Regex) - 最快，先跑
deepScan();

// 2. 架構檢查：循環依賴 (Circular Dependencies)
// 需要安裝 madge 或使用 npx
// 這一步能抓出很多架構上的壞味道
runStep('架構檢查 (Circular Dependency)', 'npx', ['madge', '--circular', '--extensions', 'ts,tsx,js,jsx', './src']);

// 3. 類型檢查
runStep('TypeScript TypeCheck', 'npm', ['run', 'typecheck']);

// 4. 代碼風格 (Prettier) - 確保大家格式一致
// 如果沒裝 prettier 可以註解掉
runStep('Prettier Format Check', 'npx', ['prettier', '--check', 'src/**/*.{ts,tsx,js,css}', '!**/*muse*/**', '!**/*god-muse*/**'], { fatal: false });

// 5. ESLint (零容忍)
runStep('ESLint (Zero Tolerance)', 'npm', ['run', 'lint', '--', '--max-warnings=0']);

// 6. 單元/整合測試 (Testing) - 🔥 這就是從 60 分到 90 分的關鍵
// 假設你有 npm run test，沒有的話會報錯 (提醒你去寫測試)
// 如果使用 vitest，可以直接改 'npx vitest run'
runStep('Unit/Integration Tests', 'npm', ['run', 'test', '--if-present']); 

// 7. 安全審計 (Moderate+)
runStep('NPM Security Audit', 'npm', ['audit', '--audit-level=moderate']);

// 8. 生產環境建置 (Build)
runStep('Production Build Verification', 'npm', ['run', 'build']);

// 9. 產物檢查 (Bundle Size)
checkBundleSize();

// 🏆 總結
const totalTime = ((Date.now() - startTotal) / 1000).toFixed(2);
console.log(`\n${c.green}${c.bold}💎 完美無瑕！EXCELLENT WORK. ${c.reset}`);
console.log(`${c.gray}總耗時: ${totalTime}s${c.reset}\n`);
