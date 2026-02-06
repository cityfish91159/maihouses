// scripts/ai-reporter.ts
// 5. 即時回報系統 - 寫死強制執行
import fs from 'fs';
import path from 'path';

interface TaskSpec {
  taskId: string;
  title: string;
  checklist: Array<{ id: number; desc: string; required: boolean }>;
}

interface TaskStatus {
  taskId: string;
  lastUpdate: string;
  completed: number[];
  inProgress: number | null;
  score: number;
  lazyCount: number;
  reports: ReportEntry[];
}

interface ReportEntry {
  timestamp: string;
  type: 'progress' | 'error' | 'wait' | 'switch' | 'complete';
  message: string;
  files?: string[];
}

// 5-1: 每完成一個子任務
export function reportProgress(taskId: string, completedId: number, message: string, files: string[] = []): void {
  const statusPath = path.join('ai-tasks', taskId, 'status.json');
  const specPath = path.join('ai-tasks', taskId, 'spec.json');
  
  const status: TaskStatus = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  const spec: TaskSpec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  
  if (!status.reports) status.reports = [];
  
  // 標記完成
  if (!status.completed.includes(completedId)) {
    status.completed.push(completedId);
  }
  
  // 設定下一個進行中
  const nextId = spec.checklist.find(item => !status.completed.includes(item.id))?.id || null;
  status.inProgress = nextId;
  status.lastUpdate = new Date().toISOString();
  
  // 記錄報告
  status.reports.push({
    timestamp: new Date().toISOString(),
    type: 'progress',
    message,
    files
  });
  
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  
  // 輸出進度報告
  const total = spec.checklist.length;
  const done = status.completed.length;
  
  console.log(`
═══════════════════════════════════════════════════════════════
📊 進度報告 [${done}/${total}]
═══════════════════════════════════════════════════════════════
✅ 剛完成：${message}
${files.length > 0 ? `📁 修改的檔案：\n${files.map(f => `   • ${f}`).join('\n')}` : ''}

📝 清單狀態：
${spec.checklist.map(item => {
  const icon = status.completed.includes(item.id) ? '✅' : 
               status.inProgress === item.id ? '🔧' : '⬜';
  const marker = status.inProgress === item.id ? ' ← 現在' : '';
  return `  ${icon} ${item.id}. ${item.desc}${marker}`;
}).join('\n')}
═══════════════════════════════════════════════════════════════
  `);
}

// 5-2: 每修改一個檔案
export function reportFileChange(taskId: string, file: string, change: string): void {
  const statusPath = path.join('ai-tasks', taskId, 'status.json');
  const status: TaskStatus = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  
  if (!status.reports) status.reports = [];
  status.lastUpdate = new Date().toISOString();
  
  status.reports.push({
    timestamp: new Date().toISOString(),
    type: 'progress',
    message: `修改 ${file}: ${change}`,
    files: [file]
  });
  
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  
  console.log(`📁 修改：${file} - ${change}`);
}

// 5-3: 遇到錯誤時
export function reportError(taskId: string, error: string): void {
  const statusPath = path.join('ai-tasks', taskId, 'status.json');
  const status: TaskStatus = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  
  if (!status.reports) status.reports = [];
  status.lastUpdate = new Date().toISOString();
  
  status.reports.push({
    timestamp: new Date().toISOString(),
    type: 'error',
    message: error
  });
  
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  
  console.error(`
═══════════════════════════════════════════════════════════════
❌ 錯誤報告
═══════════════════════════════════════════════════════════════
${error}
═══════════════════════════════════════════════════════════════
  `);
}

// 5-4: 需要等待時
export function reportWait(taskId: string, reason: string): void {
  const statusPath = path.join('ai-tasks', taskId, 'status.json');
  const status: TaskStatus = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  
  if (!status.reports) status.reports = [];
  status.lastUpdate = new Date().toISOString();
  
  status.reports.push({
    timestamp: new Date().toISOString(),
    type: 'wait',
    message: reason
  });
  
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  
  console.log(`⏳ 等待中：${reason}`);
}

// 5-5: 切換工作方向時
export function reportSwitch(taskId: string, from: string, to: string): void {
  const statusPath = path.join('ai-tasks', taskId, 'status.json');
  const status: TaskStatus = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  
  if (!status.reports) status.reports = [];
  status.lastUpdate = new Date().toISOString();
  
  status.reports.push({
    timestamp: new Date().toISOString(),
    type: 'switch',
    message: `從「${from}」切換到「${to}」`
  });
  
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  
  console.log(`🔄 切換：${from} → ${to}`);
}

// 5-6: 檢查最後報告時間（至少每 3 分鐘一次）
export function checkReportFrequency(taskId: string): boolean {
  const statusPath = path.join('ai-tasks', taskId, 'status.json');
  const status: TaskStatus = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  
  const lastUpdate = new Date(status.lastUpdate).getTime();
  const now = Date.now();
  const diffMinutes = (now - lastUpdate) / (1000 * 60);
  
  if (diffMinutes > 3) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ ⚠️ 報告超時                                                  ║
╠══════════════════════════════════════════════════════════════╣
║ 最後報告：${Math.floor(diffMinutes)} 分鐘前                              ║
║ 要求：至少每 3 分鐘報告一次                                  ║
╠══════════════════════════════════════════════════════════════╣
║ 扣分：-20 分                                                 ║
╚══════════════════════════════════════════════════════════════╝
    `);
    
    status.score = (status.score || 100) - 20;
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    return false;
  }
  
  return true;
}

// CLI
const command = process.argv[2];
const taskId = process.argv[3];

if (!command || !taskId) {
  console.error('用法: npx ts-node scripts/ai-reporter.ts <command> <taskId> [args...]');
  console.error('  progress <taskId> <completedId> <message> [files...]');
  console.error('  file <taskId> <file> <change>');
  console.error('  error <taskId> <message>');
  console.error('  wait <taskId> <reason>');
  console.error('  switch <taskId> <from> <to>');
  console.error('  check <taskId>');
  process.exit(1);
}

switch (command) {
  case 'progress':
    const completedId = parseInt(process.argv[4]);
    const message = process.argv[5];
    const files = process.argv.slice(6);
    reportProgress(taskId, completedId, message, files);
    break;
  case 'file':
    reportFileChange(taskId, process.argv[4], process.argv[5]);
    break;
  case 'error':
    reportError(taskId, process.argv[4]);
    break;
  case 'wait':
    reportWait(taskId, process.argv[4]);
    break;
  case 'switch':
    reportSwitch(taskId, process.argv[4], process.argv[5]);
    break;
  case 'check':
    checkReportFrequency(taskId);
    break;
  default:
    console.error(`未知命令：${command}`);
    process.exit(1);
}
