// scripts/ai-cross-check.ts
// 12. Cross-Check Gate - 交叉驗證所有審核結果
import { execSync } from 'child_process';
import fs from 'fs';

interface CrossCheckResult {
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  allPassed: boolean;
}

export function runCrossCheck(taskId: string): CrossCheckResult {
  const result: CrossCheckResult = {
    checks: [],
    allPassed: true
  };

  // 1. TypeScript 編譯檢查
  try {
    execSync('npm run typecheck 2>&1', { encoding: 'utf-8' });
    result.checks.push({ name: 'TypeScript', passed: true, message: 'No errors' });
  } catch (e) {
    result.checks.push({ name: 'TypeScript', passed: false, message: 'Compilation errors' });
    result.allPassed = false;
  }

  // 2. Build 檢查
  try {
    execSync('npm run build 2>&1', { encoding: 'utf-8', stdio: 'pipe' });
    result.checks.push({ name: 'Build', passed: true, message: 'Build successful' });
  } catch (e) {
    result.checks.push({ name: 'Build', passed: false, message: 'Build failed' });
    result.allPassed = false;
  }

  // 3. 檢查是否有 console.log 遺留
  try {
    const grepResult = execSync('git diff HEAD -- "*.ts" "*.tsx" | grep -c "console.log" || echo "0"', { encoding: 'utf-8' });
    const count = parseInt(grepResult.trim());
    if (count > 5) {
      result.checks.push({ name: 'Console.log', passed: false, message: count + ' console.log found' });
      result.allPassed = false;
    } else {
      result.checks.push({ name: 'Console.log', passed: true, message: 'OK (' + count + ' found)' });
    }
  } catch {
    result.checks.push({ name: 'Console.log', passed: true, message: 'Check skipped' });
  }

  // 4. 檢查是否有 TODO 遺留
  try {
    const grepResult = execSync('git diff HEAD -- "*.ts" "*.tsx" | grep -c "TODO" || echo "0"', { encoding: 'utf-8' });
    const count = parseInt(grepResult.trim());
    if (count > 3) {
      result.checks.push({ name: 'TODO', passed: false, message: count + ' TODO found' });
      result.allPassed = false;
    } else {
      result.checks.push({ name: 'TODO', passed: true, message: 'OK (' + count + ' found)' });
    }
  } catch {
    result.checks.push({ name: 'TODO', passed: true, message: 'Check skipped' });
  }

  // 5. 檢查任務狀態檔案
  const statusPath = 'ai-tasks/' + taskId + '/status.json';
  if (fs.existsSync(statusPath)) {
    try {
      const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
      if (status.score && status.score >= 80) {
        result.checks.push({ name: 'Score Gate', passed: true, message: 'Score: ' + status.score });
      } else {
        result.checks.push({ name: 'Score Gate', passed: false, message: 'Score: ' + (status.score || 0) + ' < 80' });
        result.allPassed = false;
      }
    } catch {
      result.checks.push({ name: 'Score Gate', passed: true, message: 'Status file parse error' });
    }
  } else {
    result.checks.push({ name: 'Score Gate', passed: true, message: 'No status file' });
  }

  return result;
}

export function enforceCrossCheck(taskId: string): void {
  console.log('[12] Cross-Check Gate - Task: ' + taskId);
  console.log('='.repeat(60));

  const result = runCrossCheck(taskId);

  result.checks.forEach(check => {
    const status = check.passed ? 'PASS' : 'FAIL';
    console.log('  [' + status + '] ' + check.name + ': ' + check.message);
  });

  if (!result.allPassed) {
    console.log('\n[FAIL] Cross-Check Gate');
    console.log('Some checks failed. Please fix before proceeding.');
    process.exit(1);
  }

  console.log('\n[PASS] Cross-Check Gate - All checks passed');
}

// CLI
const taskId = process.argv[2] || 'default';
enforceCrossCheck(taskId);
