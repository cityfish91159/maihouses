#!/usr/bin/env node
/**
 * AI Supervisor - 防弊系統核心
 *
 * 功能：
 * 1. Hash 校驗 - 防止腳本被篡改
 * 2. Session 管理 - 追蹤任務狀態
 * 3. 品質掃描 - 檢查 any/console.log/debugger
 * 4. 時間差檢測 - 偵測 --no-verify 繞過
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execSync, spawnSync } = require("child_process");

// ═══════════════════════════════════════════════════════════════
// 配置常數
// ═══════════════════════════════════════════════════════════════

const ROOT_DIR = path.resolve(__dirname, "../..");
const SESSION_FILE = path.join(ROOT_DIR, ".ai-session.json");
const SESSION_BACKUP = path.join(ROOT_DIR, ".git", "ai-session-backup.json");
const SCORE_LOG = path.join(ROOT_DIR, ".ai-score-log.json");

// 受保護的檔案（篡改這些 = 嚴重違規）
const PROTECTED_FILES = [
  "scripts/ai-supervisor/supervisor.cjs",
  "scripts/ai-supervisor/session.cjs",
  ".git/hooks/pre-commit",
  ".git/hooks/post-commit",
  // 新增：
  "scripts/quality-gate.cjs",
  ".claude/settings.json",
  ".github/workflows/hard-gate.yml",
];

// 顏色輸出
const c = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(msg, color = "reset") {
  console.log(`${c[color]}${msg}${c.reset}`);
}

function logBox(title, lines, color = "cyan") {
  const width = 60;
  const border = "═".repeat(width);
  log(`╔${border}╗`, color);
  log(`║ ${c.bold}${title.padEnd(width - 1)}${c[color]}║`, color);
  log(`╠${border}╣`, color);
  lines.forEach((line) => {
    const cleanLine = line.substring(0, width - 2);
    log(`║ ${cleanLine.padEnd(width - 1)}║`, color);
  });
  log(`╚${border}╝`, color);
}

// ═══════════════════════════════════════════════════════════════
// Hash 校驗模組
// ═══════════════════════════════════════════════════════════════

/**
 * 計算檔案的 SHA256 hash
 */
function getFileHash(filePath) {
  const fullPath = path.join(ROOT_DIR, filePath);
  if (!fs.existsSync(fullPath)) return null;
  const content = fs.readFileSync(fullPath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * 載入已儲存的 hash（首次執行時建立）
 */
function loadProtectedHashes() {
  const hashFile = path.join(ROOT_DIR, ".ai-supervisor-hashes.json");
  if (!fs.existsSync(hashFile)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(hashFile, "utf-8"));
}

/**
 * 儲存受保護檔案的 hash
 */
function saveProtectedHashes() {
  const hashFile = path.join(ROOT_DIR, ".ai-supervisor-hashes.json");
  const hashes = {};
  for (const file of PROTECTED_FILES) {
    const hash = getFileHash(file);
    if (hash) {
      hashes[file] = hash;
    }
  }
  hashes._createdAt = new Date().toISOString();
  fs.writeFileSync(hashFile, JSON.stringify(hashes, null, 2));
  return hashes;
}

/**
 * 檢查是否有篡改受保護檔案
 * @returns {{ tampered: boolean, files: string[] }}
 */
function checkTamper() {
  const savedHashes = loadProtectedHashes();

  // 首次執行，建立 hash 基準
  if (!savedHashes) {
    saveProtectedHashes();
    return { tampered: false, files: [] };
  }

  const tamperedFiles = [];
  for (const file of PROTECTED_FILES) {
    const currentHash = getFileHash(file);
    const savedHash = savedHashes[file];

    if (currentHash && savedHash && currentHash !== savedHash) {
      tamperedFiles.push(file);
    }
  }

  return {
    tampered: tamperedFiles.length > 0,
    files: tamperedFiles,
  };
}

// ═══════════════════════════════════════════════════════════════
// Session 管理模組
// ═══════════════════════════════════════════════════════════════

/**
 * 載入 Session
 */
function loadSession() {
  if (!fs.existsSync(SESSION_FILE)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * 儲存 Session（含備份）
 */
function saveSession(session) {
  const content = JSON.stringify(session, null, 2);
  fs.writeFileSync(SESSION_FILE, content);

  // 同步備份到 .git 目錄
  const gitDir = path.dirname(SESSION_BACKUP);
  if (fs.existsSync(gitDir)) {
    fs.writeFileSync(SESSION_BACKUP, content);
  }
}

/**
 * 驗證 Session 一致性（防止刪除主檔再建新的）
 */
function verifySessionIntegrity() {
  const main = loadSession();

  if (!fs.existsSync(SESSION_BACKUP)) {
    // 備份不存在但主檔存在，可能是首次
    if (main) {
      saveSession(main); // 建立備份
    }
    return { valid: true };
  }

  try {
    const backup = JSON.parse(fs.readFileSync(SESSION_BACKUP, "utf-8"));

    // 如果主檔不存在但備份存在 = 可疑
    if (!main && backup) {
      return {
        valid: false,
        reason: "Session 檔案被刪除但備份存在",
      };
    }

    // 如果 taskId 不一致 = 可疑
    if (main && backup && main.taskId !== backup.taskId) {
      return {
        valid: false,
        reason: "Session taskId 與備份不一致",
      };
    }

    return { valid: true };
  } catch {
    return { valid: true };
  }
}

/**
 * 開始新任務
 */
function startTask(taskId, description = "") {
  const session = {
    taskId,
    description,
    startedAt: new Date().toISOString(),
    tracked: false,
    audited: false,
    preCommitRan: null,
    commits: [],
  };
  saveSession(session);
  return session;
}

/**
 * 記錄 track
 */
function markTracked() {
  const session = loadSession();
  if (!session) {
    throw new Error("沒有進行中的 Session，請先執行 start");
  }
  session.tracked = true;
  session.trackedAt = new Date().toISOString();
  saveSession(session);
  return session;
}

/**
 * 記錄 audit
 */
function markAudited() {
  const session = loadSession();
  if (!session) {
    throw new Error("沒有進行中的 Session，請先執行 start");
  }
  session.audited = true;
  session.auditedAt = new Date().toISOString();
  saveSession(session);
  return session;
}

/**
 * 記錄 pre-commit 執行時間
 */
function markPreCommitRan() {
  const session = loadSession();
  if (!session) return null;
  session.preCommitRan = new Date().toISOString();
  saveSession(session);
  return session;
}

/**
 * 結束任務
 */
function endTask() {
  const session = loadSession();
  if (session) {
    session.endedAt = new Date().toISOString();
    // 不刪除，保留歷史
    const historyDir = path.join(ROOT_DIR, ".ai-sessions");
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    const historyFile = path.join(historyDir, `${session.taskId}.json`);
    fs.writeFileSync(historyFile, JSON.stringify(session, null, 2));
  }

  // 清除當前 session
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }
  if (fs.existsSync(SESSION_BACKUP)) {
    fs.unlinkSync(SESSION_BACKUP);
  }

  return session;
}

// ═══════════════════════════════════════════════════════════════
// 品質掃描模組
// ═══════════════════════════════════════════════════════════════

/**
 * 檢查檔案是否被 gitignore
 */
function isGitIgnored(file) {
  const result = spawnSync("git", ["check-ignore", "-q", file], {
    cwd: ROOT_DIR,
    encoding: "utf-8",
  });
  return result.status === 0;
}

/**
 * 取得 staged 檔案
 */
function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
      cwd: ROOT_DIR,
      encoding: "utf-8",
    });
    return output
      .split("\n")
      .filter((f) => f.trim())
      .filter(
        (f) =>
          f.endsWith(".ts") ||
          f.endsWith(".tsx") ||
          f.endsWith(".js") ||
          f.endsWith(".jsx"),
      );
  } catch {
    return [];
  }
}

/**
 * 掃描品質問題
 */
function scanQuality(files) {
  const issues = [];

  for (const file of files) {
    // 跳過 gitignored 檔案
    if (isGitIgnored(file)) continue;

    const fullPath = path.join(ROOT_DIR, file);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, i) => {
      const lineNum = i + 1;
      const trimmed = line.trim();

      // 跳過註解
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

      // 檢查 : any（但排除 catch）
      if (/:\s*any\b/.test(line) && !line.includes("catch")) {
        issues.push({
          file,
          line: lineNum,
          type: "any",
          content: trimmed.substring(0, 60),
        });
      }

      // 檢查 console.log（排除測試檔）
      if (!file.includes(".test.") && !file.includes("__tests__")) {
        if (/console\.log\(/.test(line)) {
          issues.push({
            file,
            line: lineNum,
            type: "console.log",
            content: trimmed.substring(0, 60),
          });
        }
      }

      // 檢查 debugger
      if (/\bdebugger\b/.test(line)) {
        issues.push({
          file,
          line: lineNum,
          type: "debugger",
          content: trimmed.substring(0, 60),
        });
      }
    });
  }

  return issues;
}

// ═══════════════════════════════════════════════════════════════
// 分數管理模組
// ═══════════════════════════════════════════════════════════════

/**
 * 載入分數紀錄
 */
function loadScoreLog() {
  if (!fs.existsSync(SCORE_LOG)) {
    return { entries: [], totalPenalty: 0 };
  }
  try {
    return JSON.parse(fs.readFileSync(SCORE_LOG, "utf-8"));
  } catch {
    return { entries: [], totalPenalty: 0 };
  }
}

/**
 * 記錄扣分
 */
function logPenalty(points, reason, details = {}) {
  const scoreLog = loadScoreLog();
  const entry = {
    timestamp: new Date().toISOString(),
    points,
    reason,
    ...details,
  };
  scoreLog.entries.push(entry);
  scoreLog.totalPenalty += Math.abs(points);
  fs.writeFileSync(SCORE_LOG, JSON.stringify(scoreLog, null, 2));

  log(`\n💀 扣分：${points} 分`, "red");
  log(`   原因：${reason}`, "yellow");

  return entry;
}

// ═══════════════════════════════════════════════════════════════
// 導出
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // 常數
  ROOT_DIR,
  SESSION_FILE,
  PROTECTED_FILES,

  // 工具
  log,
  logBox,
  c,

  // Hash
  getFileHash,
  checkTamper,
  saveProtectedHashes,

  // Session
  loadSession,
  saveSession,
  verifySessionIntegrity,
  startTask,
  markTracked,
  markAudited,
  markPreCommitRan,
  endTask,

  // 品質
  isGitIgnored,
  getStagedFiles,
  scanQuality,

  // 分數
  loadScoreLog,
  logPenalty,
};
