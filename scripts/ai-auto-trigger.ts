// scripts/ai-auto-trigger.ts
// 0. 務必自動觸發 - 寫死強制執行
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TASK_DIR = 'ai-tasks';

interface TaskConfig {
  taskId: string;
  title: string;
  created: string;
  deadline: string;
  checklist: Array<{ id: number; desc: string; required: boolean }>;
}

interface TaskStatus {
  taskId: string;
  lastUpdate: string;
  completed: number[];
  inProgress: number | null;
  score: number;
  lazyCount: number;
}

// 0-1: 收到任務自動觸發
export function createTask(title: string, checklist: string[]): string {
  const taskId = `TASK-${Date.now()}`;
  const taskPath = path.join(TASK_DIR, taskId);
  
  // 建立任務目錄
  fs.mkdirSync(taskPath, { recursive: true });
  fs.mkdirSync(path.join(taskPath, 'output'), { recursive: true });
  
  // 建立 spec.json
  const spec: TaskConfig = {
    taskId,
    title,
    created: new Date().toISOString(),
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    checklist: checklist.map((desc, i) => ({
      id: i + 1,
      desc,
      required: true
    }))
  };
  fs.writeFileSync(
    path.join(taskPath, 'spec.json'),
    JSON.stringify(spec, null, 2)
  );
  
  // 建立 status.json
  const status: TaskStatus = {
    taskId,
    lastUpdate: new Date().toISOString(),
    completed: [],
    inProgress: 1,
    score: 100,
    lazyCount: 0
  };
  fs.writeFileSync(
    path.join(taskPath, 'status.json'),
    JSON.stringify(status, null, 2)
  );
  
  // 強制輸出任務接收框
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║ 📋 任務接收                                                  ║
╠══════════════════════════════════════════════════════════════╣
║ 🎯 任務：${title.padEnd(50)}║
║ ⏰ 開始：${spec.created.padEnd(50)}║
╠══════════════════════════════════════════════════════════════╣
║ 📝 工作清單（HARD GATE - 全部完成才算完成）：                 ║
${checklist.map((item, i) => `║   ⬜ ${i + 1}. ${item.padEnd(53)}║`).join('\n')}
╚══════════════════════════════════════════════════════════════╝
  `);
  
  return taskId;
}

// 0-2: 寫完代碼自動審查
export function autoReview(taskId: string): boolean {
  const statusPath = path.join(TASK_DIR, taskId, 'status.json');
  const status: TaskStatus = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  
  // 更新心跳
  status.lastUpdate = new Date().toISOString();
  
  // 強制執行 typecheck
  console.log('🔍 自動審查中...');
  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    console.log('✅ TypeScript: 通過');
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    return true;
  } catch (error) {
    const err = error as { stdout?: Buffer };
    console.error('❌ TypeScript: 失敗');
    console.error(err.stdout?.toString() || '');
    status.score -= 20;
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    
    if (status.score < 80) {
      console.error('💀 分數 < 80，執行 git checkout .');
      execSync('git checkout .', { stdio: 'inherit' });
      process.exit(1);
    }
    return false;
  }
}

// 0-3: 不靠 AI 自律 - 機械式強制執行
export function enforceRules(taskId: string): void {
  const statusPath = path.join(TASK_DIR, taskId, 'status.json');
  const specPath = path.join(TASK_DIR, taskId, 'spec.json');
  
  if (!fs.existsSync(statusPath) || !fs.existsSync(specPath)) {
    console.error('❌ 任務不存在，禁止操作');
    process.exit(1);
  }
  
  const status: TaskStatus = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  
  // 檢查心跳（5分鐘超時）
  const lastUpdate = new Date(status.lastUpdate).getTime();
  const now = Date.now();
  if (now - lastUpdate > 5 * 60 * 1000) {
    console.error('💀 心跳超時，執行 git checkout .');
    execSync('git checkout .', { stdio: 'inherit' });
    process.exit(1);
  }
  
  // 檢查分數
  if (status.score < 80) {
    console.error('💀 分數 < 80，執行 git checkout .');
    execSync('git checkout .', { stdio: 'inherit' });
    process.exit(1);
  }
  
  // 檢查偷懶次數
  if (status.lazyCount >= 2) {
    console.error('💀 偷懶兩次，執行 git checkout .');
    execSync('git checkout .', { stdio: 'inherit' });
    process.exit(1);
  }
}

// CLI
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'create':
    if (!arg) {
      console.error('用法: npx ts-node scripts/ai-auto-trigger.ts create "任務標題"');
      process.exit(1);
    }
    // 從 stdin 讀取 checklist
    const checklist = process.argv.slice(4);
    if (checklist.length === 0) {
      console.error('用法: npx ts-node scripts/ai-auto-trigger.ts create "任務標題" "項目1" "項目2" ...');
      process.exit(1);
    }
    createTask(arg, checklist);
    break;
    
  case 'review':
    if (!arg) {
      console.error('用法: npx ts-node scripts/ai-auto-trigger.ts review TASK-xxx');
      process.exit(1);
    }
    autoReview(arg);
    break;
    
  case 'enforce':
    if (!arg) {
      console.error('用法: npx ts-node scripts/ai-auto-trigger.ts enforce TASK-xxx');
      process.exit(1);
    }
    enforceRules(arg);
    break;
    
  default:
    console.error('用法: npx ts-node scripts/ai-auto-trigger.ts <create|review|enforce>');
    process.exit(1);
}
