// scripts/ai-spec-guard.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface Spec {
  taskId: string;
  checklist: Array<{ id: number; desc: string; required: boolean }>;
  outputSpec: {
    requiredFiles: string[];
    mustPass: string[];
  };
}

interface Status {
  taskId: string;
  completed: number[];
  score: number;
}

function guardSpec(taskId: string): void {
  const specPath = path.join('ai-tasks', taskId, 'spec.json');
  const statusPath = path.join('ai-tasks', taskId, 'status.json');

  const spec: Spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  const status: Status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));

  let score = 100;
  const errors: string[] = [];

  // 1. 檢查所有必要檔案存在
  for (const file of spec.outputSpec.requiredFiles) {
    if (!fs.existsSync(file)) {
      errors.push(`缺少檔案：${file}`);
      score -= 10;
    }
  }

  // 2. 檢查所有必要項目完成
  const requiredItems = spec.checklist.filter(item => item.required);
  for (const item of requiredItems) {
    if (!status.completed.includes(item.id)) {
      errors.push(`未完成：${item.desc}`);
      score -= 10;
    }
  }

  // 3. 執行所有必要命令
  for (const cmd of spec.outputSpec.mustPass) {
    try {
      execSync(cmd, { stdio: 'pipe' });
    } catch {
      errors.push(`命令失敗：${cmd}`);
      score -= 20;
    }
  }

  // 4. 檢查 TypeScript 品質
  try {
    const tsFiles = execSync('find scripts -name "*.ts" | head -20', { encoding: 'utf-8' })
      .split('\n')
      .filter(Boolean);
    
    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const anyCount = (content.match(/: any/g) || []).length;
      if (anyCount > 0) {
        errors.push(`${file} 使用 any ${anyCount} 次`);
        score -= anyCount * 5;
      }
    }
  } catch {
    // 忽略
  }

  // 輸出結果
  if (errors.length > 0) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ ❌ 規格驗證失敗                                              ║
╠══════════════════════════════════════════════════════════════╣
${errors.map(e => `║ • ${e.padEnd(56)}║`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║ 分數：${String(score).padEnd(54)}║
╚══════════════════════════════════════════════════════════════╝
    `);
  } else {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║ ✅ 規格驗證通過                                              ║
╠══════════════════════════════════════════════════════════════╣
║ 分數：${String(score).padEnd(54)}║
╚══════════════════════════════════════════════════════════════╝
    `);
  }

  if (score < 80) {
    console.error(`💀 分數 ${score} < 80，任務失敗`);
    process.exit(1);
  }
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('用法: npx ts-node scripts/ai-spec-guard.ts TASK-2025-001');
  process.exit(1);
}

guardSpec(taskId);
