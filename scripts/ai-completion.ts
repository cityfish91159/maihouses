// scripts/ai-completion.ts
// 6. 任務完成驗證 - 寫死強制執行
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TaskSpec {
  taskId: string;
  title: string;
  created: string;
  checklist: Array<{ id: number; desc: string; required: boolean }>;
  outputSpec?: {
    requiredFiles?: string[];
    mustPass?: string[];
  };
}

interface TaskStatus {
  taskId: string;
  lastUpdate: string;
  completed: number[];
  inProgress: number | null;
  score: number;
  lazyCount: number;
  reports: Array<{ timestamp: string; type: string; message: string; files?: string[] }>;
}

// 6-1 ~ 6-4: 任務完成驗證
export function verifyCompletion(taskId: string): boolean {
  const statusPath = path.join('ai-tasks', taskId, 'status.json');
  const specPath = path.join('ai-tasks', taskId, 'spec.json');
  
  if (!fs.existsSync(statusPath) || !fs.existsSync(specPath)) {
    console.error('❌ 找不到任務檔案');
    return false;
  }
  
  const status: TaskStatus = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  const spec: TaskSpec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  
  const errors: string[] = [];
  
  // 檢查所有必要項目是否完成
  const requiredItems = spec.checklist.filter(item => item.required);
  const incompleteItems = requiredItems.filter(item => !status.completed.includes(item.id));
  
  if (incompleteItems.length > 0) {
    errors.push(...incompleteItems.map(item => `未完成：${item.desc}`));
  }
  
  // 檢查必要檔案
  if (spec.outputSpec?.requiredFiles) {
    for (const file of spec.outputSpec.requiredFiles) {
      if (!fs.existsSync(file)) {
        errors.push(`缺少檔案：${file}`);
      }
    }
  }
  
  // 執行必要命令
  if (spec.outputSpec?.mustPass) {
    for (const cmd of spec.outputSpec.mustPass) {
      try {
        execSync(cmd, { stdio: 'pipe' });
      } catch {
        errors.push(`命令失敗：${cmd}`);
      }
    }
  }
  
  // 檢查分數
  if (status.score < 80) {
    errors.push(`分數不足：${status.score} < 80`);
  }
  
  // 計算耗時
  const startTime = new Date(spec.created).getTime();
  const endTime = Date.now();
  const duration = endTime - startTime;
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  
  // 收集修改的檔案
  const modifiedFiles = new Set<string>();
  if (status.reports) {
    for (const report of status.reports) {
      if (report.files) {
        report.files.forEach(f => modifiedFiles.add(f));
      }
    }
  }
  
  // 也從 git 取得
  try {
    const gitDiff = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
    gitDiff.split('\n').filter(Boolean).forEach(f => modifiedFiles.add(f));
  } catch {
    // ignore
  }
  
  if (errors.length > 0) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ ❌ 任務未完成                                                ║
╠══════════════════════════════════════════════════════════════╣
${errors.map(e => `║ • ${e.padEnd(56)}║`).join('\n')}
╚══════════════════════════════════════════════════════════════╝
    `);
    return false;
  }
  
  // 6-1 ~ 6-4: 輸出完成報告
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║ 🏁 任務完成                                                  ║
╠══════════════════════════════════════════════════════════════╣
║ 🎯 任務：${spec.title.padEnd(50)}║
║ ⏱️ 耗時：${`${minutes}分${seconds}秒`.padEnd(50)}║
╠══════════════════════════════════════════════════════════════╣
║ ✅ 完成清單：                                                 ║
${spec.checklist.map(item => `║   ✅ ${item.id}. ${item.desc.padEnd(51)}║`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║ 📁 修改的檔案：                                               ║
${Array.from(modifiedFiles).slice(0, 10).map(f => `║   • ${f.padEnd(55)}║`).join('\n')}
${modifiedFiles.size > 10 ? `║   ... 還有 ${modifiedFiles.size - 10} 個檔案${' '.repeat(42)}║` : ''}
╠══════════════════════════════════════════════════════════════╣
║ 📊 最終分數：${String(status.score).padEnd(47)}║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  // 標記任務完成
  status.inProgress = null;
  status.lastUpdate = new Date().toISOString();
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  
  return true;
}

// CLI
const taskId = process.argv[2];
if (!taskId) {
  console.error('用法: npx ts-node scripts/ai-completion.ts TASK-xxx');
  process.exit(1);
}

const success = verifyCompletion(taskId);
process.exit(success ? 0 : 1);
