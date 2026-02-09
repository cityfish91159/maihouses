#!/usr/bin/env node
/**
 * gen-context.cjs — 自動更新 .context/STATUS.md 的統計區段
 * 用法: npm run gen-context
 *
 * 跨平台相容：純 Node.js + git 指令，不依賴 Unix shell 工具
 */
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const STATUS_PATH = path.join(ROOT, '.context', 'STATUS.md');

function run(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

// 1. 最近 10 次 commit（純 git，跨平台）
const recentCommits = run('git log --oneline -10');

// 2. 檔案統計（用 Node.js 計算行數，不依賴 wc）
function countFiles(pattern) {
  const output = run(`git ls-files ${pattern}`);
  if (!output) return '0';
  return String(output.split('\n').filter(Boolean).length);
}

const srcCount = countFiles('src/');
const apiCount = countFiles('api/');
const testCount = countFiles('"*.test.ts" "*.test.tsx"');

// 3. 超過 500 行的大檔案（純 Node.js 計算）
function findBigFiles() {
  const output = run('git ls-files src/ api/');
  if (!output) return '（無）';

  const files = output.split('\n').filter(Boolean);
  const results = [];

  for (const f of files) {
    const fullPath = path.join(ROOT, f);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      if (lines > 500) {
        results.push({ lines, file: f });
      }
    } catch {
      // 忽略無法讀取的檔案
    }
  }

  results.sort((a, b) => b.lines - a.lines);
  return results
    .slice(0, 15)
    .map((r) => `${r.lines} ${r.file}`)
    .join('\n') || '（無）';
}

const bigFiles = findBigFiles();

// 4. 近 7 天修改熱點（純 git + Node.js 計數）
function findHotFiles() {
  const output = run('git log --since="7 days ago" --name-only --pretty=format:');
  if (!output) return '（無最近修改）';

  const counts = {};
  for (const line of output.split('\n')) {
    const f = line.trim();
    if (!f) continue;
    counts[f] = (counts[f] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([file, count]) => `  ${String(count).padStart(4)} ${file}`)
    .join('\n') || '（無最近修改）';
}

const hotFiles = findHotFiles();

// 組裝統計區段
const statsBlock = `
## 自動統計

> 由 \`npm run gen-context\` 於 ${new Date().toISOString().slice(0, 10)} 產生

### 最近 commit
\`\`\`
${recentCommits}
\`\`\`

### 檔案數量
| 目錄 | 檔案數 |
|------|--------|
| src/ | ${srcCount} |
| api/ | ${apiCount} |
| 測試 | ${testCount} |

### 大檔案（>500 行）
\`\`\`
${bigFiles}
\`\`\`

### 近 7 天修改熱點
\`\`\`
${hotFiles}
\`\`\`
`;

// 讀取現有 STATUS.md 並替換或追加統計區段
let content = '';
try {
  content = fs.readFileSync(STATUS_PATH, 'utf8');
} catch {
  console.error('找不到 .context/STATUS.md，請先建立');
  process.exit(1);
}

// 替換 <!-- gen-context:recent-commits --> 區段中的 commit 列表
const commitBlock = recentCommits
  .split('\n')
  .map((l) => l.trim())
  .join('\n');

content = content.replace(
  /<!-- gen-context:recent-commits -->\n```\n[\s\S]*?\n```/,
  `<!-- gen-context:recent-commits -->\n\`\`\`\n${commitBlock}\n\`\`\``
);

// 移除舊的自動統計區段（如果有）
content = content.replace(/\n## 自動統計[\s\S]*$/, '');

// 追加新的統計區段
content = content.trimEnd() + '\n' + statsBlock;

fs.writeFileSync(STATUS_PATH, content, 'utf8');
console.log('✅ .context/STATUS.md 已更新');
