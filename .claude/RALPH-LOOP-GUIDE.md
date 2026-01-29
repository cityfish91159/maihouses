# 🔄 MaiHouses Ralph 自動化開發循環指南

> **版本**: 1.1.0
> **建立日期**: 2026-01-15
> **適用專案**: MaiHouses
> **基於**: Ralph Wiggum 技術 + Multi-Agent Ralph v2.42

---

## 📋 目錄

1. [快速開始](#1-快速開始)
2. [核心概念](#2-核心概念)
3. [7-Step 工作循環](#3-7-step-工作循環)
4. [狀態持久化系統](#4-狀態持久化系統)
5. [Rate Limit 恢復機制](#5-rate-limit-恢復機制)
6. [Skills 整合](#6-skills-整合)
7. [安全防護機制](#7-安全防護機制)
8. [最佳實踐](#8-最佳實踐)
9. [常用指令模板](#9-常用指令模板)
10. [故障排除](#10-故障排除)
11. [Claude Code 2.1.9 優化整合](#11-claude-code-219-優化整合)

---

## 1. 快速開始

### 1.1 首次設置

```bash
# 在專案根目錄執行
cd /c/Users/陳世瑜/maihouses

# 創建狀態追蹤檔案
touch @progress.md @fix_plan.md

# 創建上下文快照目錄
mkdir -p .claude/context
```

### 1.2 初始化狀態檔案

**@progress.md** - 複製以下內容：

```markdown
# 📊 MaiHouses 開發進度

## 最後更新

- **時間**: 2026-01-15T00:00:00
- **Session ID**: initial
- **當前任務**: 無

---

## ✅ 已完成

（初始化，尚無完成項目）

---

## 🔄 進行中

（初始化，尚無進行中項目）

---

## 📝 學習筆記

### TypeScript

- `exactOptionalPropertyTypes: true` 需要 `prop?: T | undefined`
- `noUncheckedIndexedAccess` 讓 `arr[0]` 返回 `T | undefined`

### 測試

- 使用 `data-testid` 精確定位元素
- 避免數字匹配歧義（「問題 1」會匹配「問題 10」）

---

## 🔮 下次恢復指令
```

請讀取 @progress.md 和 @fix_plan.md，確認當前狀態後繼續作業。

```

---

## ⚠️ Blocked (需人工介入)

無

---

## 📈 統計

| 指標 | 數值 |
|------|------|
| 總完成任務 | 0 |
| 測試通過率 | - |
| 3-Fix 觸發次數 | 0 |
```

**@fix_plan.md** - 複製以下內容：

```markdown
# 🔧 Fix Plan

> 優先級排序的待辦清單，用於 Ralph 循環追蹤

---

## Priority 1 (Blocking)

（無阻塞項目）

---

## Priority 2 (Important)

（無重要項目）

---

## Priority 3 (Nice to Have)

（無可選項目）

---

## ⚠️ Blocked (需人工介入)

（無阻塞項目）

---

## 📅 最後更新

2026-01-15T00:00:00
```

---

## 2. 核心概念

### 2.1 Ralph 技術原理

Ralph 是一個迭代式 AI 開發方法論，核心是一個簡單的 while 循環：

```
EXECUTE → VALIDATE → (PASS? EXIT : ITERATE)
```

**關鍵原則**：

- **迭代優於完美**：持續改進，而非一次到位
- **失敗是數據**：錯誤可預測且有資訊價值
- **持久化為王**：狀態必須能跨 session 恢復

### 2.2 MaiHouses 整合架構

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAIHOUSES RALPH LOOP                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐        │
│   │ CONTEXT │──▶│ EXECUTE │──▶│ REVIEW  │──▶│ COMMIT  │        │
│   └─────────┘   └─────────┘   └─────────┘   └─────────┘        │
│        │             │             │             │              │
│        ▼             ▼             ▼             ▼              │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              STATE PERSISTENCE LAYER                     │  │
│   │  @progress.md │ @fix_plan.md │ Git History │ TodoWrite  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                   14 SKILLS 整合                         │  │
│   │  code-validator │ type-checker │ pre-commit-validator   │  │
│   │  read-before-edit │ rigorous_testing │ security_audit   │  │
│   │  code-review-excellence │ frontend_mastery │ ...        │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 三層持久化機制

| 層級        | 檔案           | 用途                             | 恢復優先級 |
| ----------- | -------------- | -------------------------------- | ---------- |
| **Layer 1** | `@progress.md` | 人類可讀摘要、學習筆記、恢復指令 | 🔴 最高    |
| **Layer 2** | `@fix_plan.md` | 結構化待辦清單                   | 🟡 高      |
| **Layer 3** | Git History    | 代碼真實狀態                     | 🟢 基礎    |

---

## 3. 7-Step 工作循環

### 3.1 完整循環流程

```
┌─────────────────────────────────────────────────────────────────┐
│                         7-STEP CYCLE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: CONTEXT (上下文建立) ◀─────────────────────────────┐  │
│  ├── 讀取 @progress.md（恢復學習筆記）                       │  │
│  ├── 讀取 @fix_plan.md（確定待辦項目）                       │  │
│  ├── 讀取相關工單 (.claude/tickets/*.md)                     │  │
│  └── 使用 /read-before-edit skill                            │  │
│          │                                                    │  │
│          ▼                                                    │  │
│  Step 2: PLAN (計劃制定)                                     │  │
│  ├── 使用 EnterPlanMode 進入計劃模式                         │  │
│  ├── 分解任務為可執行步驟                                    │  │
│  ├── 使用 TodoWrite 建立追蹤清單                             │  │
│  └── 等待用戶批准計劃                                        │  │
│          │                                                    │  │
│          ▼                                                    │  │
│  Step 3: READ (深度閱讀)                                     │  │
│  ├── 讀取要修改的檔案                                        │  │
│  ├── 讀取所有 import 的模組                                  │  │
│  ├── 讀取相關類型定義                                        │  │
│  └── 理解現有架構和模式                                      │  │
│          │                                                    │  │
│          ▼                                                    │  │
│  Step 4: EXECUTE (施作實作)                                  │  │
│  ├── 使用 Edit/Write 工具修改代碼                            │  │
│  ├── 逐一完成 TodoWrite 項目                                 │  │
│  ├── 每完成一項立即標記 completed                            │  │
│  └── 使用 /code-validator skill                              │  │
│          │                                                    │  │
│          ▼                                                    │  │
│  Step 5: REVIEW (審核驗證) ─── Two-Stage Review              │  │
│  ├── Stage 1: Spec Compliance（功能符合度）                  │  │
│  │   • 需求是否滿足？                                        │  │
│  │   • 邊界案例是否處理？                                    │  │
│  │   • 約束條件是否遵守？                                    │  │
│  ├── Stage 2: Code Quality（代碼品質）                       │  │
│  │   • 類型安全？(npm run typecheck)                         │  │
│  │   • 代碼風格？(npm run lint)                              │  │
│  │   • 測試通過？(npm test)                                  │  │
│  │   • 安全性？                                              │  │
│  └── 全部通過 → Step 7 / 任一失敗 → Step 6                   │  │
│          │                                                    │  │
│          ▼                                                    │  │
│  Step 6: FIX (修復迭代) ─── 3-Fix Rule                       │  │
│  ├── Fix 1: 自動修復                                         │  │
│  ├── Fix 2: 分析根因，嘗試不同策略                           │  │
│  ├── Fix 3: 最後嘗試                                         │  │
│  ├── 通過 → Step 7                                           │  │
│  └── 第 3 次失敗 → ESCALATION（記錄問題，跳過任務）          │  │
│          │                                                    │  │
│          ▼                                                    │  │
│  Step 7: COMMIT (提交保存)                                   │  │
│  ├── 使用 /pre-commit-validator 最終檢查                     │  │
│  ├── git add + git commit                                    │  │
│  ├── 更新 @progress.md（記錄完成項目、學習筆記）             │  │
│  ├── 更新 @fix_plan.md（標記完成）                           │  │
│  └── 還有待辦？→ 回到 Step 1 ────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Two-Stage Review 詳解

**Stage 1: Spec Compliance（必須通過才能進入 Stage 2）**

| 檢查項目 | 判斷標準                       |
| -------- | ------------------------------ |
| 需求滿足 | 所有規格要求都已實作           |
| 用例覆蓋 | 所有使用情境都能正常運作       |
| 約束遵守 | 沒有違反任何限制條件           |
| 邊界處理 | 空值、極端值、錯誤輸入都有處理 |

**Stage 2: Code Quality（Stage 1 通過後執行）**

| 檢查項目   | 驗證方式                   |
| ---------- | -------------------------- |
| 類型安全   | `npm run typecheck` 零錯誤 |
| 代碼風格   | `npm run lint` 零警告      |
| 測試通過   | `npm test` 100% 通過       |
| 效能可接受 | 無明顯效能問題             |
| 安全合規   | 無 OWASP Top 10 漏洞       |

### 3.3 3-Fix Rule 詳解

```
┌─────────────────────────────────────────────────────────────────┐
│                       3-FIX RULE PROTOCOL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔧 Fix Attempt 1: 自動修復                                     │
│  ├── 根據錯誤訊息直接修復                                       │
│  ├── 重新執行 npm run gate && npm test                          │
│  └── ✅ 通過 → 繼續 Step 7                                      │
│      ❌ 失敗 → 進入 Fix 2                                       │
│                                                                 │
│  🔧 Fix Attempt 2: 根因分析                                     │
│  ├── 分析錯誤的根本原因                                         │
│  ├── 嘗試不同的修復策略                                         │
│  ├── 可能需要讀取更多相關檔案                                   │
│  └── ✅ 通過 → 繼續 Step 7                                      │
│      ❌ 失敗 → 進入 Fix 3                                       │
│                                                                 │
│  🔧 Fix Attempt 3: 最後嘗試                                     │
│  ├── 嘗試最後一種修復方案                                       │
│  └── ✅ 通過 → 繼續 Step 7                                      │
│      ❌ 失敗 → 觸發 ESCALATION                                  │
│                                                                 │
│  🚨 ESCALATION (第 3 次失敗後觸發)                              │
│  ├── 1. 在 @progress.md 記錄問題詳情                            │
│  │      - 錯誤訊息                                              │
│  │      - 已嘗試的修復方案                                      │
│  │      - 可能的根因分析                                        │
│  ├── 2. 在 @fix_plan.md 標記任務為 "⚠️ Blocked"                 │
│  ├── 3. 跳過此任務，繼續下一個                                  │
│  └── 4. 等待人工介入                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 狀態持久化系統

### 4.1 @progress.md 完整規範

```markdown
# 📊 MaiHouses 開發進度

## 最後更新

- **時間**: 2026-01-15T15:30:00
- **Session ID**: abc123
- **當前任務**: AUDIT-01 Phase 5

---

## ✅ 已完成

### AUDIT-01 三頁品質審計

- [x] Phase 1-2: 安全修復與日誌規範化
  - Commit: 87a1ff33
  - 修改: logger.ts, api/\*.ts
- [x] Phase 6: 留言按讚競態條件修復
  - Commit: def5678
  - 修改: useComments.ts
  - 新增測試: useComments.raceCondition.test.ts
- [x] Phase 8: QA 卡片虛擬化
  - Commit: ghi9012
  - 修改: QASection.tsx
  - 測試: 15/15 通過
  - 關鍵學習: 拆分組件避免 hook 提前執行

---

## 🔄 進行中

### Phase 5: Lead 類型定義重構

- **狀態**: 計劃已批准，Step 3 READ 完成
- **當前步驟**: Step 4 EXECUTE
- **預計修改檔案**:
  - [x] src/pages/UAG/types/uag.types.ts (已讀取)
  - [x] src/pages/UAG/services/uagService.ts (已讀取)
  - [ ] src/pages/UAG/hooks/useLeadPurchase.ts (待修改)
- **TodoWrite 項目**:
  - [x] 新增 PurchasedLead 介面
  - [x] 新增 UnpurchasedLead 介面
  - [ ] 新增類型守衛函數
  - [ ] 更新 uagService.ts
  - [ ] 更新 useLeadPurchase.ts

---

## 📝 學習筆記

### TypeScript 技巧

- `exactOptionalPropertyTypes: true` 需要 `prop?: T | undefined` 而非 `prop?: T`
- `noUncheckedIndexedAccess` 會讓 `arr[0]` 返回 `T | undefined`
- 使用 `Omit<T, 'key'>` 排除不需要的屬性

### 測試技巧

- 避免數字匹配歧義：「問題 1」會匹配「問題 10」，改用「第1題」
- 使用 `data-testid` 精確定位虛擬化容器
- JSDOM 環境中虛擬化列表不會渲染內容（無實際尺寸）

### 架構決策

- 拆分組件避免 hook 提前執行：SimpleList vs VirtualizedListInner
- 使用常數取代硬編碼魔術數字
- 最後一項不加間距避免多餘空白

### 專案特定

- MaiHouses 使用 `npm run gate` 合併 typecheck + lint
- 品質關卡必須 100% 通過
- 禁止使用 `any` 類型

---

## 🔮 下次恢復指令
```

我正在進行 AUDIT-01 Phase 5: Lead 類型定義重構

請執行以下恢復流程：

1. 讀取狀態
   - Read @progress.md（本檔案）
   - Read @fix_plan.md
   - 執行 git status 確認代碼狀態

2. 恢復上下文
   - 我已完成 Step 3 READ
   - 目前在 Step 4 EXECUTE
   - 已完成：PurchasedLead、UnpurchasedLead 介面
   - 待完成：類型守衛函數、uagService.ts、useLeadPurchase.ts

3. 繼續作業
   - 讀取 src/pages/UAG/types/uag.types.ts
   - 繼續實作類型守衛函數 isPurchasedLead, isUnpurchasedLead
   - 使用 TodoWrite 追蹤進度

```

---

## ⚠️ Blocked (需人工介入)

### [範例] Phase X: 某功能
- **問題**: 描述問題
- **嘗試過的修復**:
  1. 方案一：...
  2. 方案二：...
  3. 方案三：...
- **可能根因**: 分析
- **建議**: 人工檢查 XXX

（目前無阻塞項目）

---

## 📈 統計

| 指標 | 數值 |
|------|------|
| 總完成任務 | 5 |
| 總測試數 | 808 |
| 測試通過率 | 100% |
| 3-Fix 觸發次數 | 0 |
| Blocked 任務 | 0 |
| 本次 Session 完成 | 3 |
```

### 4.2 @fix_plan.md 完整規範

```markdown
# 🔧 Fix Plan

> MaiHouses 待辦清單，用於 Ralph 循環追蹤
>
> **規則**：
>
> - Priority 1 必須先完成
> - Blocked 項目需人工介入
> - 完成後立即打勾 [x]

---

## Priority 1 (Blocking) 🔴

> 阻塞其他工作的關鍵任務

- [x] AUDIT-01 P1-2: 安全修復與日誌規範化
- [x] AUDIT-01 P6: 留言按讚競態條件修復
- [x] AUDIT-01 P8: QA 卡片虛擬化
- [ ] **AUDIT-01 P5: Lead 類型定義重構** ← 當前任務
  - 狀態: Step 4 EXECUTE 進行中
  - 預計完成: 2026-01-15

---

## Priority 2 (Important) 🟡

> 重要但不阻塞的任務

- [ ] AUDIT-01 P9: Feed 頁面 Skeleton
- [ ] AUDIT-01 P10: 效能優化
- [ ] 增加 Community 頁面測試覆蓋

---

## Priority 3 (Nice to Have) 🟢

> 可選改進項目

- [ ] 增加 E2E 測試覆蓋
- [ ] 優化 bundle size
- [ ] 更新 README.md

---

## ⚠️ Blocked (需人工介入) 🚨

> 3-Fix Rule 失敗後的項目

（目前無阻塞項目）

---

## 📅 最後更新

2026-01-15T15:30:00

---

## 📋 完成歷史

| 日期       | 任務          | Commit   |
| ---------- | ------------- | -------- |
| 2026-01-14 | P1-2 安全修復 | 87a1ff33 |
| 2026-01-15 | P6 競態條件   | def5678  |
| 2026-01-15 | P8 QA 虛擬化  | ghi9012  |
```

---

## 5. Rate Limit 恢復機制

### 5.1 Rate Limit 發生時的處理

當 Claude 即將達到用量上限時，執行以下保存協議：

```
┌─────────────────────────────────────────────────────────────────┐
│                  RATE LIMIT SAVE PROTOCOL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: 立即保存狀態                                           │
│  ├── 更新 @progress.md                                          │
│  │   • 記錄當前進度                                             │
│  │   • 寫入學習筆記                                             │
│  │   • 生成詳細恢復指令                                         │
│  └── 更新 @fix_plan.md                                          │
│      • 標記已完成項目                                           │
│      • 標記進行中項目                                           │
│                                                                 │
│  Step 2: 保存代碼狀態                                           │
│  ├── 如有完整功能 → git commit                                  │
│  └── 如有未完成變更 → git stash save "WIP: 描述"                │
│                                                                 │
│  Step 3: 輸出恢復指令                                           │
│  └── 在對話中輸出完整的恢復 prompt                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 解禁後的恢復流程

**恢復 Prompt 模板**：

```markdown
## 🔄 恢復作業

我剛從 rate limit 解禁，請執行恢復協議：

### 1. 讀取狀態
```

Read @progress.md
Read @fix_plan.md

````

### 2. 確認代碼狀態
```bash
git status
git stash list
git log --oneline -5
````

### 3. 恢復未完成變更（如有）

```bash
git stash pop  # 如果有 stash
```

### 4. 繼續作業

- 根據 @progress.md 的「下次恢復指令」
- 使用 TodoWrite 建立追蹤
- 完成後更新狀態檔案

### 5. 完成標準

- npm run gate 通過
- npm test 通過
- @progress.md 已更新
- @fix_plan.md 已更新

````

### 5.3 緊急保存指令

當預感即將達到 rate limit 時，使用此指令：

```markdown
## 🚨 緊急保存

請立即執行保存協議（不要做其他事）：

1. **更新 @progress.md**
   - 記錄當前步驟（Step X）
   - 列出已完成和待完成的 TodoWrite 項目
   - 寫入學習筆記
   - 生成詳細恢復指令

2. **更新 @fix_plan.md**
   - 標記已完成項目 [x]
   - 標記進行中項目（加 ← 當前任務）

3. **Git 操作**
   - 如有可提交的完整功能 → git commit
   - 如有未完成變更 → git stash save "WIP: 描述"

4. **輸出恢復指令**
   - 輸出完整的恢復 prompt
   - 包含所有必要的上下文
````

---

## 6. Skills 整合

### 6.1 循環階段 vs Skills 對應表

| 循環階段    | 使用的 Skills             | 自動/手動 | 觸發條件      |
| ----------- | ------------------------- | --------- | ------------- |
| **CONTEXT** | `/read-before-edit`       | 自動      | 任何讀取動作  |
| **PLAN**    | `/code-review-excellence` | 手動      | 計劃審核時    |
| **READ**    | `/read-before-edit`       | 強制      | Edit/Write 前 |
| **EXECUTE** | `/code-validator`         | 自動      | 代碼修改後    |
| **EXECUTE** | `/type-checker`           | 自動      | 類型錯誤時    |
| **REVIEW**  | `/rigorous_testing`       | 自動      | 驗證階段      |
| **REVIEW**  | `/security_audit`         | 按需      | 安全相關修改  |
| **FIX**     | `/type-checker`           | 自動      | 修復類型錯誤  |
| **FIX**     | `/code-validator`         | 自動      | 修復代碼問題  |
| **COMMIT**  | `/pre-commit-validator`   | 強制      | git commit 前 |

### 6.2 完整 Skills 清單

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAIHOUSES SKILLS (14個)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔧 核心品質 Skills (4)                                         │
│  ├── /code-validator        代碼品質驗證                        │
│  ├── /type-checker          TypeScript 類型檢查                 │
│  ├── /pre-commit-validator  Git 提交前驗證                      │
│  └── /read-before-edit      先讀後寫強制規範                    │
│                                                                 │
│  🔍 審核 Skills (3)                                             │
│  ├── /code-review-excellence 代碼審查最佳實踐                   │
│  ├── /rigorous_testing       嚴格測試協議                       │
│  └── /security_audit         安全審計檢查                       │
│                                                                 │
│  🎨 專業領域 Skills (4)                                         │
│  ├── /frontend_mastery       React/效能/狀態管理                │
│  ├── /backend_safeguard      Supabase/RLS/API 安全              │
│  ├── /ui-ux-pro-max          UI/UX 設計智能                     │
│  └── /ui_perfection          Premium 美學標準                   │
│                                                                 │
│  📋 輔助 Skills (3)                                             │
│  ├── /audit_logging          審計日誌協議                       │
│  ├── /skill-marketplace      技能市場整合                       │
│  └── /marketplace/hook-development Hook 開發                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Skills 使用範例

```markdown
# 自動觸發（推薦）

「請幫我審查這個檔案的代碼品質」
→ 自動使用 /code-validator

「修復這些類型錯誤」
→ 自動使用 /type-checker

「我想要提交代碼了」
→ 自動使用 /pre-commit-validator

# 手動指定

「使用 /security_audit 檢查這個 API」
「執行 /rigorous_testing」
「用 /frontend_mastery 優化這個組件」
```

---

## 7. 安全防護機制

### 7.1 Circuit Breaker Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                     CIRCUIT BREAKER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  狀態: CLOSED (正常運作) 🟢                                     │
│  ├── 正常執行任務                                               │
│  ├── 監控失敗指標                                               │
│  └── 觸發條件達成 → 進入 OPEN                                   │
│                                                                 │
│  狀態: OPEN (熔斷) 🔴                                           │
│  ├── 觸發條件：                                                 │
│  │   • 3 次循環無檔案變更                                       │
│  │   • 5 次連續相同錯誤                                         │
│  │   • 輸出品質下降 >70%                                        │
│  │   • 3-Fix Rule 失敗                                          │
│  ├── 動作：                                                     │
│  │   • 暫停自動循環                                             │
│  │   • 記錄問題到 @progress.md                                  │
│  │   • 標記任務為 Blocked                                       │
│  └── 等待人工介入或冷卻時間                                     │
│                                                                 │
│  狀態: HALF_OPEN (試探) 🟡                                      │
│  ├── 嘗試執行一個簡單任務                                       │
│  ├── 成功 → 回到 CLOSED                                         │
│  └── 失敗 → 回到 OPEN                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 雙條件退出檢測

任務只有在滿足以下兩個條件時才算完成：

```typescript
interface ExitCondition {
  // 條件 1: 客觀指標 (至少 2 個)
  completionIndicators: {
    testsPass: boolean; // npm test 通過
    typeCheckPass: boolean; // npm run typecheck 通過
    lintPass: boolean; // npm run lint 通過
    todoComplete: boolean; // TodoWrite 全部完成
  };

  // 條件 2: Claude 明確確認
  exitSignal: boolean; // 必須為 true
}

// 退出邏輯
const canExit = (c: ExitCondition): boolean => {
  const indicators = Object.values(c.completionIndicators).filter(Boolean).length;
  return indicators >= 2 && c.exitSignal === true;
};
```

### 7.3 防止無限循環

| 機制                | 說明                  | 觸發動作           |
| ------------------- | --------------------- | ------------------ |
| **3-Fix Rule**      | 同一問題最多修復 3 次 | 標記 Blocked，跳過 |
| **Circuit Breaker** | 連續失敗檢測          | 暫停循環           |
| **雙條件退出**      | 客觀指標 + 主觀確認   | 防止假完成         |
| **Rate Limit 檢測** | 用量上限預警          | 保存狀態，優雅退出 |

---

## 8. 最佳實踐

### 8.1 任務描述最佳實踐

**✅ 好的任務描述**：

```markdown
## 任務：實作 QA 卡片虛擬化

**背景**：

- QA 卡片超過 10 個時 DOM 膨脹
- 需要使用 @tanstack/react-virtual

**完成標準**：

- [ ] npm run gate 通過
- [ ] npm test 通過
- [ ] 10 個以下不虛擬化
- [ ] 11 個以上啟用虛擬化

**參考檔案**：

- .claude/tickets/AUDIT-01-\*.md (Phase 8)
- src/pages/Community/components/QASection.tsx
```

**❌ 不好的任務描述**：

```markdown
幫我做虛擬化
```

### 8.2 學習筆記最佳實踐

每次發現重要知識點，立即記錄到 @progress.md：

```markdown
## 📝 學習筆記

### [日期] [類別]

- **問題**：描述遇到的問題
- **解決方案**：如何解決
- **關鍵學習**：可重用的知識
- **相關檔案**：涉及的檔案
```

### 8.3 恢復指令最佳實踐

恢復指令應該包含：

1. **當前位置**：Step X, 哪個任務
2. **已完成工作**：明確列出
3. **待完成工作**：明確列出
4. **必要上下文**：關鍵發現、注意事項
5. **具體步驟**：下一步該做什麼

### 8.4 Git Commit 最佳實踐

```bash
# 格式
<type>(<scope>): <subject>

# 類型
feat:     新功能
fix:      修復 bug
refactor: 重構
style:    格式調整
docs:     文檔
test:     測試
chore:    雜項

# 範例
feat(AUDIT-01): Phase 8 QA 卡片虛擬化

- 新增 VirtualizedQAList 組件
- 修復 useVirtualizer 提前執行問題
- 新增 15 個虛擬化測試

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 9. 常用指令模板

### 9.1 開始新任務

```markdown
## 開始新任務

**任務**: [描述任務]

**參考文件**:

- [相關文件路徑]

**完成標準**:

- [ ] npm run gate 通過
- [ ] npm test 通過
- [ ] 無 any 類型
- [ ] 代碼已提交
- [ ] @progress.md 已更新
- [ ] @fix_plan.md 已更新

請執行 7-Step 循環：

1. CONTEXT - 讀取狀態檔案和參考文件
2. PLAN - 使用 TodoWrite 建立任務清單
3. READ - 讀取要修改的檔案
4. EXECUTE - 施作代碼
5. REVIEW - Two-Stage Review
6. FIX - 如有問題，最多 3 次修復
7. COMMIT - 提交並更新狀態
```

### 9.2 從 Rate Limit 恢復

```markdown
## 恢復作業

我剛從 rate limit 解禁，請執行恢復協議：

1. **讀取狀態**
   - Read @progress.md
   - Read @fix_plan.md
   - git status

2. **恢復上下文**
   - 根據「下次恢復指令」恢復
   - 如有 stash，執行 git stash pop

3. **繼續循環**
   - 從中斷的 Step 繼續
   - 使用 TodoWrite 追蹤
   - 完成後更新狀態
```

### 9.3 緊急保存

```markdown
## 緊急保存

請立即保存狀態（預感即將達到 rate limit）：

1. 更新 @progress.md
   - 當前步驟
   - TodoWrite 項目狀態
   - 學習筆記
   - 詳細恢復指令

2. 更新 @fix_plan.md
   - 標記完成/進行中

3. Git 操作
   - 可提交 → commit
   - 未完成 → stash

4. 輸出恢復 prompt
```

### 9.4 審核模式

```markdown
## 審核任務

請對以下變更執行 Two-Stage Review：

**變更範圍**: [描述]

**Stage 1: Spec Compliance**

- [ ] 需求滿足
- [ ] 邊界處理
- [ ] 約束遵守

**Stage 2: Code Quality**

- [ ] npm run typecheck
- [ ] npm run lint
- [ ] npm test

如有問題，使用 3-Fix Rule 修復。
```

### 9.5 問題升級

```markdown
## 問題升級

3-Fix Rule 失敗，請執行升級協議：

1. 在 @progress.md 記錄：
   - 問題描述
   - 嘗試過的 3 種修復方案
   - 可能的根因分析
   - 建議的人工介入方向

2. 在 @fix_plan.md 標記為 Blocked

3. 跳過此任務，繼續下一個
```

---

## 10. 故障排除

### 10.1 常見問題

| 問題               | 原因                 | 解決方案                    |
| ------------------ | -------------------- | --------------------------- |
| 恢復後不知道做到哪 | @progress.md 未更新  | 查看 git log，重建狀態      |
| 同一錯誤反覆出現   | 未解決根因           | 使用 3-Fix Rule 升級        |
| 測試一直失敗       | 環境問題或真實 bug   | 檢查 node_modules，重裝依賴 |
| 類型錯誤無法修復   | 類型定義不完整       | 使用 /type-checker skill    |
| 循環卡住不動       | Circuit Breaker 觸發 | 檢查 @progress.md，人工介入 |

### 10.2 檢查清單

**開始任務前**：

- [ ] @progress.md 存在且最新
- [ ] @fix_plan.md 存在且最新
- [ ] git status 乾淨

**任務完成後**：

- [ ] npm run gate 通過
- [ ] npm test 通過
- [ ] git commit 完成
- [ ] @progress.md 已更新
- [ ] @fix_plan.md 已更新

**Rate Limit 前**：

- [ ] 當前進度已記錄
- [ ] 恢復指令已生成
- [ ] 代碼已 commit 或 stash

### 10.3 重置狀態

如果狀態檔案混亂，可以重置：

```bash
# 備份現有狀態
cp @progress.md @progress.md.bak
cp @fix_plan.md @fix_plan.md.bak

# 從 Git 歷史重建狀態
git log --oneline -20  # 查看最近提交

# 重新初始化狀態檔案
# （參考 1.2 節的初始化內容）
```

---

## 11. Claude Code 2.1.9 優化整合

### 11.1 概述

Claude Code 2.1.9 版本帶來了多項重要功能，可以顯著優化 Ralph Loop 自動化流程。本章節說明如何利用這些新功能。

**關鍵功能**：

| 功能                   | 對 Ralph Loop 的影響                             |
| ---------------------- | ------------------------------------------------ |
| PreToolUse Hook        | 自動上下文注入，解決 Step 1 CONTEXT 手動恢復痛點 |
| `${CLAUDE_SESSION_ID}` | 精確 Session 追蹤，自動更新 @progress.md         |
| `plansDirectory`       | 統一管理計劃檔案，避免散落                       |
| Skills 巢狀目錄        | 更好的組織和分類                                 |
| 穩定性修復             | 長 Session 更可靠                                |

### 11.2 PreToolUse Hook 自動上下文注入

**解決的痛點**：Step 1 CONTEXT 需要手動讀取 @progress.md 和 @fix_plan.md

**實作方式**：

```json
// .claude/settings.local.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "type .claude\\context\\ralph-context.md 2>nul || echo."
      }
    ]
  }
}
```

**上下文檔案範例** (`.claude/context/ralph-context.md`)：

```markdown
## 🔄 Ralph Context Auto-Inject

### 當前狀態

- 參考 @progress.md 的「進行中」區塊
- 參考 @fix_plan.md 的 Priority 1 項目

### 必讀規則

1. 修改前必須先讀取目標檔案
2. 使用 TodoWrite 追蹤進度
3. 完成後更新狀態檔案
```

**效果**：每次 Edit/Write 前自動注入上下文，確保 Claude 記得當前任務狀態。

### 11.3 ${CLAUDE_SESSION_ID} 自動追蹤

**用途**：精確記錄每個 Session 的工作，便於追蹤和恢復。

**設置方式**：

```json
// .claude/settings.local.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "powershell -Command \"$content = Get-Content -Raw '@progress.md' -ErrorAction SilentlyContinue; if ($content) { $content = $content -replace 'Session ID: [^\\n]+', 'Session ID: %CLAUDE_SESSION_ID%'; Set-Content '@progress.md' $content }\""
      }
    ]
  }
}
```

**@progress.md 自動更新效果**：

```markdown
## 最後更新

- **時間**: 2026-01-16T10:30:00
- **Session ID**: a1b2c3d4-e5f6-7890 ← 自動更新
- **當前任務**: AUDIT-01 Phase 5
```

### 11.4 plansDirectory 統一管理

**用途**：將所有計劃檔案集中管理，避免散落在專案各處。

**設置方式**：

```json
// .claude/settings.local.json
{
  "plansDirectory": ".claude/plans"
}
```

**建議目錄結構**：

```
.claude/
├── plans/                 # 計劃檔案統一存放
│   ├── active/            # 進行中的計劃
│   └── archive/           # 已完成的計劃
├── context/               # 上下文注入檔案
├── skills/                # Skills 定義
└── tickets/               # 工單追蹤
```

### 11.5 Ralph 專用 Skills

**建議新增兩個 Ralph 專用 Skill**：

#### /ralph-save：一鍵緊急保存

```yaml
# .claude/skills/ralph-save/SKILL.md
---
name: ralph-save
description: Ralph 緊急保存協議，一鍵保存所有狀態
trigger: 用戶說「緊急保存」或預感即將達到 rate limit
---

## 執行步驟

1. **更新 @progress.md**
   - 記錄當前 Step 和 TodoWrite 項目
   - 寫入學習筆記
   - 生成詳細恢復指令

2. **更新 @fix_plan.md**
   - 標記已完成項目 [x]
   - 標記進行中項目

3. **Git 操作**
   - 可提交 → `git commit -m "WIP: 當前任務描述"`
   - 未完成 → `git stash save "WIP: 當前任務描述"`

4. **輸出恢復指令**
```

#### /ralph-resume：一鍵恢復作業

```yaml
# .claude/skills/ralph-resume/SKILL.md
---
name: ralph-resume
description: Ralph 恢復協議，一鍵恢復上次作業狀態
trigger: 用戶說「恢復作業」或開始新 Session
---
## 執行步驟

1. **讀取狀態**
- Read @progress.md
- Read @fix_plan.md
- 執行 git status

2. **恢復代碼**
- 如有 stash → `git stash pop`

3. **重建上下文**
- 根據「下次恢復指令」恢復
- 使用 TodoWrite 建立追蹤清單

4. **繼續循環**
- 從中斷的 Step 繼續
```

### 11.6 Skills 目錄重組

2.1.9 支援 Skills 巢狀目錄，建議重組為：

```
.claude/skills/
├── ralph/                    # Ralph 專用
│   ├── ralph-save/
│   └── ralph-resume/
├── quality/                  # 品質相關
│   ├── code-validator/
│   ├── type-checker/
│   ├── pre-commit-validator/
│   └── read-before-edit/
├── review/                   # 審核相關
│   ├── code-review-excellence/
│   ├── rigorous_testing/
│   └── security_audit/
├── domain/                   # 專業領域
│   ├── frontend_mastery/
│   ├── backend_safeguard/
│   ├── ui-ux-pro-max/
│   └── ui_perfection/
└── utility/                  # 輔助工具
    ├── audit_logging/
    └── skill-marketplace/
```

### 11.7 穩定性改進（被動受益）

2.1.9 版本修復了以下問題，Ralph Loop 會自動受益：

| 修復項目                    | 對 Ralph 的影響                            |
| --------------------------- | ------------------------------------------ |
| **長 Session 平行工具呼叫** | 長時間作業更穩定，不會因為多工具呼叫而失敗 |
| **MCP 伺服器重連**          | 工具服務更可靠，減少意外中斷               |
| **計劃模式退出修復**        | EnterPlanMode/ExitPlanMode 更可靠          |

### 11.8 升級檢查清單

**升級到 2.1.9 後執行**：

- [ ] 確認版本：`claude --version` 顯示 2.1.9+
- [ ] 創建 `.claude/context/` 目錄
- [ ] 創建 `.claude/plans/` 目錄
- [ ] 更新 `.claude/settings.local.json` 加入 hooks 設定
- [ ] 創建 `/ralph-save` skill
- [ ] 創建 `/ralph-resume` skill
- [ ] 測試 PreToolUse hook 是否正常注入
- [ ] 測試 Session ID 是否自動更新

**驗證指令**：

```bash
# 測試 hook 是否生效
claude "請編輯一個測試檔案"
# 應該看到上下文自動注入

# 測試 skill 是否可用
claude "/ralph-save"
claude "/ralph-resume"
```

---

## 📚 參考資源

- [frankbria/ralph-claude-code](https://github.com/frankbria/ralph-claude-code) - 雙條件退出檢測
- [alfredolopez80/multi-agent-ralph-loop](https://github.com/alfredolopez80/multi-agent-ralph-loop) - 8-Step 編排, Two-Stage Review
- [thecgaigroup/ralph-cc-loop](https://github.com/thecgaigroup/ralph-cc-loop) - PRD 驅動, Git 持久化
- [Ralph Wiggum - Awesome Claude](https://awesomeclaude.ai/ralph-wiggum) - 核心技術說明
- [MaiHouses CLAUDE.md](../../../CLAUDE.md) - 專案規範

---

## 📝 版本歷史

| 版本  | 日期       | 變更                                     |
| ----- | ---------- | ---------------------------------------- |
| 1.1.0 | 2026-01-16 | 新增第 11 章：Claude Code 2.1.9 優化整合 |
| 1.0.0 | 2026-01-15 | 初始版本                                 |

---

**🎯 記住核心原則：迭代優於完美，持久化為王，失敗是數據。**
