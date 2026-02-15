# CLAUDE.md — MaiHouses 開發指南

> 唯一入口。讀完這份就能開始工作。深入資訊見底部「延伸閱讀」。

## 快速指令

```bash
npm run dev              # 開發伺服器 (localhost:5173/maihouses/)
npm run gate             # 品質關卡（typecheck + lint）
npm test                 # Vitest 單元測試
npx vitest run <path>    # 單一測試
npm run build            # 構建
npm run deploy           # 部署 GitHub Pages
npm run gen-context      # 更新 .context/STATUS.md 統計
```

## 技術棧

React 18 · TypeScript (strict) · Vite 7 · Tailwind CSS 3 · Zustand · React Query
Vercel Serverless (`api/`) · Supabase (PostgreSQL + RLS) · Zod · Vitest · Playwright

## 專案結構

```
maihouses/
├── api/                    # Vercel Serverless（community/ trust/ property/ uag/ lib/）
├── src/
│   ├── components/         # UI 組件（Feed/ MaiMai/ Assure/ TrustRoom/ PropertyDetail/）
│   ├── pages/              # 頁面（Chat/ Community/ Feed/ UAG/ Property/）
│   ├── hooks/              # 自訂 Hooks
│   ├── services/           # API 服務層
│   ├── types/              # TypeScript 型別（Zod Schema）
│   ├── lib/                # 工具函數
│   ├── stores/             # Zustand stores
│   └── constants/          # 常數
├── supabase/migrations/    # DB Migration SQL
├── .context/               # 脈絡管理（STATUS / ARCHITECTURE / LESSONS）
└── tests/e2e/              # Playwright E2E
```

## 當前狀態

→ 詳見 [`.context/STATUS.md`](.context/STATUS.md)

## 核心規則

### 語言
所有回應、註解、錯誤訊息使用**繁體中文（台灣用語）**。代碼和技術術語維持英文。

### 禁止清單
- `: any` → 定義具體 interface/type
- `console.log` → 使用 `src/lib/logger.ts`
- `// @ts-ignore`, `// eslint-disable` → 修復根本問題
- 硬編碼密鑰 → 環境變數
- 未讀取就修改 → 先 Read 再 Edit
- inline style（`style={}` / `style=""`）→ 一律使用專案 CSS Module 或 Tailwind class
- 擅自刪除既有功能 → **沒被要求刪就不准刪**，不論你覺得「多餘」還是「過時」
- 看到檔案裡有既有 TS 錯誤卻視而不見 → 修改該檔時**必須一併修復**既有 TS 錯誤
- 跳過已存在的 pattern 自己發明新寫法 → **先看同類元件怎麼做，照著做**

### TypeScript 嚴格模式
- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- 所有 API 輸入用 Zod `safeParse` 驗證，禁止 `as` 斷言

### 錯誤處理
每個 async 函數必須有錯誤處理。API 回應必須檢查 `res.ok`。

### 先讀後寫（Read Before Acting）
修改前必須讀取：目標檔案 + import 的模組 + 相關型別 + 相關 API/hooks。
- 若任務涉及 spec、設計文件、skill、ticket → **全部讀完才能開口提方案**，沒有例外
- **禁止淺讀**。不准只看 import 就開始建議。你必須展示你理解了整個檔案的邏輯，才有資格提改動
- 不准重複讀取同一 session 內已載入的檔案——浪費 token
- 不准「探索性亂讀」一堆不相關的檔案——先想清楚哪些檔案真正相關，精準讀取

### 先想後做（Confirm Before Acting）
收到任務後，**先在對話中列出想法和方案**，待使用者確認後再動手寫程式碼。不要收到指令就直接開始改檔案。
- 多步驟任務：每步完成後回報，**停下來等確認，不准自行跳到下一步**
- **絕不偽造完成**：沒跑測試不准說「測試通過」、沒讀程式碼不准給分數、沒驗證不准說「已確認」
- 使用者說「先不要寫 code」「只討論」→ 代表**不准碰任何檔案**，只在對話中輸出
- 使用者未確認方案就不准動手實作——沉默不代表同意

### 做完待命
完成後回報結果，等待下一步指示。不自行發起後續動作、不主動擴大範圍。

### 回應格式（Response Format）
- 使用者要求編輯檔案 → **直接用 Edit 工具改**。不准繞道用 sub-agent、不准寫到 plan 檔、不准用 Write 重寫整個檔案
- 使用者問問題 → **直接在對話中回答**。不准開始探索程式碼、不准建立文件
- 使用者中途轉換任務 → **立刻停止當前工作，馬上切換**。不准「讓我先完成這個」
- **不准超出要求範圍**：沒被要求的 refactor 不做、沒被要求的 docstring 不加、沒被要求的 type annotation 不補

### UI/UX
所有 UI/UX 設計必須來自 `/ui-ux-pro-max`，嚴格禁止自己亂做。

## Strict Audit 流程

當使用者說「strict audit」或啟動分階段審核，**必須嚴格按以下順序執行，不准跳步、不准合併 Phase**：

### Phase 1 — 盤點（Inventory）
- 列出本次審核範圍內**所有**相關檔案，含路徑和行數
- 輸出檔案清單後 → **停下，等使用者說「繼續」才進 Phase 2**
- 不准在這個階段偷跑去讀程式碼或提前分析

### Phase 2 — 深讀（Deep Read）
- **逐一 Read 每個檔案**，不准跳過、不准只看 import
- Phase 1 列了幾個檔案，Phase 2 就必須讀幾個。**承諾 19 個就讀 19 個，不准讀到第 9 個就停**
- 記錄所有發現的問題，每個問題必須標註 `檔案路徑:行號`
- **禁止捏造問題**——沒看到就不准寫。禁止「可能有」「建議檢查」這種含糊措辭
- 輸出完整問題清單後 → **停下等確認**

### Phase 3 — 評分（Scoring）
- 每個分類的分數必須引用 Phase 2 發現的具體證據（`file:line`）
- **禁止灌水**：沒發現問題的分類就給高分並說明「未發現問題」，不准為了「平衡」而捏造扣分理由
- **禁止放水**：發現了問題就必須扣分，不准因為「整體不錯」就忽略
- **禁止全給滿分**：如果每個分類都是 10/10，你幾乎一定在偷懶——回去重讀
- 輸出評分後 → **停下等確認**

### Phase 4 — 修復（Fix）
- 只修 P1（必修）和 P2（應修）問題，不准趁機 refactor 無關程式碼
- 每個修復完成後跑 `tsc --noEmit` + 相關測試
- **測試沒過不准報完成**

### 鐵律（違反任一條即審核無效）
1. 未用 Read 工具讀過的檔案 → 不准評分
2. 未用 Bash 跑過的測試 → 不准說「測試通過」
3. 每個 Phase 結束 → 必須停下等使用者確認，不准自行推進
4. 找到的每個問題 → 必須附 `file:line`，無證據的問題不准列入報告
5. 不准給沒有根據的滿分、不准給沒有根據的零分

## Skills 觸發對照表

| 做什麼 | 用什麼 Skill |
|--------|-------------|
| 改 `.tsx` 檔案 | `/read-before-edit` |
| 改 `api/` 目錄 | `/backend_safeguard` |
| 改 SQL/RLS | `/draconian_rls_audit` |
| UI/UX 設計 | `/ui-ux-pro-max` |
| 新增功能後 | `/rigorous_testing` |
| 準備 commit | `/pre-commit-validator` |
| 改超過 3 檔 | `/code-review` |

輔助 Skills（按需）：`security_audit` · `frontend_mastery` · `code-simplifier` · `strict-audit` · `type-checker`

## Git 規範

```
feat: / fix: / refactor: / style: / docs: / chore: / test:
```

## 完成檢查

每次任務完成前確認：
1. `npm run gate` 通過
2. 無 `any` 類型
3. 已執行相關 Skills
4. 相關測試通過

## 延伸閱讀

| 需要了解 | 去讀 |
|---------|------|
| SOLID、命名、元件/API/CSS 慣例 | [`.context/CONVENTIONS.md`](.context/CONVENTIONS.md) |
| 當前狀態、優先任務、禁區 | [`.context/STATUS.md`](.context/STATUS.md) |
| 模組架構、五大核心、術語 | [`.context/ARCHITECTURE.md`](.context/ARCHITECTURE.md) |
| TS/測試陷阱、架構決策 | [`.context/LESSONS.md`](.context/LESSONS.md) |
| 環境變數 | `.env.example` |
| 歷史報告 | `.context/archive/` |
