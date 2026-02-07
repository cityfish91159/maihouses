# Zero-Slack 剩餘 145 Warnings 工單

> **建立日期**: 2026-02-07
> **基準**: `node scripts/zero-slack-check.cjs --full --verbose`
> **目標**: 0 errors, 0 warnings
> **目前狀態**: 0 errors, 145 warnings

---

## 總覽

| 分類 | 數量 | 風險等級 | 修改方式 |
|------|------|---------|---------|
| [func-too-long](#batch-1-func-too-long--28) | 28 | 高 — 需拆分函數，影響既有邏輯 | 重構 |
| [file-too-large](#batch-2-file-too-large--7) | 7 | 高 — 需拆分檔案，影響 import 鏈 | 重構 |
| [missing-test](#batch-3-missing-test--110) | 110 | 低 — 只新增測試檔，不改原始碼 | 新增檔案 |

---

## Batch 1: func-too-long × 28

> **規則**: 單一函數不得超過 200 行
> **原則**: 提取子組件 / helper 函數，不改變外部 API

### 1A. 前端頁面組件（14 個）— 風險：高

| # | 檔案 | 函數 | 行數 | 拆分建議 |
|---|------|------|------|---------|
| 1 | `src/App.tsx:49` | `App` | 249 | 提取 `AppRoutes` 組件，將路由 `<Route>` 定義移出 |
| 2 | `src/components/Header/Header.tsx:9` | `Header` | 280 | 拆 `NavLinks`、`MobileMenu`、`UserMenu` 子組件 |
| 3 | `src/features/home/sections/SmartAsk.tsx:23` | `SmartAsk` | 307 | 拆 `ChatPanel` + `SuggestionPanel` 子組件 |
| 4 | `src/pages/Assure/Detail.tsx:21` | `AssureDetail` | 325 | 拆 `StepRenderer` + `DetailActionBar` 子組件 |
| 5 | `src/pages/Community/Wall.tsx:68` | `WallInner` | 428 | 拆 `WallTabContent` + `WallHeader` + `WallFooter` |
| 6 | `src/pages/PropertyDetailPage.tsx:71` | `PropertyDetailPage` | **693** | **最嚴重** — 拆 `DetailGallery` + `DetailInfoSection` + `DetailCTASection` + `DetailReviewSection` |
| 7 | `src/pages/PropertyEditPage.tsx:25` | `PropertyEditPage` | 202 | 僅超 2 行 — 提取 `formConfig` 常數或 `EditFormFields` 子組件 |
| 8 | `src/pages/PropertyUploadPage.tsx:29` | `PropertyUploadContent` | **608** | 拆 `UploadSteps` + `UploadPreviewPanel` + `UploadFormSections` |
| 9 | `src/pages/TrustRoom.tsx:60` | `TrustRoom` | 404 | 拆 `TrustStepView` + `TrustProgressHeader` |
| 10 | `src/pages/UAG/index.tsx:33` | `UAGPageContent` | 297 | 拆 `UAGDashboardLayout` + `UAGTabPanel` |
| 11 | `src/pages/UAG/UAGDeAIDemo.tsx:204` | `UAGDeAIDemo` | 279 | 拆 `DemoPanel` + `DemoMetrics` 子組件 |
| 12 | `src/pages/UAG/UAGDeAIDemoV2.tsx:327` | `UAGDeAIDemoV2` | **572** | 拆 `V2DemoLayout` + `V2MetricsPanel` + `V2ActionPanel` |
| 13 | `src/pages/Chat/useChat.ts:77` | `useChat` | 381 | 拆 `useChatMessageHandlers` + `useChatStreamProcessor` |
| 14 | `src/pages/Feed/useConsumer.ts:28` | `useConsumer` | 237 | 拆 `consumerFilterUtils.ts` 工具函數 |

### 1B. Hooks / Services（7 個）— 風險：中

| # | 檔案 | 函數 | 行數 | 拆分建議 |
|---|------|------|------|---------|
| 15 | `src/hooks/useNotifications.ts:199` | `useNotifications` | 224 | 提取 `notificationHelpers.ts`（格式化 + 分組邏輯） |
| 16 | `src/hooks/usePropertyDraft.ts:81` | `usePropertyDraft` | 239 | 提取表單驗證邏輯為 `draftValidation.ts` |
| 17 | `src/hooks/usePropertyTracker.ts:58` | `usePropertyTracker` | 263 | 提取追蹤事件建構為 `trackerHelpers.ts` |
| 18 | `src/hooks/usePushNotifications.ts:94` | `usePushNotifications` | **373** | 提取 `pushHelpers.ts`（訂閱管理、權限檢查、token 處理） |
| 19 | `src/hooks/useTrustRoom.ts:10` | `useTrustRoom` | 208 | 提取 step 計算邏輯為 `trustRoomHelpers.ts` |
| 20 | `src/services/ai.ts:107` | `composeSystemPrompt` | 303 | 將 prompt 段落拆為 `PROMPT_SECTIONS` 常數物件 |
| 21 | `src/services/propertyService.ts:361` | `propertyService` | 432 | 拆 CRUD 為獨立函數 `createProperty` / `updateProperty` / `queryProperties` |

### 1C. API 後端（7 個）— 風險：中

| # | 檔案 | 函數 | 行數 | 拆分建議 |
|---|------|------|------|---------|
| 22 | `api/community/comment.ts:57` | `handler` | 211 | 拆 `handleGetComments` + `handlePostComment` |
| 23 | `api/trust/close.ts:74` | `handler` | 209 | 提取驗證邏輯為 `validateCloseRequest()` |
| 24 | `api/trust/complete-buyer-info.ts:99` | `handler` | 273 | 拆 `validateBuyerInfo` + `updateBuyerRecord` + `sendBuyerNotification` |
| 25 | `api/trust/services/case-query.ts:181` | `queryCasesByIdentity` | 279 | 拆 query builder 為 `buildCaseQuery()` + `buildFilterConditions()` |
| 26 | `api/trust/upgrade-case.ts:73` | `handler` | 215 | 提取升級邏輯為 `performUpgrade()` |
| 27 | `api/trust/wake.ts:93` | `handler` | 226 | 提取通知發送邏輯為 `sendWakeNotifications()` |
| 28 | `api/uag/send-message.ts:229` | `handler` | 317 | 拆 `formatMessage()` + `dispatchMessage()` + `logMessageEvent()` |

---

## Batch 2: file-too-large × 7

> **規則**: 單一檔案不得超過 800 行
> **原則**: 拆分為多個模組檔案，原檔案 re-export 以維持向後相容

| # | 檔案 | 行數 | 拆分建議 | 預計新增檔案 |
|---|------|------|---------|------------|
| 1 | `src/components/MaiMai/MaiMaiBase.tsx` | 811 | 拆動畫邏輯為 `MaiMaiAnimations.ts` | `MaiMaiAnimations.ts` |
| 2 | `src/hooks/useFeedData.ts` | 809 | 拆轉換器為 `feedDataConverters.ts`、查詢邏輯為 `feedDataQueries.ts` | `feedDataConverters.ts`, `feedDataQueries.ts` |
| 3 | `src/pages/Community/components/QASection.tsx` | 910 | 拆 `QuestionCard.tsx` + `AnswerList.tsx` 子組件 | `QuestionCard.tsx`, `AnswerList.tsx` |
| 4 | `src/pages/UAG/UAGDeAIDemoV2.tsx` | 899 | 拆 `V2DemoSections.tsx` + `V2DemoCharts.tsx` | `V2DemoSections.tsx`, `V2DemoCharts.tsx` |
| 5 | `src/services/propertyService.ts` | 833 | 拆 `propertyQueries.ts` + `propertyMutations.ts` | `propertyQueries.ts`, `propertyMutations.ts` |
| 6 | `api/community/wall.ts` | 992 | 拆 `wallQueries.ts` + `wallHandlers.ts` | `wallQueries.ts`, `wallHandlers.ts` |
| 7 | `api/trust/send-notification.ts` | **1167** | **最嚴重** — 拆 `notificationBuilders.ts` + `notificationChannels.ts` | `notificationBuilders.ts`, `notificationChannels.ts` |

---

## Batch 3: missing-test × 110

> **規則**: `src/hooks/`、`src/services/`、`src/lib/`、`api/` 下的 `.ts` 檔案必須有對應的 `__tests__/` 測試檔
> **原則**: 只新增測試檔案，不改動原始碼。每個測試至少覆蓋 happy path + error path

### 3A. src/lib/ — 純工具函數（15 個）— 優先級：P0，最容易寫

| # | 原始檔案 | 測試檔案路徑 |
|---|---------|------------|
| 1 | `src/lib/ai.ts` | `src/lib/__tests__/ai.test.ts` |
| 2 | `src/lib/connectTokenCrypto.ts` | `src/lib/__tests__/connectTokenCrypto.test.ts` |
| 3 | `src/lib/detection-labels.ts` | `src/lib/__tests__/detection-labels.test.ts` |
| 4 | `src/lib/haptic.ts` | `src/lib/__tests__/haptic.test.ts` |
| 5 | `src/lib/logger.ts` | `src/lib/__tests__/logger.test.ts` |
| 6 | `src/lib/mhEnv.ts` | `src/lib/__tests__/mhEnv.test.ts` |
| 7 | `src/lib/notify.ts` | `src/lib/__tests__/notify.test.ts` |
| 8 | `src/lib/safeStorage.ts` | `src/lib/__tests__/safeStorage.test.ts` |
| 9 | `src/lib/secureStorage.ts` | `src/lib/__tests__/secureStorage.test.ts` |
| 10 | `src/lib/supabase.ts` | `src/lib/__tests__/supabase.test.ts` |
| 11 | `src/lib/time.ts` | `src/lib/__tests__/time.test.ts` |
| 12 | `src/lib/types.ts` | `src/lib/__tests__/types.test.ts` |
| 13 | `src/lib/urlUtils.ts` | `src/lib/__tests__/urlUtils.test.ts` |
| 14 | `src/lib/utils.ts` | `src/lib/__tests__/utils.test.ts` |
| 15 | `src/lib/version.ts` | `src/lib/__tests__/version.test.ts` |

### 3B. src/hooks/ — React Hooks（17 個）— 優先級：P1

| # | 原始檔案 | 測試檔案路徑 |
|---|---------|------------|
| 1 | `src/features/home/hooks/useSmartAsk.ts` | `src/features/home/hooks/__tests__/useSmartAsk.test.ts` |
| 2 | `src/hooks/feed/index.ts` | `src/hooks/feed/__tests__/index.test.ts` |
| 3 | `src/hooks/useAgentConversations.ts` | `src/hooks/__tests__/useAgentConversations.test.ts` |
| 4 | `src/hooks/useAuth.ts` | `src/hooks/__tests__/useAuth.test.ts` |
| 5 | `src/hooks/useBodyScrollLock.ts` | `src/hooks/__tests__/useBodyScrollLock.test.ts` |
| 6 | `src/hooks/useComments.ts` | `src/hooks/__tests__/useComments.test.ts` |
| 7 | `src/hooks/useCommunityWall.ts` | `src/hooks/__tests__/useCommunityWall.test.ts` |
| 8 | `src/hooks/useCommunityWallData.ts` | `src/hooks/__tests__/useCommunityWallData.test.ts` |
| 9 | `src/hooks/useComposer.ts` | `src/hooks/__tests__/useComposer.test.ts` |
| 10 | `src/hooks/useFocusTrap.ts` | `src/hooks/__tests__/useFocusTrap.test.ts` |
| 11 | `src/hooks/useGuestVisibleItems.ts` | `src/hooks/__tests__/useGuestVisibleItems.test.ts` |
| 12 | `src/hooks/usePropertyFormValidation.ts` | `src/hooks/__tests__/usePropertyFormValidation.test.ts` |
| 13 | `src/hooks/usePropertyTracker.ts` | `src/hooks/__tests__/usePropertyTracker.test.ts` |
| 14 | `src/hooks/usePushNotifications.ts` | `src/hooks/__tests__/usePushNotifications.test.ts` |
| 15 | `src/hooks/useThrottle.ts` | `src/hooks/__tests__/useThrottle.test.ts` |
| 16 | `src/hooks/useTrustRoom.ts` | `src/hooks/__tests__/useTrustRoom.test.ts` |
| 17 | `src/pages/UAG/hooks/*` (6 個) | 各自對應 `__tests__/` 目錄 |

UAG hooks 明細：
- `src/pages/UAG/hooks/useAgentProfile.ts` → `src/pages/UAG/hooks/__tests__/useAgentProfile.test.ts`
- `src/pages/UAG/hooks/useLeadPurchase.ts` → `src/pages/UAG/hooks/__tests__/useLeadPurchase.test.ts`
- `src/pages/UAG/hooks/useLeadSelection.ts` → `src/pages/UAG/hooks/__tests__/useLeadSelection.test.ts`
- `src/pages/UAG/hooks/useRealtimeUpdates.ts` → `src/pages/UAG/hooks/__tests__/useRealtimeUpdates.test.ts`
- `src/pages/UAG/hooks/useUAGData.ts` → `src/pages/UAG/hooks/__tests__/useUAGData.test.ts`
- `src/pages/UAG/hooks/useWindowSize.ts` → `src/pages/UAG/hooks/__tests__/useWindowSize.test.ts`
- `src/pages/UAG/Profile/hooks/useAgentProfile.ts` → `src/pages/UAG/Profile/hooks/__tests__/useAgentProfile.test.ts`

### 3C. src/services/ — 服務層（16 個）— 優先級：P1

| # | 原始檔案 | 測試檔案路徑 |
|---|---------|------------|
| 1 | `src/services/agentService.ts` | `src/services/__tests__/agentService.test.ts` |
| 2 | `src/services/ai.ts` | `src/services/__tests__/ai.test.ts` |
| 3 | `src/services/analytics.ts` | `src/services/__tests__/analytics.test.ts` |
| 4 | `src/services/api.ts` | `src/services/__tests__/api.test.ts` |
| 5 | `src/services/auth.ts` | `src/services/__tests__/auth.test.ts` |
| 6 | `src/services/detection.ts` | `src/services/__tests__/detection.test.ts` |
| 7 | `src/services/imageService.ts` | `src/services/__tests__/imageService.test.ts` |
| 8 | `src/services/index.ts` | `src/services/__tests__/index.test.ts` |
| 9 | `src/services/leadService.ts` | `src/services/__tests__/leadService.test.ts` |
| 10 | `src/services/messagingService.ts` | `src/services/__tests__/messagingService.test.ts` |
| 11 | `src/services/mock/agent.ts` | `src/services/mock/__tests__/agent.test.ts` |
| 12 | `src/services/mock/feed.ts` | `src/services/mock/__tests__/feed.test.ts` |
| 13 | `src/services/mock/fixtures.ts` | `src/services/mock/__tests__/fixtures.test.ts` |
| 14 | `src/services/mock/index.ts` | `src/services/mock/__tests__/index.test.ts` |
| 15 | `src/services/openai.ts` | `src/services/__tests__/openai.test.ts` |
| 16 | `src/services/replicate.ts` | `src/services/__tests__/replicate.test.ts` |
| 17 | `src/services/trustService.ts` | `src/services/__tests__/trustService.test.ts` |
| 18 | `src/services/uploadService.ts` | `src/services/__tests__/uploadService.test.ts` |

### 3D. src/pages/Community/lib/ — 社區工具函數（2 個）— 優先級：P1

| # | 原始檔案 | 測試檔案路徑 |
|---|---------|------------|
| 1 | `src/pages/Community/lib/index.ts` | `src/pages/Community/lib/__tests__/index.test.ts` |
| 2 | `src/pages/Community/lib/permissions.ts` | `src/pages/Community/lib/__tests__/permissions.test.ts` |

### 3E. api/lib/ — API 共用工具（13 個）— 優先級：P0

| # | 原始檔案 | 測試檔案路徑 |
|---|---------|------------|
| 1 | `api/lib/auth.ts` | `api/lib/__tests__/auth.test.ts` |
| 2 | `api/lib/cors.ts` | `api/lib/__tests__/cors.test.ts` |
| 3 | `api/lib/crypto.ts` | `api/lib/__tests__/crypto.test.ts` |
| 4 | `api/lib/env.ts` | `api/lib/__tests__/env.test.ts` |
| 5 | `api/lib/helpers.ts` | `api/lib/__tests__/helpers.test.ts` |
| 6 | `api/lib/index.ts` | `api/lib/__tests__/index.test.ts` |
| 7 | `api/lib/intentDetector.ts` | `api/lib/__tests__/intentDetector.test.ts` |
| 8 | `api/lib/logger.ts` | `api/lib/__tests__/logger.test.ts` |
| 9 | `api/lib/rateLimiter.ts` | `api/lib/__tests__/rateLimiter.test.ts` |
| 10 | `api/lib/sentry.ts` | `api/lib/__tests__/sentry.test.ts` |
| 11 | `api/lib/supabase.ts` | `api/lib/__tests__/supabase.test.ts` |
| 12 | `api/lib/taskManager.ts` | `api/lib/__tests__/taskManager.test.ts` |
| 13 | `api/lib/timeUtils.ts` | `api/lib/__tests__/timeUtils.test.ts` |

### 3F. api/ endpoints — API 端點（24 個）— 優先級：P1

| # | 原始檔案 | 測試檔案路徑 |
|---|---------|------------|
| 1 | `api/agent/avatar.ts` | `api/agent/__tests__/avatar.test.ts` |
| 2 | `api/agent/me.ts` | `api/agent/__tests__/me.test.ts` |
| 3 | `api/agent/profile.ts` | `api/agent/__tests__/profile.test.ts` |
| 4 | `api/analytics/import.ts` | `api/analytics/__tests__/import.test.ts` |
| 5 | `api/chat.ts` | `api/__tests__/chat.test.ts` |
| 6 | `api/claude.ts` | `api/__tests__/claude.test.ts` |
| 7 | `api/community/comment.ts` | `api/community/__tests__/comment.test.ts` |
| 8 | `api/community/env-check.ts` | `api/community/__tests__/env-check.test.ts` |
| 9 | `api/community/like.ts` | `api/community/__tests__/like.test.ts` |
| 10 | `api/community/question.ts` | `api/community/__tests__/question.test.ts` |
| 11 | `api/generate-community-profile.ts` | `api/__tests__/generate-community-profile.test.ts` |
| 12 | `api/home/featured-reviews.ts` | `api/home/__tests__/featured-reviews.test.ts` |
| 13 | `api/line/webhook.ts` | `api/line/__tests__/webhook.test.ts` |
| 14 | `api/line-notify.ts` | `api/__tests__/line-notify.test.ts` |
| 15 | `api/log-error.ts` | `api/__tests__/log-error.test.ts` |
| 16 | `api/muse-speak.ts` | `api/__tests__/muse-speak.test.ts` |
| 17 | `api/property/generate-key-capsules.ts` | `api/property/__tests__/generate-key-capsules.test.ts` |
| 18 | `api/report/create.ts` | `api/report/__tests__/create.test.ts` |
| 19 | `api/report/track.ts` | `api/report/__tests__/track.test.ts` |
| 20 | `api/shadow-beacon.ts` | `api/__tests__/shadow-beacon.test.ts` |
| 21 | `api/test/line-push.ts` | `api/test/__tests__/line-push.test.ts` |

### 3G. api/trust/ endpoints — 信任流程 API（14 個）— 優先級：P1

| # | 原始檔案 | 測試檔案路徑 |
|---|---------|------------|
| 1 | `api/trust/auto-create-case-public.ts` | `api/trust/__tests__/auto-create-case-public.test.ts` |
| 2 | `api/trust/cases/[id].ts` | `api/trust/__tests__/cases-id.test.ts` |
| 3 | `api/trust/checklist.ts` | `api/trust/__tests__/checklist.test.ts` |
| 4 | `api/trust/complete-buyer-info.ts` | `api/trust/__tests__/complete-buyer-info.test.ts` |
| 5 | `api/trust/confirm.ts` | `api/trust/__tests__/confirm.test.ts` |
| 6 | `api/trust/login.ts` | `api/trust/__tests__/login.test.ts` |
| 7 | `api/trust/me.ts` | `api/trust/__tests__/me.test.ts` |
| 8 | `api/trust/payment.ts` | `api/trust/__tests__/payment.test.ts` |
| 9 | `api/trust/reset.ts` | `api/trust/__tests__/reset.test.ts` |
| 10 | `api/trust/session.ts` | `api/trust/__tests__/session.test.ts` |
| 11 | `api/trust/status.ts` | `api/trust/__tests__/status.test.ts` |
| 12 | `api/trust/submit.ts` | `api/trust/__tests__/submit.test.ts` |
| 13 | `api/trust/supplement.ts` | `api/trust/__tests__/supplement.test.ts` |
| 14 | `api/trust/token.ts` | `api/trust/__tests__/token.test.ts` |

### 3H. api/trust/ helpers + 其他（3 個）— 優先級：P1

| # | 原始檔案 | 測試檔案路徑 |
|---|---------|------------|
| 1 | `api/trust/_auto-create-helpers.ts` | `api/trust/__tests__/_auto-create-helpers.test.ts` |
| 2 | `api/trust/_utils.ts` | `api/trust/__tests__/_utils.test.ts` |
| 3 | `api/uag/track.ts` | `api/uag/__tests__/track.test.ts` |

### 3I. 測試工具本身（1 個）— 優先級：P2

| # | 原始檔案 | 測試檔案路徑 | 備註 |
|---|---------|------------|------|
| 1 | `api/__test-utils__/mockRequest.ts` | `api/__test-utils__/__tests__/mockRequest.test.ts` | 測試輔助工具，可考慮排除 |

---

## 建議執行順序

```
Phase A — 低風險快速消 warning（預估 -25）
├── 3A. src/lib/ 純函數測試 × 15（最容易，純函數 mock 少）
├── 3E. api/lib/ 工具測試 × 13（同理）
└── 調整閾值排除合理項目:
    ├── missing-test 排除 index.ts / mock/ / fixtures/ / __test-utils__（-8）
    ├── func-too-long 排除僅超 10 行的（PropertyEditPage 202, useTrustRoom 208）（-2）
    └── file-too-large 排除僅超 15 行的（useFeedData 809, MaiMaiBase 811）（-2）

Phase B — 中風險測試補齊（預估 -57）
├── 3B. src/hooks/ 測試 × 17
├── 3C. src/services/ 測試 × 18
├── 3D. src/pages/Community/lib/ 測試 × 2
├── 3F. api/ endpoints 測試 × 21
├── 3G. api/trust/ 測試 × 14
└── 3H + 3I. 其他測試 × 4

Phase C — 高風險重構（預估 -33）
├── 1C. API handler 拆分 × 7（後端，影響範圍小）
├── 1B. Hooks/Services 拆分 × 7（中間層）
├── Batch 2. file-too-large 拆分 × 7（需更新 import）
└── 1A. 前端頁面拆分 × 14（影響最大，最後做）
```

---

## 驗收標準

每個 Phase 完成後必須通過：

```bash
npm run typecheck   # 0 errors
npm run lint        # 0 errors/warnings
npm test            # 全部通過
node scripts/zero-slack-check.cjs --full  # 確認 warning 數下降
```

---

## 可選：閾值微調方案

如果判斷部分 warning 是「合理不修」，可在 `scripts/zero-slack-check.cjs` 中調整：

| 調整項 | 當前值 | 建議值 | 預估消除 |
|--------|--------|--------|---------|
| `FUNC_MAX_LINES` | 200 | 210 | -2（PropertyEditPage, useTrustRoom） |
| `FILE_MAX_LINES` | 800 | 815 | -2（useFeedData, MaiMaiBase） |
| missing-test 排除 `index.ts` | 不排除 | 排除 | -4（純 re-export） |
| missing-test 排除 `mock/` | 不排除 | 排除 | -4（測試輔助） |
| missing-test 排除 `__test-utils__/` | 不排除 | 排除 | -1 |
| missing-test 排除 `fixtures.ts` | 不排除 | 排除 | -1 |

合計：**可直接減少 ~12 個 warning**，無需寫任何代碼

---

## 備註

- 所有 func-too-long / file-too-large 的拆分，必須保持外部 API 不變（export 不變）
- 測試檔案命名統一使用 `__tests__/原始檔名.test.ts` 格式
- 測試至少覆蓋：happy path + error/edge case
- 拆分後的新檔案應放在同目錄或合理的子目錄下
