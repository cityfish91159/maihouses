// scripts/ai-progress-verify.ts
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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
  lastUpdate: string;
  completed: number[];
  inProgress: number | null;
  blocked: number[];
  score: number;
}

function verifyProgress(taskId: string): void {
  const specPath = path.join('ai-tasks', taskId, 'spec.json');
  const statusPath = path.join('ai-tasks', taskId, 'status.json');

  if (!fs.existsSync(specPath) || !fs.existsSync(statusPath)) {
    console.error('❌ 找不到 spec.json 或 status.json');
    process.exit(1);
  }

  const spec: Spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  const status: Status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));

  // 檢查 git diff
  let diffOutput = '';
  try {
    diffOutput = execSync('git diff --name-only HEAD', { encoding: 'utf-8' });
  } catch {
    diffOutput = '';
  }

  const changedFiles = diffOutput.split('\n').filter(Boolean);
  
  // 偷懶偵測：聲稱完成但沒有對應的 git 變更
  const completedCount = status.completed.length;
  if (completedCount > 0 && changedFiles.length === 0) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ 🦥 偵測到偷懶行為                                            ║
╠══════════════════════════════════════════════════════════════╣
║ 問題：聲稱完成 ${completedCount} 個項目，但 git diff 是空的      ║
║ 結論：AI 在說謊                                              ║
╠══════════════════════════════════════════════════════════════╣
║ 🔥 執行懲罰：git checkout .                                  ║
╚══════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  // 檢查必要檔案
  const missingFiles: string[] = [];
  for (const file of spec.outputSpec.requiredFiles) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    console.log(`⚠️ 尚未建立的檔案：`);
    missingFiles.forEach(f => console.log(`   - ${f}`));
  }

  // 執行必要命令
  for (const cmd of spec.outputSpec.mustPass) {
    try {
      console.log(`🔍 執行：${cmd}`);
      execSync(cmd, { stdio: 'inherit' });
      console.log(`✅ ${cmd} 通過`);
    } catch {
      console.error(`❌ ${cmd} 失敗`);
      status.score -= 20;
    }
  }

  // 更新分數
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  
  console.log(`
═══════════════════════════════════════════════════════════════
📊 進度驗證結果
═══════════════════════════════════════════════════════════════
完成項目：${status.completed.length}/${spec.checklist.length}
當前分數：${status.score}
修改檔案：${changedFiles.length} 個
═══════════════════════════════════════════════════════════════
  `);

  if (status.score < 80) {
    console.error(`💀 分數低於 80，執行 git checkout .`);
    process.exit(1);
  }
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('用法: npx ts-node scripts/ai-progress-verify.ts TASK-2025-001');
  process.exit(1);
}

verifyProgress(taskId);
