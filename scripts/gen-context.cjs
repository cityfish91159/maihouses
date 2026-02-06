#!/usr/bin/env node
/**
 * gen-context.cjs — 自動更新 .context/STATUS.md 的統計區段
 * 用法: npm run gen-context
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

// 1. 最近 10 次 commit
const recentCommits = run('git log --oneline -10');

// 2. 檔案統計
const srcCount = run('git ls-files src/ | wc -l').trim();
const apiCount = run('git ls-files api/ | wc -l').trim();
const testCount = run('git ls-files -- "*.test.ts" "*.test.tsx" | wc -l').trim();

// 3. 超過 500 行的大檔案（src/ 和 api/）
const bigFiles = run(
  'git ls-files src/ api/ | while read f; do lines=$(wc -l < "$f" 2>/dev/null); if [ "$lines" -gt 500 ] 2>/dev/null; then echo "$lines $f"; fi; done | sort -rn | head -15'
);

// 4. 近 7 天修改熱點
const hotFiles = run(
  'git log --since="7 days ago" --name-only --pretty=format: | sort | uniq -c | sort -rn | head -10'
);

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
${bigFiles || '（無）'}
\`\`\`

### 近 7 天修改熱點
\`\`\`
${hotFiles || '（無最近修改）'}
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
