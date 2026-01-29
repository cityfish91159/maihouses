#!/usr/bin/env node
/**
 * AI Session CLI - 任務追蹤命令列工具
 *
 * 使用方式：
 *   node scripts/ai-supervisor/session.cjs start <taskId> [description]
 *   node scripts/ai-supervisor/session.cjs track
 *   node scripts/ai-supervisor/session.cjs audit
 *   node scripts/ai-supervisor/session.cjs end
 *   node scripts/ai-supervisor/session.cjs status
 */

const {
  log,
  logBox,
  c,
  loadSession,
  startTask,
  markTracked,
  markAudited,
  endTask,
  verifySessionIntegrity,
  loadScoreLog,
} = require('./supervisor.cjs');

// ═══════════════════════════════════════════════════════════════
// CLI 命令處理
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  logBox(
    'AI Session CLI - 使用說明',
    [
      '',
      '命令：',
      '  start <taskId> [desc]  開始新任務',
      '  track                  標記已追蹤變更',
      '  audit                  標記已審核代碼',
      '  end                    結束當前任務',
      '  status                 查看當前狀態',
      '  score                  查看扣分紀錄',
      '',
      '範例：',
      '  node session.cjs start FIX-123 "修復登入問題"',
      '  node session.cjs track',
      '  node session.cjs audit',
      '  node session.cjs end',
      '',
    ],
    'cyan'
  );
}

function cmdStart() {
  const taskId = args[1];
  const description = args.slice(2).join(' ');

  if (!taskId) {
    log('❌ 錯誤：請提供 taskId', 'red');
    log('   用法：session.cjs start <taskId> [description]', 'yellow');
    process.exit(1);
  }

  // 檢查是否有未結束的任務
  const existing = loadSession();
  if (existing) {
    log(`⚠️  警告：已有進行中的任務 ${existing.taskId}`, 'yellow');
    log('   請先執行 end 結束該任務', 'yellow');
    process.exit(1);
  }

  const session = startTask(taskId, description);

  logBox(
    `任務開始：${taskId}`,
    [
      '',
      `描述：${description || '(無描述)'}`,
      `開始時間：${session.startedAt}`,
      '',
      '⚡ 下一步：完成代碼修改後執行 track',
      '',
    ],
    'green'
  );
}

function cmdTrack() {
  try {
    const session = markTracked();
    logBox(
      '已標記追蹤',
      [
        '',
        `任務：${session.taskId}`,
        `追蹤時間：${session.trackedAt}`,
        '',
        '⚡ 下一步：審核代碼後執行 audit',
        '',
      ],
      'green'
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log(`❌ 錯誤：${message}`, 'red');
    process.exit(1);
  }
}

function cmdAudit() {
  try {
    const session = markAudited();
    logBox(
      '已標記審核',
      [
        '',
        `任務：${session.taskId}`,
        `審核時間：${session.auditedAt}`,
        '',
        '✅ 現在可以 commit 了',
        '',
      ],
      'green'
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log(`❌ 錯誤：${message}`, 'red');
    process.exit(1);
  }
}

function cmdEnd() {
  const session = endTask();

  if (!session) {
    log('ℹ️  沒有進行中的任務', 'cyan');
    return;
  }

  const duration =
    session.endedAt && session.startedAt
      ? Math.round(
          (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000 / 60
        )
      : 0;

  logBox(
    `任務結束：${session.taskId}`,
    [
      '',
      `開始：${session.startedAt}`,
      `結束：${session.endedAt}`,
      `耗時：${duration} 分鐘`,
      '',
      `追蹤：${session.tracked ? '✅' : '❌'}`,
      `審核：${session.audited ? '✅' : '❌'}`,
      `Commits：${session.commits?.length || 0}`,
      '',
    ],
    'magenta'
  );
}

function cmdStatus() {
  // 驗證 Session 完整性
  const integrity = verifySessionIntegrity();
  if (!integrity.valid) {
    log(`🚨 Session 異常：${integrity.reason}`, 'red');
    return;
  }

  const session = loadSession();

  if (!session) {
    logBox('當前狀態', ['', '沒有進行中的任務', '', '執行 start <taskId> 開始新任務', ''], 'cyan');
    return;
  }

  const elapsed = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000 / 60);

  logBox(
    `當前任務：${session.taskId}`,
    [
      '',
      `描述：${session.description || '(無)'}`,
      `開始：${session.startedAt}`,
      `已進行：${elapsed} 分鐘`,
      '',
      `追蹤：${session.tracked ? `✅ ${session.trackedAt}` : '❌ 未完成'}`,
      `審核：${session.audited ? `✅ ${session.auditedAt}` : '❌ 未完成'}`,
      '',
      session.tracked && session.audited ? '✅ 可以 commit' : '⚠️  尚未完成必要步驟',
      '',
    ],
    session.tracked && session.audited ? 'green' : 'yellow'
  );
}

function cmdScore() {
  const scoreLog = loadScoreLog();

  if (scoreLog.entries.length === 0) {
    logBox('扣分紀錄', ['', '🎉 目前沒有扣分紀錄', ''], 'green');
    return;
  }

  const lines = [
    '',
    `總扣分：${c.red}${c.bold}-${scoreLog.totalPenalty}${c.cyan} 分`,
    '',
    '最近 5 筆：',
    '',
  ];

  const recent = scoreLog.entries.slice(-5).reverse();
  recent.forEach((entry, i) => {
    lines.push(`${i + 1}. ${entry.reason} (-${entry.points})`);
    lines.push(`   ${entry.timestamp}`);
  });

  lines.push('');

  logBox('扣分紀錄', lines, 'yellow');
}

// ═══════════════════════════════════════════════════════════════
// 主程式
// ═══════════════════════════════════════════════════════════════

switch (command) {
  case 'start':
    cmdStart();
    break;
  case 'track':
    cmdTrack();
    break;
  case 'audit':
    cmdAudit();
    break;
  case 'end':
    cmdEnd();
    break;
  case 'status':
    cmdStatus();
    break;
  case 'score':
    cmdScore();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (command) {
      log(`❌ 未知命令：${command}`, 'red');
    }
    showHelp();
    process.exit(command ? 1 : 0);
}
