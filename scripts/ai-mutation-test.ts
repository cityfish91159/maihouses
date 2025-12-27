// scripts/ai-mutation-test.ts
// 7. Mutation Testing（測試的測試）- 寫死強制執行
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface MutationResult {
  totalMutants: number;
  killed: number;
  survived: number;
  score: number;
  survivors: Array<{ file: string; line: number; mutation: string }>;
}

// 7-1: StrykerJS - 隨機修改程式碼，測試應該要失敗
export function runMutationTest(targetFiles: string[]): MutationResult {
  const result: MutationResult = {
    totalMutants: 0,
    killed: 0,
    survived: 0,
    score: 100,
    survivors: []
  };

  // 簡易 Mutation Testing 實作（不依賴 StrykerJS）
  const mutations = [
    { name: 'ConditionalBoundary', pattern: /([<>]=?)/g, replace: (m: string) => m === '<' ? '<=' : m === '>' ? '>=' : m === '<=' ? '<' : '>' },
    { name: 'NegateConditional', pattern: /(===|!==|==|!=)/g, replace: (m: string) => m.includes('!') ? m.replace('!', '') : m.replace('=', '!=') },
    { name: 'RemoveConditional', pattern: /if\s*\([^)]+\)/g, replace: () => 'if (true)' },
    { name: 'MathMutator', pattern: /(\+|-|\*|\/)/g, replace: (m: string) => m === '+' ? '-' : m === '-' ? '+' : m === '*' ? '/' : '*' },
  ];

  for (const file of targetFiles) {
    if (!fs.existsSync(file)) continue;
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
    
    const originalContent = fs.readFileSync(file, 'utf-8');
    const lines = originalContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const mutation of mutations) {
        if (mutation.pattern.test(line)) {
          result.totalMutants++;
          
          // 建立變異版本
          const mutatedLine = line.replace(mutation.pattern, mutation.replace as unknown as string);
          const mutatedLines = [...lines];
          mutatedLines[i] = mutatedLine;
          const mutatedContent = mutatedLines.join('\n');
          
          // 寫入變異版本
          fs.writeFileSync(file, mutatedContent);
          
          // 執行測試
          try {
            execSync('npm run typecheck', { stdio: 'pipe' });
            // 如果測試通過，表示變異存活（測試沒有抓到）
            result.survived++;
            result.survivors.push({
              file,
              line: i + 1,
              mutation: mutation.name
            });
          } catch {
            // 測試失敗，表示變異被殺死（好的！）
            result.killed++;
          }
          
          // 還原原始檔案
          fs.writeFileSync(file, originalContent);
        }
      }
    }
  }

  // 計算 Mutation Score
  if (result.totalMutants > 0) {
    result.score = Math.round((result.killed / result.totalMutants) * 100);
  }

  return result;
}

// 7-2: Mutation Score < 70% = PR 直接死亡
export function enforceMutationGate(taskId: string): void {
  // 取得修改的檔案
  let changedFiles: string[] = [];
  try {
    const diff = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
    changedFiles = diff.split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  } catch {
    changedFiles = [];
  }

  if (changedFiles.length === 0) {
    console.log('⚠️ 沒有修改的 TypeScript 檔案，跳過 Mutation Test');
    return;
  }

  console.log('🧪 執行 Mutation Testing...');
  const result = runMutationTest(changedFiles);

  console.log(`
═══════════════════════════════════════════════════════════════
🧱 Mutation Testing 結果
═══════════════════════════════════════════════════════════════
總變異數：${result.totalMutants}
被殺死：${result.killed}
存活：${result.survived}
───────────────────────────────────────────────────────────────
Mutation Score：${result.score}%
狀態：${result.score >= 70 ? '✅ 通過' : '💀 失敗'}
═══════════════════════════════════════════════════════════════
  `);

  if (result.survivors.length > 0) {
    console.log('⚠️ 存活的變異（測試沒抓到的問題）：');
    result.survivors.slice(0, 10).forEach(s => {
      console.log(`   • ${s.file}:${s.line} - ${s.mutation}`);
    });
  }

  // 7-3: 殺掉假測試
  if (result.score < 70) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ 💀 Mutation Score < 70%                                      ║
╠══════════════════════════════════════════════════════════════╣
║ 分數：${String(result.score).padEnd(54)}%║
║ 結論：測試品質不足，可能有假測試                             ║
║ PR 直接死亡                                                  ║
╚══════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }
}

// CLI
const taskId = process.argv[2] || 'default';
enforceMutationGate(taskId);
