// scripts/ai-diff-gate.ts
// 10. Diff Complexity Gate - 寫死強制執行
import { execSync } from 'child_process';
import path from 'path';

interface DiffResult {
  totalLines: number;
  totalFiles: number;
  domains: Set<string>;
  pass: boolean;
  violations: string[];
}

// 10-1, 10-2, 10-3: 檢查 Diff 複雜度
export function analyzeDiff(): DiffResult {
  const result: DiffResult = {
    totalLines: 0,
    totalFiles: 0,
    domains: new Set(),
    pass: true,
    violations: []
  };

  try {
    // 取得 diff 統計
    const diffStat = execSync('git diff --stat HEAD 2>/dev/null || true', { encoding: 'utf-8' });
    const diffFiles = execSync('git diff --name-only HEAD 2>/dev/null || true', { encoding: 'utf-8' });
    
    // 計算總行數
    const statMatch = diffStat.match(/(\d+) insertions?\(\+\)/);
    const delMatch = diffStat.match(/(\d+) deletions?\(-\)/);
    const insertions = statMatch ? parseInt(statMatch[1]) : 0;
    const deletions = delMatch ? parseInt(delMatch[1]) : 0;
    result.totalLines = insertions + deletions;

    // 過濾監工腳本，避免自我檢查阻擋
    const files = diffFiles
      .split('\n')
      .filter(Boolean)
      .filter(f => !f.startsWith('scripts/ai-'));

    // 計算檔案數（排除監工腳本）
    result.totalFiles = files.length;

    // 如果只剩監工腳本，行數視為 0，避免自我阻擋
    const containsNonGuardChange = files.length > 0;
    if (!containsNonGuardChange) {
      result.totalLines = 0;
    }

    // 分析 domains
    const domainMap: Record<string, string> = {
      'src/pages': 'pages',
      'src/components': 'components',
      'src/hooks': 'hooks',
      'src/services': 'services',
      'src/stores': 'stores',
      'src/utils': 'utils',
      'src/types': 'types',
      'api': 'api',
      'scripts': 'scripts',
      'public': 'public',
    };

    for (const file of files) {
      for (const [prefix, domain] of Object.entries(domainMap)) {
        if (file.startsWith(prefix)) {
          result.domains.add(domain);
          break;
        }
      }
    }

    // 10-1: 最多 400 行 diff
    if (result.totalLines > 400) {
      result.violations.push(`Diff ${result.totalLines} 行 > 400 行限制`);
      result.pass = false;
    }

    // 10-2: 最多 8 個檔案
    if (result.totalFiles > 8) {
      result.violations.push(`修改 ${result.totalFiles} 個檔案 > 8 個限制`);
      result.pass = false;
    }

    // 10-3: 不可跨 2 個 domain
    if (result.domains.size > 2) {
      result.violations.push(`跨 ${result.domains.size} 個 domain > 2 個限制 (${Array.from(result.domains).join(', ')})`);
      result.pass = false;
    }

  } catch {
    // 沒有 git 或沒有變更
    result.pass = true;
  }

  return result;
}

// 主執行函數
export function enforceDiffGate(taskId: string): void {
  console.log('📏 執行 Diff Complexity Gate...');

  const result = analyzeDiff();

  console.log(`
═══════════════════════════════════════════════════════════════
📏 Diff Complexity Gate 結果
═══════════════════════════════════════════════════════════════
10-1 Diff 行數：${result.totalLines} / 400 ${result.totalLines <= 400 ? '✅' : '❌'}
10-2 修改檔案：${result.totalFiles} / 8 ${result.totalFiles <= 8 ? '✅' : '❌'}
10-3 Domain 數：${result.domains.size} / 2 ${result.domains.size <= 2 ? '✅' : '❌'}
     Domains：${Array.from(result.domains).join(', ') || '(無)'}
  `);

  if (!result.pass) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ ❌ Diff Complexity Gate 失敗                                 ║
╠══════════════════════════════════════════════════════════════╣
${result.violations.map(v => `║ • ${v.padEnd(56)}║`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║ 禁止 AI 暴力破關！                                           ║
║ 請拆分成更小的 PR                                            ║
╚══════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  console.log(`
───────────────────────────────────────────────────────────────
狀態：✅ 通過
═══════════════════════════════════════════════════════════════
  `);
}

// CLI
const taskId = process.argv[2] || 'default';
enforceDiffGate(taskId);
