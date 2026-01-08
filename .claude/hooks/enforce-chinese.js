#!/usr/bin/env node

/**
 * 語言檢查 Hook - 強制 Claude 使用中文回應
 *
 * 當 Claude 的回應包含過多英文時，攔截並提醒
 *
 * 使用方式：node enforce-chinese.js "回應內容"
 */

const response = process.argv[2] || "";

if (!response) {
  console.log("✅ 無內容，跳過檢查");
  process.exit(0);
}

// 移除代碼塊、指令、URL、路徑
const withoutCode = response
  .replace(/```[\s\S]*?```/g, "") // 代碼塊
  .replace(/`[^`]+`/g, "") // 行內代碼
  .replace(/https?:\/\/[^\s]+/g, "") // URL
  .replace(/[a-zA-Z]:\\[^\s]+/g, "") // Windows 路徑
  .replace(/\/[a-zA-Z0-9_\-/.]+/g, "") // Unix 路徑
  .replace(/npm\s+[^\n]+/g, "") // npm 指令
  .replace(/git\s+[^\n]+/g, ""); // git 指令

// 計算中英文比例
const chineseChars = (withoutCode.match(/[\u4e00-\u9fa5]/g) || []).length;
const englishWords = (withoutCode.match(/\b[a-zA-Z]{3,}\b/g) || []).length; // 至少 3 個字母的單詞

// 常見技術術語白名單（不計入違規）
const techTerms = [
  "React",
  "TypeScript",
  "API",
  "Hook",
  "Props",
  "Component",
  "JavaScript",
  "CSS",
  "HTML",
  "JSON",
  "SQL",
  "RPC",
  "Supabase",
  "PostgreSQL",
  "Vercel",
  "npm",
  "git",
  "interface",
  "type",
  "function",
  "const",
  "let",
  "async",
];

let whitelistCount = 0;
for (const term of techTerms) {
  const regex = new RegExp(`\\b${term}\\b`, "gi");
  whitelistCount += (withoutCode.match(regex) || []).length;
}

const actualEnglish = Math.max(0, englishWords - whitelistCount);

// 檢測邏輯：
// 1. 如果有英文說明（>=6 個詞）但幾乎沒有中文（<5 個字）-> 違規
// 2. 如果英文詞數 > 中文字數的 40% -> 違規
const threshold = 0.4;
const ratio = chineseChars > 0 ? actualEnglish / chineseChars : Infinity;

const hasMostlyEnglish = actualEnglish >= 6 && chineseChars < 5;
const hasExcessiveEnglish = ratio > threshold && chineseChars > 10;

if (hasMostlyEnglish || hasExcessiveEnglish) {
  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 語言規範違規警告 (CLAUDE.md Priority 0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

中文字數: ${chineseChars}
英文詞數: ${actualEnglish}（排除代碼/術語）
違規比例: ${(ratio * 100).toFixed(1)}% (閾值: ${threshold * 100}%)

❌ 違反 CLAUDE.md 第 7-52 行語言規範
   用戶明確要求所有回應必須使用繁體中文

✅ 請重新用中文撰寫回應內容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
  process.exit(1);
}

console.log(
  `✅ 語言檢查通過 (中文: ${chineseChars}, 英文: ${actualEnglish}, 比例: ${(ratio * 100).toFixed(1)}%)`,
);
process.exit(0);
