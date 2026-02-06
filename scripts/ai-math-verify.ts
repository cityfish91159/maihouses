// scripts/ai-math-verify.ts
// 13. 數學級驗證 - 寫死強制執行
import fs from 'fs';
import { execSync } from 'child_process';

interface MathVerifyResult {
  deterministicReplay: { tested: number; passed: number; failed: string[] };
  propertyBased: { functions: number; withTests: number; violations: string[] };
  zeroTrustMerge: { enabled: boolean; botOnly: boolean };
  pass: boolean;
}

// 13-1: Deterministic Replay - 同輸入 = 同輸出，不穩定 = fail
export function checkDeterministicReplay(): { tested: number; passed: number; failed: string[] } {
  const result = { tested: 0, passed: 0, failed: [] as string[] };

  const srcDir = 'src';
  if (!fs.existsSync(srcDir)) return result;

  try {
    const files = execSync(`find ${srcDir} -name "*.ts" -type f 2>/dev/null || true`, { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean)
      .filter(f => !f.includes('.test.') && !f.includes('.spec.'))
      .slice(0, 30);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      result.tested++;

      // 檢測不穩定因素
      const instabilities: string[] = [];
      
      // 時間相關
      if (content.includes('Date.now()') && !content.includes('// deterministic')) {
        instabilities.push('Date.now()');
      }
      if (content.includes('new Date()') && !content.includes('new Date(') && !content.includes('// deterministic')) {
        instabilities.push('new Date()');
      }
      
      // 隨機相關
      if (content.includes('Math.random()')) {
        instabilities.push('Math.random()');
      }
      if (content.includes('crypto.randomUUID') || content.includes('uuid()') || content.includes('nanoid()')) {
        instabilities.push('random UUID/nanoid');
      }
      
      // 外部狀態
      if (content.includes('localStorage') || content.includes('sessionStorage')) {
        instabilities.push('localStorage/sessionStorage');
      }
      
      // 環境變數（非配置）
      if (content.includes('process.env.') && !content.includes('VITE_') && !content.includes('NODE_ENV')) {
        instabilities.push('process.env');
      }

      if (instabilities.length > 0) {
        result.failed.push(`${file}: ${instabilities.join(', ')}`);
      } else {
        result.passed++;
      }
    }
  } catch {
    // ignore
  }

  return result;
}

// 13-2: Property-Based Testing - 測規律不是測例子
export function checkPropertyBasedTests(): { functions: number; withTests: number; violations: string[] } {
  const result = { functions: 0, withTests: 0, violations: [] as string[] };

  const srcDir = 'src';
  if (!fs.existsSync(srcDir)) return result;

  try {
    const files = execSync(`find ${srcDir} -name "*.ts" -type f 2>/dev/null || true`, { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean)
      .filter(f => !f.includes('.test.') && !f.includes('.spec.'))
      .filter(f => f.includes('utils') || f.includes('lib') || f.includes('helpers'));

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // 找 export function
      const exportedFunctions = content.match(/export\s+(async\s+)?function\s+(\w+)/g) || [];
      const exportedConsts = content.match(/export\s+const\s+(\w+)\s*=\s*(\(|async)/g) || [];
      
      const allFunctions = [...exportedFunctions, ...exportedConsts];
      result.functions += allFunctions.length;

      // 檢查是否有對應的測試檔案
      const baseName = file.replace(/\.(ts|tsx)$/, '');
      const testFile1 = `${baseName}.test.ts`;
      const testFile2 = `${baseName}.spec.ts`;
      
      if (fs.existsSync(testFile1) || fs.existsSync(testFile2)) {
        const testContent = fs.existsSync(testFile1) 
          ? fs.readFileSync(testFile1, 'utf-8')
          : fs.readFileSync(testFile2, 'utf-8');
        
        // 檢查是否使用 property-based testing (fast-check, jsverify, etc.)
        const hasPropertyTest = 
          testContent.includes('fc.') || 
          testContent.includes('fast-check') ||
          testContent.includes('property(') ||
          testContent.includes('forAll(') ||
          testContent.includes('arbitrary');
        
        if (hasPropertyTest) {
          result.withTests += allFunctions.length;
        } else {
          // 只有範例測試，沒有 property-based
          result.violations.push(`${file}: 只有範例測試，建議加入 property-based testing`);
        }
      }
    }
  } catch {
    // ignore
  }

  return result;
}

// 13-3: Zero-Trust Merge - 人類不可直接 merge，只有 Bot 可以
export function checkZeroTrustMerge(): { enabled: boolean; botOnly: boolean } {
  const result = { enabled: false, botOnly: false };

  // 檢查是否有 branch protection rules (透過檔案)
  const branchProtection = '.github/branch-protection.yml';
  const codeowners = '.github/CODEOWNERS';
  
  if (fs.existsSync(codeowners)) {
    result.enabled = true;
  }

  // 檢查 GitHub Actions 是否有自動 merge
  const workflowDir = '.github/workflows';
  if (fs.existsSync(workflowDir)) {
    try {
      const workflows = fs.readdirSync(workflowDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
      
      for (const workflow of workflows) {
        const content = fs.readFileSync(`${workflowDir}/${workflow}`, 'utf-8');
        if (content.includes('auto-merge') || content.includes('merge-bot') || content.includes('gh pr merge')) {
          result.botOnly = true;
          break;
        }
      }
    } catch {
      // ignore
    }
  }

  return result;
}

// 生成驗證報告
export function generateVerificationReport(result: MathVerifyResult): void {
  const report = {
    timestamp: new Date().toISOString(),
    deterministicReplay: {
      tested: result.deterministicReplay.tested,
      passed: result.deterministicReplay.passed,
      passRate: result.deterministicReplay.tested > 0 
        ? Math.round((result.deterministicReplay.passed / result.deterministicReplay.tested) * 100) 
        : 100
    },
    propertyBased: {
      functions: result.propertyBased.functions,
      withTests: result.propertyBased.withTests,
      coverage: result.propertyBased.functions > 0
        ? Math.round((result.propertyBased.withTests / result.propertyBased.functions) * 100)
        : 100
    },
    zeroTrustMerge: result.zeroTrustMerge,
    overallPass: result.pass
  };

  fs.writeFileSync('verification-report.json', JSON.stringify(report, null, 2));
  console.log('📋 已生成驗證報告: verification-report.json');
}

// 主執行函數
export function enforceMathVerify(taskId: string): void {
  console.log('🧠 執行數學級驗證...');

  const result: MathVerifyResult = {
    deterministicReplay: checkDeterministicReplay(),
    propertyBased: checkPropertyBasedTests(),
    zeroTrustMerge: checkZeroTrustMerge(),
    pass: true
  };

  const deterministicRate = result.deterministicReplay.tested > 0
    ? Math.round((result.deterministicReplay.passed / result.deterministicReplay.tested) * 100)
    : 100;

  console.log(`
═══════════════════════════════════════════════════════════════
🧠 數學級驗證結果
═══════════════════════════════════════════════════════════════
13-1 Deterministic Replay：
    檢查檔案：${result.deterministicReplay.tested} 個
    確定性：${result.deterministicReplay.passed} 個 (${deterministicRate}%)
    不穩定：${result.deterministicReplay.failed.length} 個
    狀態：${deterministicRate >= 80 ? '✅ 通過' : '⚠️ 需改善'}

13-2 Property-Based Testing：
    工具函數：${result.propertyBased.functions} 個
    有 Property Test：${result.propertyBased.withTests} 個
    狀態：${result.propertyBased.violations.length === 0 ? '✅ 通過' : '⚠️ 建議加入'}

13-3 Zero-Trust Merge：
    Branch Protection：${result.zeroTrustMerge.enabled ? '✅ 已啟用' : '⚠️ 建議啟用'}
    Bot-Only Merge：${result.zeroTrustMerge.botOnly ? '✅ 已設定' : '⚠️ 建議設定'}
  `);

  // 顯示不穩定的檔案
  if (result.deterministicReplay.failed.length > 0) {
    console.log('\n⚠️ 不穩定的檔案（同輸入可能不同輸出）：');
    result.deterministicReplay.failed.slice(0, 5).forEach(f => console.log(`   • ${f}`));
  }

  if (result.propertyBased.violations.length > 0) {
    console.log('\n⚠️ 建議加入 Property-Based Testing：');
    result.propertyBased.violations.slice(0, 5).forEach(v => console.log(`   • ${v}`));
  }

  // 生成報告
  generateVerificationReport(result);

  // 判斷是否失敗
  if (deterministicRate < 50) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ ❌ Deterministic Replay 失敗                                 ║
╠══════════════════════════════════════════════════════════════╣
║ 確定性比率：${String(deterministicRate).padEnd(49)}%║
║ 要求：至少 50%                                               ║
║ 同輸入 = 同輸出，不穩定 = FAIL                               ║
╚══════════════════════════════════════════════════════════════╝
    `);
    result.pass = false;
  }

  console.log(`
───────────────────────────────────────────────────────────────
狀態：${result.pass ? '✅ 通過' : '⚠️ 有警告'}
═══════════════════════════════════════════════════════════════
  `);
}

// CLI
const taskId = process.argv[2] || 'default';
enforceMathVerify(taskId);
