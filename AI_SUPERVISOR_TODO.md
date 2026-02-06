# 🔥 AI 審查機制完整功能清單 v1.0

> **目標：AI 就算想偷懶，也只會偷到它自己的時間，絕對偷不到你的時間**

---

## 0. 務必自動觸發 ⚡

| #   | 功能             | 說明                                        | 狀態 | 實作檔案           |
| --- | ---------------- | ------------------------------------------- | ---- | ------------------ |
| 0-1 | 收到任務自動觸發 | 不需要手動執行命令，AI 收到任務第一秒就觸發 | ✅   | ai-auto-trigger.ts |
| 0-2 | 寫完代碼自動審查 | 每次修改檔案後自動執行 `npm run typecheck`  | ✅   | ai-auto-trigger.ts |
| 0-3 | 不靠 AI 自律     | 是機械式強制執行，不是「提醒」              | ✅   | ai-auto-trigger.ts |

---

## 1. 收到任務第一秒 📋

| #   | 功能                  | 說明                                | 狀態 | 實作檔案           |
| --- | --------------------- | ----------------------------------- | ---- | ------------------ |
| 1-1 | 輸出「📋 任務接收」框 | 固定格式，包含任務描述、時間        | ✅   | ai-auto-trigger.ts |
| 1-2 | 自動分析任務拆解      | AI 自己分析任務，拆成可驗證的子任務 | ✅   | ai-auto-trigger.ts |
| 1-3 | 列出完整工作清單      | 全部列出才能開始寫代碼              | ✅   | ai-auto-trigger.ts |
| 1-4 | 禁止跳過              | 沒有這個輸出就開始寫代碼 = 違規     | ✅   | ai-auto-trigger.ts |

---

## 2. 每次修改代碼後 🔍

| #   | 功能               | 說明                       | 狀態 | 實作檔案           |
| --- | ------------------ | -------------------------- | ---- | ------------------ |
| 2-1 | 強制執行 typecheck | `npm run typecheck`        | ✅   | ai-auto-trigger.ts |
| 2-2 | 輸出審查結果       | 通過/失敗，錯誤詳情        | ✅   | ai-auto-trigger.ts |
| 2-3 | 有錯誤立即修復     | 修復 → 重新檢查 → 直到通過 | ✅   | ai-score-gate.ts   |
| 2-4 | 禁止跳過審查       | 沒執行 typecheck = -20 分  | ✅   | ai-score-gate.ts   |

---

## 3. 80 分 HARD GATE 💀

| #    | 扣分項目        | 扣分                          | 狀態 | 實作檔案                |
| ---- | --------------- | ----------------------------- | ---- | ----------------------- |
| 3-1  | TypeScript 錯誤 | -10 分/個                     | ✅   | ai-score-gate.ts        |
| 3-2  | 使用 `any`      | -5 分/個                      | ✅   | ai-score-gate.ts        |
| 3-3  | 使用 `Function` | -5 分/個                      | ✅   | ai-score-gate.ts        |
| 3-4  | 使用 `{}`       | -5 分/個                      | ✅   | ai-score-gate.ts        |
| 3-5  | 使用 `Object`   | -5 分/個                      | ✅   | ai-score-gate.ts        |
| 3-6  | 函數 > 60 行    | -10 分/個                     | ✅   | ai-score-gate.ts        |
| 3-7  | 巢狀 > 3 層     | -10 分/個                     | ✅   | ai-score-gate.ts        |
| 3-8  | 沒進度報告      | -20 分                        | ✅   | ai-reporter.ts          |
| 3-9  | 便宜行事        | -30 分                        | ✅   | ai-laziness-detector.ts |
| 3-10 | **< 80 分觸發** | `git checkout .` 清除所有代碼 | ✅   | ai-score-gate.ts        |

---

## 4. 兩次偷懶機制 🦥

| #   | 偷懶定義         | 狀態 | 實作檔案                |
| --- | ---------------- | ---- | ----------------------- |
| 4-1 | 寫了組件沒整合   | ✅   | ai-laziness-detector.ts |
| 4-2 | import 錯誤路徑  | ✅   | ai-laziness-detector.ts |
| 4-3 | 只寫 UI 不寫邏輯 | ✅   | ai-laziness-detector.ts |
| 4-4 | 寫了沒用的代碼   | ✅   | ai-laziness-detector.ts |
| 4-5 | 改了檔案沒測試   | ✅   | ai-laziness-detector.ts |

| #   | 懲罰                  | 狀態 | 實作檔案                |
| --- | --------------------- | ---- | ----------------------- |
| 4-6 | 第一次 = 警告         | ✅   | ai-laziness-detector.ts |
| 4-7 | 第二次 = 清除所有代碼 | ✅   | ai-laziness-detector.ts |

---

## 5. 即時回報 📊

| #   | 回報時機          | 狀態 | 實作檔案       |
| --- | ----------------- | ---- | -------------- |
| 5-1 | 每完成一個子任務  | ✅   | ai-reporter.ts |
| 5-2 | 每修改一個檔案    | ✅   | ai-reporter.ts |
| 5-3 | 遇到錯誤時        | ✅   | ai-reporter.ts |
| 5-4 | 需要等待時        | ✅   | ai-reporter.ts |
| 5-5 | 切換工作方向時    | ✅   | ai-reporter.ts |
| 5-6 | 至少每 3 分鐘一次 | ✅   | ai-reporter.ts |

---

## 6. 任務完成時 🏁

| #   | 功能                  | 狀態 | 實作檔案         |
| --- | --------------------- | ---- | ---------------- |
| 6-1 | 輸出「🏁 任務完成」框 | ✅   | ai-completion.ts |
| 6-2 | 列出所有完成項目      | ✅   | ai-completion.ts |
| 6-3 | 列出所有修改檔案      | ✅   | ai-completion.ts |
| 6-4 | 列出耗時              | ✅   | ai-completion.ts |

---

## 7. Mutation Testing（測試的測試）🧱

| #   | 功能                 | 說明                              | 狀態 | 實作檔案            |
| --- | -------------------- | --------------------------------- | ---- | ------------------- |
| 7-1 | StrykerJS            | 隨機修改程式碼，測試應該要失敗    | ✅   | ai-mutation-test.ts |
| 7-2 | Mutation Score < 70% | PR 直接死亡                       | ✅   | ai-mutation-test.ts |
| 7-3 | 殺掉假測試           | AI 寫的「永遠不會失敗的垃圾測試」 | ✅   | ai-mutation-test.ts |

---

## 8. Contract Test / Schema Lock 🧱

| #   | 功能                  | 說明                     | 狀態 | 實作檔案            |
| --- | --------------------- | ------------------------ | ---- | ------------------- |
| 8-1 | 所有 API 有 schema.ts | Zod / JSON Schema 契約   | ✅   | ai-contract-test.ts |
| 8-2 | 自動驗證 response     | 機器驗證，不是人以為符合 | ✅   | ai-contract-test.ts |
| 8-3 | 禁止偷改 API 格式     | Schema 不符 = fail       | ✅   | ai-contract-test.ts |

---

## 9. Hermetic Build 🧱

| #   | 功能            | 說明                             | 狀態 | 實作檔案             |
| --- | --------------- | -------------------------------- | ---- | -------------------- |
| 9-1 | Docker build    | 固定 node 版本                   | ✅   | ai-hermetic-build.ts |
| 9-2 | frozen-lockfile | `pnpm install --frozen-lockfile` | ✅   | ai-hermetic-build.ts |
| 9-3 | 禁止本地 cache  | 「我本地可以過」= 無效           | ✅   | ai-hermetic-build.ts |

---

## 10. Diff Complexity Gate 🧱

| #    | 限制               | 說明             | 狀態 | 實作檔案        |
| ---- | ------------------ | ---------------- | ---- | --------------- |
| 10-1 | 最多 400 行 diff   | 超過 = PR fail   | ✅   | ai-diff-gate.ts |
| 10-2 | 最多 8 個檔案      | 超過 = PR fail   | ✅   | ai-diff-gate.ts |
| 10-3 | 不可跨 2 個 domain | 禁止 AI 暴力破關 | ✅   | ai-diff-gate.ts |

---

## 11. SBOM + 依賴掃描 🧱

| #    | 功能              | 說明         | 狀態 | 實作檔案        |
| ---- | ----------------- | ------------ | ---- | --------------- |
| 11-1 | npm audit         | 自動掃描漏洞 | ✅   | ai-sbom-scan.ts |
| 11-2 | trivy fs          | 安全掃描     | ✅   | ai-sbom-scan.ts |
| 11-3 | High/Critical CVE | = PR 死亡    | ✅   | ai-sbom-scan.ts |

---

## 12. 行為層封印 ☠️

| #    | 功能               | 說明                                | 狀態 | 實作檔案            |
| ---- | ------------------ | ----------------------------------- | ---- | ------------------- |
| 12-1 | 先寫測試才能寫實作 | 新功能沒 \*.spec.ts = fail          | ✅   | ai-behavior-seal.ts |
| 12-2 | Replay 驗證        | 10 組隨機資料，結果必須一致         | ✅   | ai-behavior-seal.ts |
| 12-3 | Chaos 注入         | 隨機 timeout/null/delay，系統不能炸 | ✅   | ai-behavior-seal.ts |

---

## 13. 數學級驗證 🧠

| #    | 功能                   | 說明                              | 狀態 | 實作檔案          |
| ---- | ---------------------- | --------------------------------- | ---- | ----------------- |
| 13-1 | Deterministic Replay   | 同輸入 = 同輸出，不穩定 = fail    | ✅   | ai-math-verify.ts |
| 13-2 | Property-Based Testing | 測規律不是測例子                  | ✅   | ai-math-verify.ts |
| 13-3 | Zero-Trust Merge       | 人類不可直接 merge，只有 Bot 可以 | ✅   | ai-math-verify.ts |

---

## 14. 零信任監工系統實作 🔧

### 14-1. 目錄結構

```
ai-tasks/
└── TASK-2025-001/
    ├── spec.json      # 任務規格
    ├── status.json    # 進度狀態
    └── output/        # AI 輸出
```

### 14-2. spec.json（任務規格）

```json
{
  "taskId": "TASK-2025-001",
  "title": "實作零信任 AI 監工系統",
  "created": "2025-12-09T00:00:00Z",
  "deadline": "2025-12-09T23:59:59Z",
  "checklist": [
    { "id": 1, "desc": "建立目錄結構", "required": true },
    { "id": 2, "desc": "建立 spec.json", "required": true },
    { "id": 3, "desc": "建立 status.json", "required": true },
    { "id": 4, "desc": "建立 ai-heartbeat.ts", "required": true },
    { "id": 5, "desc": "建立 ai-progress-verify.ts", "required": true },
    { "id": 6, "desc": "建立 ai-spec-guard.ts", "required": true },
    { "id": 7, "desc": "建立 ai-guard.yml", "required": true },
    { "id": 8, "desc": "執行 typecheck 驗證", "required": true }
  ],
  "outputSpec": {
    "requiredFiles": [
      "ai-tasks/TASK-2025-001/spec.json",
      "ai-tasks/TASK-2025-001/status.json",
      "scripts/ai-heartbeat.ts",
      "scripts/ai-progress-verify.ts",
      "scripts/ai-spec-guard.ts",
      ".github/workflows/ai-guard.yml"
    ],
    "mustPass": ["npm run typecheck"]
  }
}
```

### 14-3. status.json（進度狀態）

```json
{
  "taskId": "TASK-2025-001",
  "lastUpdate": "2025-12-09T12:00:00Z",
  "completed": [],
  "inProgress": null,
  "blocked": [],
  "score": 100
}
```

### 14-4. ai-heartbeat.ts（心跳監工 - 5分鐘超時）

```typescript
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
```

### 14-5. ai-progress-verify.ts（進度驗證 - git diff 偷懶偵測）

```typescript
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
    missingFiles.forEach((f) => console.log(`   - ${f}`));
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
```

### 14-6. ai-spec-guard.ts（規格驗證 - 輸出檢查）

```typescript
// scripts/ai-spec-guard.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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
  completed: number[];
  score: number;
}

function guardSpec(taskId: string): void {
  const specPath = path.join('ai-tasks', taskId, 'spec.json');
  const statusPath = path.join('ai-tasks', taskId, 'status.json');

  const spec: Spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  const status: Status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));

  let score = 100;
  const errors: string[] = [];

  // 1. 檢查所有必要檔案存在
  for (const file of spec.outputSpec.requiredFiles) {
    if (!fs.existsSync(file)) {
      errors.push(`缺少檔案：${file}`);
      score -= 10;
    }
  }

  // 2. 檢查所有必要項目完成
  const requiredItems = spec.checklist.filter((item) => item.required);
  for (const item of requiredItems) {
    if (!status.completed.includes(item.id)) {
      errors.push(`未完成：${item.desc}`);
      score -= 10;
    }
  }

  // 3. 執行所有必要命令
  for (const cmd of spec.outputSpec.mustPass) {
    try {
      execSync(cmd, { stdio: 'pipe' });
    } catch {
      errors.push(`命令失敗：${cmd}`);
      score -= 20;
    }
  }

  // 4. 檢查 TypeScript 品質
  try {
    const tsFiles = execSync('find scripts -name "*.ts" | head -20', {
      encoding: 'utf-8',
    })
      .split('\n')
      .filter(Boolean);

    for (const file of tsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const anyCount = (content.match(/: any/g) || []).length;
      if (anyCount > 0) {
        errors.push(`${file} 使用 any ${anyCount} 次`);
        score -= anyCount * 5;
      }
    }
  } catch {
    // 忽略
  }

  // 輸出結果
  if (errors.length > 0) {
    console.error(`
╔══════════════════════════════════════════════════════════════╗
║ ❌ 規格驗證失敗                                              ║
╠══════════════════════════════════════════════════════════════╣
${errors.map((e) => `║ • ${e.padEnd(56)}║`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║ 分數：${String(score).padEnd(54)}║
╚══════════════════════════════════════════════════════════════╝
    `);
  } else {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║ ✅ 規格驗證通過                                              ║
╠══════════════════════════════════════════════════════════════╣
║ 分數：${String(score).padEnd(54)}║
╚══════════════════════════════════════════════════════════════╝
    `);
  }

  if (score < 80) {
    console.error(`💀 分數 ${score} < 80，任務失敗`);
    process.exit(1);
  }
}

const taskId = process.argv[2];
if (!taskId) {
  console.error('用法: npx ts-node scripts/ai-spec-guard.ts TASK-2025-001');
  process.exit(1);
}

guardSpec(taskId);
```

### 14-7. ai-guard.yml（GitHub Actions CI）

```yaml
# .github/workflows/ai-guard.yml
name: AI Guard - 零信任監工

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ai-guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript Check
        run: npm run typecheck

      - name: Find AI Tasks
        id: find-tasks
        run: |
          if [ -d "ai-tasks" ]; then
            TASKS=$(ls -d ai-tasks/TASK-* 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "")
            echo "task=$TASKS" >> $GITHUB_OUTPUT
          fi

      - name: AI Heartbeat Check
        if: steps.find-tasks.outputs.task != ''
        run: npx ts-node scripts/ai-heartbeat.ts ${{ steps.find-tasks.outputs.task }}

      - name: AI Progress Verify
        if: steps.find-tasks.outputs.task != ''
        run: npx ts-node scripts/ai-progress-verify.ts ${{ steps.find-tasks.outputs.task }}

      - name: AI Spec Guard
        if: steps.find-tasks.outputs.task != ''
        run: npx ts-node scripts/ai-spec-guard.ts ${{ steps.find-tasks.outputs.task }}

      - name: Score Gate
        if: failure()
        run: |
          echo "╔══════════════════════════════════════════════════════════════╗"
          echo "║ 💀 AI 監工判定：失敗                                         ║"
          echo "║ 分數低於 80 或規格不符                                       ║"
          echo "║ PR 將被自動拒絕                                              ║"
          echo "╚══════════════════════════════════════════════════════════════╝"
          exit 1
```

---

## 15. 實作狀態追蹤 📋

| #    | 檔案                               | 狀態 |
| ---- | ---------------------------------- | ---- |
| 15-1 | ai-tasks/TASK-2025-001/spec.json   | ✅   |
| 15-2 | ai-tasks/TASK-2025-001/status.json | ✅   |
| 15-3 | scripts/ai-heartbeat.ts            | ✅   |
| 15-4 | scripts/ai-progress-verify.ts      | ✅   |
| 15-5 | scripts/ai-spec-guard.ts           | ✅   |
| 15-6 | .github/workflows/ai-guard.yml     | ✅   |

---
