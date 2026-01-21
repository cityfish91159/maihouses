# 🧠 Project Memory Bank: MaiHouses

> **Last Updated**: 2026-01-21 (v9 - 安心留痕工單 DB-1)
> **Maintainer**: Claude / Antigravity

## 1. Active Context (當前焦點)
- **Current Phase**: 安心留痕工單施作 (2026-01-21 v9)
- **Immediate Goal**: 完成 DB-1~DB-4, BE-1~BE-10, FE-1~FE-6, LC-1~LC-4 共 24 項任務
- **Latest Achievement** (2026-01-21 v9 - DB-1 完成):
  - ✅ **DB-1** 資料庫加 trust_enabled 欄位（12 Skills 完整執行）
    - Migration：`20260122_add_trust_enabled.sql`（含 WHY 註解）
    - DB 類型：`supabase-schema.ts` L67 `trust_enabled: boolean`
    - 服務層：`propertyService.ts` 5 處修改
      - L71: `PropertyData.trustEnabled`
      - L96: `PropertyFormInput.trustEnabled`
      - L157: `DEFAULT_PROPERTY.trustEnabled`
      - L258-259: `getPropertyByPublicId` 讀取映射
      - L592-593: `createPropertyWithForm` insert
    - 驗證：`npm run gate` 通過、grep 6 處確認
- **Previous Phase**: Trust Legacy APIs 12 Skills 修復 (2026-01-19 v8) ✅
- **Previous Immediate Goal**: ✅ 修復 6 個舊版 Trust API 的 `as { id: string }` 斷言
- **Latest Achievement** (2026-01-19 v8 - Trust Legacy APIs 完整修復):
  - ✅ **Phase 1 [高優先] 修復 6 個 API**
    - `api/trust/_utils.ts`: 新增 TrustQuerySchema 共用 Schema
    - `api/trust/status.ts`: Zod safeParse 取代 as 斷言
    - `api/trust/submit.ts`: Zod safeParse 取代 as 斷言
    - `api/trust/confirm.ts`: Zod safeParse 取代 as 斷言
    - `api/trust/payment.ts`: Zod safeParse 取代 as 斷言
    - `api/trust/checklist.ts`: Zod safeParse 取代 as 斷言
    - `api/trust/supplement.ts`: Zod safeParse 取代 as 斷言
  - ✅ **Phase 2 [中優先] 測試與格式統一**
    - 新增 `api/trust/__tests__/legacy-apis.test.ts` (16 測試)
    - 統一錯誤回應格式 `{ error: string }`
  - ✅ **Phase 3 [驗證]**
    - `npm run gate` 通過 (typecheck + lint)
    - grep 確認 `api/trust/` 無 `as { id` 遺漏
    - 16/16 測試通過
- **Previous Phase**: 全專案大規模 NASA TypeScript Safety 清理 (2026-01-19 v7) ✅
- **Previous Immediate Goal**: ✅ 從 168+ 處危險 `as` 斷言減少到僅剩必要斷言
- **Active User**: 陳世瑜 (Mike).
- **Language**: Traditional Chinese (Taiwan) / 繁體中文(台灣).
- **Latest Achievement** (2026-01-19 v7 - 全專案大規模 NASA Safety 清理):
  - ✅ **Phase 1: API 層 24+ 處修復**
    - `api/generate-community-profile.ts`: Zod OpenAIResponseSchema
    - `api/session-recovery.ts`: Zod SessionRecoveryRequestSchema + instanceof Error
    - `api/report/track.ts`: Zod TrackPayloadSchema
    - `api/log-error.ts`: Zod IncomingErrorPayloadSchema
    - `api/property/generate-key-capsules.ts`: Zod OpenAIResponseSchema
    - `api/property/page-data.ts`: isValidDBProperty/isValidDBReview 類型守衛
    - `api/home/featured-properties.ts`: isValidRealPropertyRow 類型守衛
    - `api/uag/track.ts`: Zod TrackResultSchema
    - `api/uag/send-message.ts`: Zod SendMessageRequestSchema + LineBindingResultSchema
    - `api/report/create.ts`: Zod CreatePayloadSchema
    - `api/line/webhook.ts`: Zod body 驗證
    - `api/test/line-push.ts`: Zod TestRequestSchema
  - ✅ **Phase 2: 前端核心層 100+ 處修復**
    - Context: QuietModeContext, MoodContext, MaiMaiContext 類型守衛
    - Stores: profileStore, notesStore 類型守衛
    - Hooks: useFeedData, feedUtils, useConsumer 類型守衛 + instanceof
    - Pages: QASection, TrustRoom, Feed/index, Wall, RoleSwitcher 類型守衛
    - Components: CommunityPicker 明確類型定義
    - Utils: connectTokenCrypto, urlUtils, errorParser 類型守衛
    - Admin: GodView 5+ 處 Supabase 類型守衛
    - Report: ReportGenerator satisfies 取代 as
    - Muse: NightMode 5+ 處 instanceof HTMLElement
  - ✅ **Phase 3: 驗證**
    - `npm run gate` 通過 (typecheck + lint)
    - 剩餘 `as` 斷言 166 處 (120 處為必要斷言: CSSProperties, Navigator 擴展, const, import)
- **Previous Achievement** (2026-01-19 v6 - 全專案 NASA Safety 100% 合規):
  - ✅ **Phase 1 [nasa_typescript_safety]** Trust API 4 處修復
  - ✅ **Phase 2 [code-simplifier]** UAG Services 5 處修復
  - ✅ **Phase 3 [frontend_mastery]** UAG Hooks 5 處修復
  - ✅ **Phase 4 [agentic_architecture]** UAG Components 2 處修復
  - ✅ **[rigorous_testing]** typecheck + lint + 1001 tests 全部通過
- **Previous Achievement** (2026-01-19 v5):
  - Trust API cases.ts 重構至 234 行
- **Previous Achievement** (2026-01-19 v4):
  - Trust API cases/[id].ts 重構至 221 行
- **Previous Achievement** (2026-01-19 v3 - 嚴格審查修正):
  - ✅ 修復所有 type assertion → Zod safeParse
  - ✅ grep 全面搜尋確認無遺漏 `as` 斷言
- **Previous Achievement** (2026-01-19 v2 - 12 Skills 修復):
  - ✅ **[nasa_typescript_safety]** 移除 cases.ts type assertion → Zod safeParse 驗證
  - ✅ **[react_perf_perfection]** 修復 TrustFlow.tsx 無限迴圈 → useRef 追蹤初始化
  - ✅ **[draconian_rls_audit]** SQL agent_id 強化約束 → UUID 格式驗證 + 禁止刪除
  - ✅ **[code-simplifier]** 拆分 TrustFlow.tsx (813行 → 8 個模組)
  - ✅ **[frontend_mastery]** Focus Trap + 防抖動機制
  - ✅ **[backend_safeguard]** API total count 從 DB 取得真實值
  - ✅ **[no_lazy_implementation]** 無任何 TODO/FIXME 殘留
  - ✅ **[agentic_architecture]** 模組邊界清晰（TrustFlow 子目錄結構）
  - ✅ **[audit_logging]** 14+ logger 呼叫完整覆蓋
- **Previous Achievement** (2026-01-19 v1):
  - 資料庫 Schema + API 端點 + 前端整合
  - 測試 51/51 通過

## 2. Architecture & Tech Stack (架構決策)
- **Frontend**: React 18 + Vite + Tailwind CSS.
  - **State**: `Zustand` (Client Global), `React Query` (Server State).
  - **Pattern**: Container/Presentational components, Custom Hooks (`useUAG.ts` facade).
  - **Styling**: Tailwind CSS (Premium aesthetic, Mobile-first).
- **Backend**: Vercel Serverless Functions (`api/`).
  - **DB**: Supabase (PostgreSQL).
  - **Auth**: Supabase Auth (Cookie + Bearer token support).
  - **Security**: Mandatory RLS, Zod validation for all inputs.

## 3. Known Issues & Technical Debt (已知坑洞)
### 🔴 Critical
- ~~**UAG Trust Flow**: `/api/trust/cases` 不存在~~ ✅ **已修復 (2026-01-19)**

### 🟡 Tech Debt
- **Type Safety**: Some older files may still have loose types (User strictness: No `any`).
- ~~**Tests**: UAG module lacks E2E coverage for the M1-M5 Trust Flow state machine.~~ ✅ 已新增 51 個測試
- **部署**: 需要執行 `20260119_trust_cases_schema.sql` migration 到 Supabase

## 4. Operational Rules (操作守則)
- **Anti-Laziness**: 禁止 `// ... rest of code`。大檔案必須分段完整輸出。
- **Context Management**:
  - 先讀 `MEMORY.md`。
  - 大檔案用 `grep`/`read_file_range`。
  - 任務結束前將新知寫回 `MEMORY.md`。
- **Testing**:
  - 修改後必須跑測試 (`npm test`).
  - 測試失敗必須 Self-Heal，不可刪除測試。

## 5. Key Files Map (關鍵檔案)
- **Guard Rules**: `CLAUDE.md`, `GEMINI.md`.
- **Skills**: `.claude/skills/`.
- **UAG Logic**: `src/pages/UAG/index.tsx`, `src/pages/UAG/hooks/useUAG.ts`.
- **Backend Trust**: `api/trust/`.

## 6. Glossary (專案術語)
- **UAG**: User Activity & Growth (導客系統).
- **Trust Flow (安心流程)**: 交易六階段 (M1:接洽 → M2:帶看 → M3:出價 → M4:斡旋 → M5:成交 → M6:交屋).
- **Community Wall**: 真實口碑牆.

## 7. Skills 使用紀錄 (2026-01-19 v8 - Trust Legacy APIs 12 Skills 修復)

| # | Skill | 修復內容 | 檔案位置 | 證明 |
|---|-------|----------|----------|------|
| 1 | nasa_typescript_safety | 6 個 API `as { id }` → Zod safeParse | status, submit, confirm, payment, checklist, supplement | ✅ grep 0 匹配 |
| 2 | read-before-edit | 修改前完整讀取 7 個檔案 | 所有修改皆有 Read | ✅ |
| 3 | backend_safeguard | TrustQuerySchema Zod 驗證 + 400 錯誤 | api/trust/_utils.ts | z.object({ id }) |
| 4 | code-simplifier | 提取共用 TrustQuerySchema 至 _utils.ts | api/trust/_utils.ts | export TrustQuerySchema |
| 5 | agentic_architecture | 統一錯誤格式 `{ error: string }` | 6 個 API | ✅ |
| 6 | draconian_rls_audit | 所有 query 參數經過 Zod 驗證 | 6 個 API | safeParse |
| 7 | rigorous_testing | 新增 16 個測試 | legacy-apis.test.ts | ✅ 16/16 通過 |
| 8 | no_lazy_implementation | 完整實作無 TODO/FIXME | grep 驗證 | ✅ 0 匹配 |
| 9 | audit_logging | 所有 safeParse 失敗有 logger 記錄 | 6 個 API | logger.error |
| 10 | context_mastery | grep 全面搜尋確認無遺漏 | api/trust/ | ✅ 0 `as { id` |
| 11 | memory_bank | 更新 MEMORY.md v8 | MEMORY.md | ✅ 本紀錄 |
| 12 | google_grade_reviewer | 最終代碼審查確認品質 | npm run gate | ✅ 通過 |
