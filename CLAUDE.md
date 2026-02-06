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

### TypeScript 嚴格模式
- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- 所有 API 輸入用 Zod `safeParse` 驗證，禁止 `as` 斷言

### 錯誤處理
每個 async 函數必須有錯誤處理。API 回應必須檢查 `res.ok`。

### 先讀後寫
修改前必須讀取：目標檔案 + import 的模組 + 相關型別 + 相關 API/hooks。

### UI/UX
所有 UI/UX 設計必須來自 `/ui-ux-pro-max`，嚴格禁止自己亂做。

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
| 當前狀態、優先任務、禁區 | [`.context/STATUS.md`](.context/STATUS.md) |
| 模組架構、五大核心、術語 | [`.context/ARCHITECTURE.md`](.context/ARCHITECTURE.md) |
| TS/測試陷阱、架構決策 | [`.context/LESSONS.md`](.context/LESSONS.md) |
| 環境變數 | `.env.example` |
| 歷史報告 | `.context/archive/` |
