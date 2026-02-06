// scripts/ai-score-gate.ts
// 3. 80分 HARD GATE - 寫死強制執行
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ScoreResult {
  score: number;
  deductions: Array<{ reason: string; points: number; count: number }>;
  pass: boolean;
}

// 3-1 ~ 3-9: 扣分項目
export function calculateScore(files: string[]): ScoreResult {
  let score = 100;
  const deductions: Array<{ reason: string; points: number; count: number }> = [];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    // 3-2: 使用 any (-5分/個)
    const anyMatches = content.match(/:\s*any\b/g) || [];
    if (anyMatches.length > 0) {
      deductions.push({ reason: `${file}: 使用 any`, points: 5, count: anyMatches.length });
      score -= anyMatches.length * 5;
    }

    // 3-3: 使用 Function (-5分/個)
    const functionMatches = content.match(/:\s*Function\b/g) || [];
    if (functionMatches.length > 0) {
      deductions.push({ reason: `${file}: 使用 Function`, points: 5, count: functionMatches.length });
      score -= functionMatches.length * 5;
    }

    // 3-4: 使用 {} 作為類型 (-5分/個)
    const emptyObjMatches = content.match(/:\s*\{\s*\}/g) || [];
    if (emptyObjMatches.length > 0) {
      deductions.push({ reason: `${file}: 使用 {}`, points: 5, count: emptyObjMatches.length });
      score -= emptyObjMatches.length * 5;
    }

    // 3-5: 使用 Object (-5分/個)
    const objectMatches = content.match(/:\s*Object\b/g) || [];
    if (objectMatches.length > 0) {
      deductions.push({ reason: `${file}: 使用 Object`, points: 5, count: objectMatches.length });
      score -= objectMatches.length * 5;
    }

    // 3-6: 函數 > 60 行 (-10分/個)
    const functionRegex = /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(|(?:async\s+)?(?:\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*{)/g;
    let match;
    let functionStart = -1;
    let braceCount = 0;
    let inFunction = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!inFunction && (line.includes('function ') || line.match(/(?:const|let)\s+\w+\s*=.*=>/))) {
        functionStart = i;
        inFunction = true;
        braceCount = 0;
      }
      if (inFunction) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        if (braceCount <= 0 && functionStart >= 0) {
          const functionLength = i - functionStart + 1;
          if (functionLength > 60) {
            deductions.push({ reason: `${file}:${functionStart + 1}: 函數 ${functionLength} 行 > 60`, points: 10, count: 1 });
            score -= 10;
          }
          inFunction = false;
          functionStart = -1;
        }
      }
    }

    // 3-7: 巢狀 > 3 層 (-10分/個)
    let maxNesting = 0;
    let currentNesting = 0;
    for (const line of lines) {
      currentNesting += (line.match(/{/g) || []).length;
      currentNesting -= (line.match(/}/g) || []).length;
      if (currentNesting > maxNesting) maxNesting = currentNesting;
    }
    if (maxNesting > 3) {
      deductions.push({ reason: `${file}: 巢狀 ${maxNesting} 層 > 3`, points: 10, count: 1 });
      score -= 10;
    }
  }

  return {
    score: Math.max(0, score),
    deductions,
    pass: score >= 80
  };
}

// 3-1: TypeScript 錯誤 (-10分/個)
export function checkTypeScript(): { errors: number; output: string } {
  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    return { errors: 0, output: '' };
  } catch (error) {
    const err = error as { stdout?: Buffer; stderr?: Buffer };
    const output = err.stdout?.toString() || err.stderr?.toString() || '';
    const errorMatches = output.match(/error TS\d+/g) || [];
    return { errors: errorMatches.length, output };
  }
}

// 3-10: < 80分觸發 git checkout .
export function enforceGate(taskId: string): void {
  const statusPath = path.join('ai-tasks', taskId, 'status.json');
  
  // 取得修改的檔案
  let changedFiles: string[] = [];
  try {
    const diff = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
    changedFiles = diff
      .split('\n')
      .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
      .filter(f => !f.startsWith('scripts/ai-')); // 監工腳本本身不列入品質評分
  } catch {
    changedFiles = [];
  }

  // TypeScript 檢查
  const tsResult = checkTypeScript();
  let score = 100 - (tsResult.errors * 10);

  // 代碼品質檢查
  if (changedFiles.length > 0) {
    const qualityResult = calculateScore(changedFiles);
    score = Math.min(score, qualityResult.score);
    
    console.log(`
═══════════════════════════════════════════════════════════════
🔍 80分 HARD GATE 審查
═══════════════════════════════════════════════════════════════
TypeScript 錯誤：${tsResult.errors} 個 (-${tsResult.errors * 10}分)
${qualityResult.deductions.map(d => `${d.reason}: -${d.points * d.count}分`).join('\n')}
───────────────────────────────────────────────────────────────
總分：${score}
狀態：${score >= 80 ? '✅ 通過' : '💀 失敗'}
═══════════════════════════════════════════════════════════════
    `);
  }

  // 更新 status.json
  if (fs.existsSync(statusPath)) {
    const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    status.score = score;
    status.lastUpdate = new Date().toISOString();
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  }

  // HARD GATE
  if (score < 80) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ 💀 HARD GATE 觸發                                            ║
╠══════════════════════════════════════════════════════════════╣
║ 分數：${String(score).padEnd(54)}║
║ 執行：git checkout .                                         ║
╚══════════════════════════════════════════════════════════════╝
    `);
    execSync('git checkout .', { stdio: 'inherit' });
    process.exit(1);
  }
}

// CLI
const taskId = process.argv[2];
if (!taskId) {
  console.error('用法: npx ts-node scripts/ai-score-gate.ts TASK-xxx');
  process.exit(1);
}
enforceGate(taskId);
