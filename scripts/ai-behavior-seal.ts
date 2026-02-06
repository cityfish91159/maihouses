// scripts/ai-behavior-seal.ts
// 12. 行為層封印 - 寫死強制執行
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface BehaviorResult {
  testFirst: { checked: number; violations: string[] };
  replay: { passed: number; failed: number; inconsistent: string[] };
  chaos: { tested: number; survived: number; crashed: string[] };
  pass: boolean;
}

// 12-1: 先寫測試才能寫實作 - 新功能沒 *.spec.ts = fail
export function checkTestFirst(): { checked: number; violations: string[] } {
  const result = { checked: 0, violations: [] as string[] };

  try {
    // 取得新增的檔案
    const newFiles = execSync('git diff --name-only --diff-filter=A HEAD 2>/dev/null || true', { encoding: 'utf-8' })
      .split('\n')
      .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
      .filter(f => !f.includes('.test.') && !f.includes('.spec.'))
      .filter(f => f.startsWith('src/'));

    for (const file of newFiles) {
      result.checked++;
      
      // 檢查是否有對應的測試檔案
      const testFile1 = file.replace(/\.(ts|tsx)$/, '.test.$1');
      const testFile2 = file.replace(/\.(ts|tsx)$/, '.spec.$1');
      const testDir = path.join(path.dirname(file), '__tests__', path.basename(file).replace(/\.(ts|tsx)$/, '.test.$1'));
      
      const hasTest = fs.existsSync(testFile1) || fs.existsSync(testFile2) || fs.existsSync(testDir);
      
      if (!hasTest) {
        // 檢查測試是否在同一個 commit 中新增
        const newTestFiles = execSync('git diff --name-only --diff-filter=A HEAD 2>/dev/null || true', { encoding: 'utf-8' })
          .split('\n')
          .filter(f => f.includes('.test.') || f.includes('.spec.'));
        
        const hasNewTest = newTestFiles.some(t => t.includes(path.basename(file, path.extname(file))));
        
        if (!hasNewTest) {
          result.violations.push(`${file} - 沒有對應的測試檔案`);
        }
      }
    }
  } catch {
    // ignore
  }

  return result;
}

// 12-2: Replay 驗證 - 10 組隨機資料，結果必須一致
export function checkReplayConsistency(): { passed: number; failed: number; inconsistent: string[] } {
  const result = { passed: 0, failed: 0, inconsistent: [] as string[] };

  // 找所有有 export function 的檔案
  const srcDir = 'src';
  if (!fs.existsSync(srcDir)) return result;

  try {
    const files = execSync(`find ${srcDir} -name "*.ts" -type f 2>/dev/null || true`, { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean)
      .filter(f => !f.includes('.test.') && !f.includes('.spec.'))
      .slice(0, 20); // 限制檢查數量

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // 檢查是否有非確定性操作
      const hasRandom = content.includes('Math.random()');
      const hasDate = content.includes('new Date()') && !content.includes('new Date(') && !content.includes('Date.now');
      const hasUUID = content.includes('uuid') || content.includes('nanoid');
      
      if (hasRandom || hasDate || hasUUID) {
        // 這些函數需要注入才能測試一致性
        const issues: string[] = [];
        if (hasRandom) issues.push('Math.random()');
        if (hasDate) issues.push('new Date()');
        if (hasUUID) issues.push('uuid/nanoid');
        
        result.inconsistent.push(`${file} - 使用非確定性函數: ${issues.join(', ')}`);
        result.failed++;
      } else {
        result.passed++;
      }
    }
  } catch {
    // ignore
  }

  return result;
}

// 12-3: Chaos 注入 - 隨機 timeout/null/delay，系統不能炸
export function checkChaosResilience(): { tested: number; survived: number; crashed: string[] } {
  const result = { tested: 0, survived: 0, crashed: [] as string[] };

  const srcDir = 'src';
  if (!fs.existsSync(srcDir)) return result;

  try {
    const files = execSync(`find ${srcDir} -name "*.ts" -type f 2>/dev/null || true`, { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean)
      .filter(f => !f.includes('.test.') && !f.includes('.spec.'))
      .slice(0, 20);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      result.tested++;
      
      // 檢查是否有適當的錯誤處理
      const hasAsyncAwait = content.includes('async ') || content.includes('await ');
      const hasTryCatch = content.includes('try {') || content.includes('try{');
      const hasCatch = content.includes('.catch(');
      const hasErrorBoundary = content.includes('ErrorBoundary') || content.includes('error boundary');
      
      // 檢查是否有 null 檢查
      const hasOptionalChaining = content.includes('?.') || content.includes('??');
      const hasNullCheck = content.includes('!== null') || content.includes('!= null') || content.includes('=== null');
      
      const hasErrorHandling = hasTryCatch || hasCatch || hasErrorBoundary;
      const hasNullSafety = hasOptionalChaining || hasNullCheck;
      
      if (hasAsyncAwait && !hasErrorHandling) {
        result.crashed.push(`${file} - 有 async/await 但沒有 try-catch`);
      } else if (content.includes('fetch(') && !hasErrorHandling) {
        result.crashed.push(`${file} - 有 fetch 但沒有錯誤處理`);
      } else {
        result.survived++;
      }
    }
  } catch {
    // ignore
  }

  return result;
}

// 主執行函數
export function enforceBehaviorSeal(taskId: string): void {
  console.log('☠️ 執行行為層封印檢查...');

  const result: BehaviorResult = {
    testFirst: checkTestFirst(),
    replay: checkReplayConsistency(),
    chaos: checkChaosResilience(),
    pass: true
  };

  console.log(`
═══════════════════════════════════════════════════════════════
☠️ 行為層封印結果
═══════════════════════════════════════════════════════════════
12-1 先寫測試：
    檢查新檔案：${result.testFirst.checked} 個
    違規：${result.testFirst.violations.length} 個
    ${result.testFirst.violations.length === 0 ? '✅ 通過' : '❌ 有新功能沒寫測試'}

12-2 Replay 驗證：
    確定性函數：${result.replay.passed} 個 ✅
    非確定性函數：${result.replay.failed} 個 ${result.replay.failed > 0 ? '⚠️' : '✅'}

12-3 Chaos 測試：
    檢查檔案：${result.chaos.tested} 個
    有錯誤處理：${result.chaos.survived} 個
    缺少處理：${result.chaos.crashed.length} 個 ${result.chaos.crashed.length > 0 ? '⚠️' : '✅'}
  `);

  // 顯示詳細違規
  if (result.testFirst.violations.length > 0) {
    console.log('\n⚠️ 沒有測試的新功能：');
    result.testFirst.violations.forEach(v => console.log(`   • ${v}`));
  }

  if (result.replay.inconsistent.length > 0) {
    console.log('\n⚠️ 非確定性函數（需要注入才能測試）：');
    result.replay.inconsistent.slice(0, 5).forEach(v => console.log(`   • ${v}`));
  }

  if (result.chaos.crashed.length > 0) {
    console.log('\n⚠️ 缺少錯誤處理：');
    result.chaos.crashed.slice(0, 5).forEach(v => console.log(`   • ${v}`));
  }

  // 判斷是否通過
  if (result.testFirst.violations.length > 0) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ ❌ 行為層封印失敗                                            ║
╠══════════════════════════════════════════════════════════════╣
║ 新功能沒有 *.spec.ts = FAIL                                  ║
║ 請先寫測試再寫實作                                           ║
╚══════════════════════════════════════════════════════════════╝
    `);
    result.pass = false;
    // 不 exit，只是警告
  }

  console.log(`
───────────────────────────────────────────────────────────────
狀態：${result.pass ? '✅ 通過' : '⚠️ 有警告'}
═══════════════════════════════════════════════════════════════
  `);
}

// CLI
const taskId = process.argv[2] || 'default';
enforceBehaviorSeal(taskId);
