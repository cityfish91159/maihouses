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
  bgRed: '\x1b[41m\x1b[37m',
  bold: '\x1b[1m',
  gray: '\x1b[90m',
};

// 🔧 執行器
function runStep(stepName, command, args) {
  console.log(`\n${c.cyan}➤ [檢查] ${stepName}...${c.reset}`);
  
  const result = spawnSync(command, args, { 
    stdio: 'inherit', 
    shell: true,
    cwd: process.cwd() 
  });

  if (result.status !== 0) {
    console.log(`\n${c.bgRed} 🛑 失敗: ${stepName} 未通過！ ${c.reset}`);
    process.exit(1);
  }
  console.log(`${c.green}✅ ${stepName} 通過${c.reset}`);
}

// 🕵️‍♀️ 深度代碼掃描 (嚴格版)
function deepScan() {
  console.log(`\n${c.cyan}➤ [掃描] 深度代碼衛生檢查 (Dirty Code & Cheating)...${c.reset}`);
  console.log(`${c.gray}ℹ️  已豁免 'muse' / 'god-muse' 相關檔案${c.reset}`);
  
  const forbidden = [
    // 基本髒亂
    { regex: /console\.log\(/, label: 'console.log (請刪除調試日誌)' },
    { regex: /debugger/, label: 'debugger (請刪除斷點)' },
    
    // 禁止作弊 (這是最嚴格的一條)
    { regex: /@ts-ignore/, label: '@ts-ignore (禁止無視類型錯誤，請修正它)' },
    { regex: /eslint-disable/, label: 'eslint-disable (禁止關閉 Lint 規則)' },
    
    // 老舊或危險語法
    { regex: /\bvar\s+/, label: 'var (禁止使用 var，請改用 let 或 const)' },
    { regex: /alert\(/, label: 'alert() (禁止使用原生彈窗)' },
    
    // 金鑰洩漏
    { regex: /AIza[0-9A-Za-z-_]{35}/, label: 'Google API Key (安全風險)' },
    { regex: /sk-[a-zA-Z0-9]{20,}/, label: 'OpenAI Key (安全風險)' },
  ];

  let errors = 0;

  function walkDir(dir) {
    // 1. 資料夾層級過濾 (加速掃描)
    if (
      dir.includes('node_modules') || 
      dir.includes('.next') || 
      dir.includes('.git') || 
      dir.includes('dist') ||
      dir.includes('build') ||
      dir.includes('coverage') ||
      dir.toLowerCase().includes('muse') || // 🔥 豁免 muse
      dir.toLowerCase().includes('god-muse') // 🔥 豁免 god-muse
    ) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      
      // 2. 檔案名稱層級過濾
      if (
        file.toLowerCase().includes('muse') || 
        file.toLowerCase().includes('god-muse') ||
        file.endsWith('.d.ts') || // 跳過定義檔
        file.includes('eslint') // 跳過 eslint 設定檔
      ) continue;

      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (/\.(js|ts|tsx|jsx)$/.test(file)) {
        // 跳過腳本自己
        if (fullPath.includes('scripts')) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // 忽略一般註解，但如果有 TODO/FIXME/ts-ignore 還是要抓
          const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*');
          
          forbidden.forEach(rule => {
            // 如果是註解行，但規則不是針對註解的 (ex: console.log)，就跳過
            if (isComment && !rule.label.includes('註解') && !rule.label.includes('ignore') && !rule.label.includes('disable')) return;

            if (rule.regex.test(line)) {
              console.log(`${c.yellow}⚠️  ${fullPath}:${index + 1}${c.reset}`);
              console.log(`   ❌ 發現: ${c.red}${rule.label}${c.reset}`);
              console.log(`   📝 代碼: ${c.gray}${line.trim().substring(0, 80)}...${c.reset}`);
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

// 🚀 執行流程
console.log(`${c.bold}══════════════════════════════════════════${c.reset}`);
console.log(`${c.bold}🛡️  SUPER HARD GATE: 極限嚴格模式${c.reset}`);
console.log(`${c.bold}══════════════════════════════════════════${c.reset}`);

// 1. 代碼髒污掃描 (包含 ts-ignore 檢查)
deepScan();

// 2. TypeScript 類型檢查
runStep('TypeScript TypeCheck', 'npm', ['run', 'typecheck']);

// 3. ESLint 檢查 (禁止任何警告)
// --max-warnings=0: 只要有一個 warning 就當作 error
runStep('ESLint (Zero Tolerance)', 'npm', ['run', 'lint', '--', '--max-warnings=0']);

// 4. NPM 安全審計 (中度風險以上全部擋掉)
// 原本是 high，現在改 moderate，更嚴格
runStep('NPM Security Audit (Moderate+)', 'npm', ['audit', '--audit-level=moderate']);

// 5. Build 測試 (Vite)
runStep('Production Build Test', 'npm', ['run', 'build']);

console.log(`\n${c.green}${c.bold}💎 完美無瑕！代碼品質極高。允許部署。${c.reset}\n`);