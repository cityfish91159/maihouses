// scripts/ai-heartbeat.ts
import fs from 'fs';
import path from 'path';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 分鐘

interface Status {
  taskId: string;
  lastUpdate: string;
  completed: number[];
  inProgress: number | null;
  blocked: number[];
  score: number;
}

function checkHeartbeat(taskId: string): void {
  const statusPath = path.join('ai-tasks', taskId, 'status.json');
  
  if (!fs.existsSync(statusPath)) {
    console.error(`❌ 找不到 status.json: ${statusPath}`);
    process.exit(1);
  }

  const status: Status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  const lastUpdate = new Date(status.lastUpdate).getTime();
  const now = Date.now();
  const diff = now - lastUpdate;

  if (diff > TIMEOUT_MS) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ 💀 AI 心跳超時                                               ║
╠══════════════════════════════════════════════════════════════╣
║ 任務：${status.taskId.padEnd(50)}║
║ 最後更新：${status.lastUpdate.padEnd(44)}║
║ 超時時間：${Math.floor(diff / 1000)} 秒（限制 300 秒）${' '.repeat(26)}║
╠══════════════════════════════════════════════════════════════╣
║ 🔥 執行懲罰：git checkout .                                  ║
╚══════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  console.log(`✅ 心跳正常 - 最後更新 ${Math.floor(diff / 1000)} 秒前`);
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('用法: npx ts-node scripts/ai-heartbeat.ts TASK-2025-001');
  process.exit(1);
}

checkHeartbeat(taskId);
