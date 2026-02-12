# AGENTS.md — MaiHouses AI Agent 共用指令

> 本檔供 Codex CLI 及其他 AI 編碼工具自動載入。Claude CLI 讀取 `CLAUDE.md`。

## 指令來源

1. **[CLAUDE.md](./CLAUDE.md)** — 快速指令、技術棧、專案結構、核心規則、Skills、Git 規範
2. **[.context/CONVENTIONS.md](./.context/CONVENTIONS.md)** — SOLID 展開、命名規範、元件/Hook/Service/API/CSS/Supabase 詳細慣例
3. **[.context/ARCHITECTURE.md](./.context/ARCHITECTURE.md)** — 模組架構、五大核心、術語表
4. **[.context/LESSONS.md](./.context/LESSONS.md)** — TypeScript/測試陷阱、架構決策
5. **[.context/STATUS.md](./.context/STATUS.md)** — 當前狀態、優先任務、禁區

## 行為規範

### 語言

所有回應、註解、錯誤訊息使用**繁體中文（台灣用語）**。程式碼和技術術語維持英文。

### 工作模式

1. **先讀後寫**：修改前必須讀取目標檔案 + import 的模組 + 相關型別
2. **先想後做**：收到任務後，先在對話中列出想法和方案，待使用者確認後再動手
3. **做完待命**：完成後回報結果，等待下一步指示，不自行發起後續動作

### 禁止事項

- `: any` → 定義具體 interface/type
- `console.log` → 使用 `src/lib/logger.ts`
- `// @ts-ignore`, `// eslint-disable` → 修復根本問題
- 硬編碼密鑰 → 環境變數
- 未讀取就修改 → 先讀再改
- 自行建議換框架（Next.js / Firebase 等）

### 完成檢查

1. `npm run gate` 通過
2. 無 `any` 類型
3. 相關測試通過
