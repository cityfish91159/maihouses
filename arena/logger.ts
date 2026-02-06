/**
 * 🔧 Arena Logger
 *
 * CLI 工具專用輸出
 * 這樣可以：
 * 1. 符合 no-console 規則
 * 2. 未來可以導向檔案或其他輸出
 * 3. 統一格式化
 */

const write = (msg: string): void => {
  process.stdout.write(msg + '\n');
};

const writeErr = (msg: string): void => {
  process.stderr.write(msg + '\n');
};

export const log = {
  /** 普通輸出 */
  info: (msg: string): void => write(msg),

  /** 成功訊息 */
  success: (msg: string): void => write(`✅ ${msg}`),

  /** 警告訊息 */
  warn: (msg: string): void => write(`⚠️ ${msg}`),

  /** 錯誤訊息 */
  error: (msg: string): void => writeErr(`❌ ${msg}`),

  /** 空行 */
  blank: (): void => write(''),

  /** 標題框 */
  header: (title: string): void => {
    write('╔════════════════════════════════════════════════════════════════╗');
    write(`║ ${title.padEnd(62)}║`);
    write('╚════════════════════════════════════════════════════════════════╝');
  },

  /** 分隔線 */
  divider: (char = '━'): void => {
    write(char.repeat(66));
  },

  /** 排行榜項目 */
  rank: (position: number, name: string, stats: string): void => {
    const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '  ';
    write(`  ${medal} #${position} ${name.padEnd(25)} ${stats}`);
  },

  /** 表格行 */
  row: (cols: string[]): void => {
    write('  ' + cols.join(' | '));
  },
};

export default log;
