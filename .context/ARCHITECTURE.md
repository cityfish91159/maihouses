# 架構地圖

## 模組依賴（由上到下）

```
pages → components → hooks → services → api (Vercel Serverless)
                       ↓         ↓
                    stores    supabase (PostgreSQL + RPC)
```

## 技術棧

React 18 · TypeScript (strict) · Vite 7 · Tailwind CSS 3
Zustand (client state) · React Query (server state) · Zod (驗證)
Vercel Functions (後端) · Supabase (DB + Auth + RLS)
Vitest + Testing Library (單元) · Playwright (E2E)

## 五大核心模組

### 1. Trust Flow（安心流程）
交易六階段：M1 接洽 → M2 帶看 → M3 出價 → M4 斡旋 → M5 成交 → M6 交屋

| 層級 | 檔案 |
|------|------|
| 頁面 | `src/pages/TrustRoom.tsx`, `src/pages/Assure/Detail.tsx` |
| 組件 | `src/components/TrustRoom/`, `src/components/Assure/` |
| Hook | `src/hooks/useTrustRoom.ts`, `src/hooks/useTrustActions.ts` |
| API | `api/trust/` (cases, close, notify, upgrade-case 等) |
| 型別 | `src/types/trust-flow.types.ts`, `src/types/trust.types.ts` |

### 2. UAG（User Activity & Growth 導客系統）
業務後台：雷達圖 + 案件管理 + 潛客追蹤

| 層級 | 檔案 |
|------|------|
| 頁面 | `src/pages/UAG/index.tsx` |
| 組件 | `src/pages/UAG/components/` (ActionPanel, TrustFlow, RadarCluster) |
| Hook | `src/pages/UAG/hooks/useUAG.ts` (facade pattern) |
| 服務 | `src/pages/UAG/services/uagService.ts` |
| API | `api/uag/send-message.ts`, `api/uag/track.ts` |

### 3. Community Wall（真實口碑牆）
社區貼文 + 評論 + 問答

| 層級 | 檔案 |
|------|------|
| 頁面 | `src/pages/Community/Wall.tsx` |
| 組件 | `src/pages/Community/components/` |
| Hook | `src/hooks/useCommunityWall.ts`, `src/hooks/useCommunityWallData.ts` |
| API | `api/community/` (post, comment, like, question, wall) |

### 4. Feed（動態牆）
Agent/Consumer 雙角色動態流

| 層級 | 檔案 |
|------|------|
| 頁面 | `src/pages/Feed/Agent.tsx`, `src/pages/Feed/Consumer.tsx` |
| 組件 | `src/components/Feed/` (FeedPostCard, TxBanner, AgentProfileCard) |
| Hook | `src/hooks/useFeedData.ts`, `src/pages/Feed/useAgentFeed.ts` |

### 5. Property（房源）
房源上傳 + 詳情頁 + 列表

| 層級 | 檔案 |
|------|------|
| 頁面 | `src/pages/PropertyDetailPage.tsx`, `src/pages/PropertyUploadPage.tsx` |
| 組件 | `src/components/PropertyDetail/`, `src/components/upload/` |
| 服務 | `src/services/propertyService.ts` |
| 型別 | `src/types/property-page.ts` (Zod Schema) |

## 共用基礎設施

| 用途 | 檔案 |
|------|------|
| Auth | `src/hooks/useAuth.ts`, `api/lib/auth.ts` |
| Supabase Client | `src/lib/supabase.ts` (前端), `api/lib/supabase.ts` (後端) |
| Logger | `src/lib/logger.ts`, `api/lib/logger.ts` |
| API 回應格式 | `api/lib/apiResponse.ts` |
| 環境變數 | `src/config/env.ts`, `api/lib/env.ts` |
| 型別總覽 | `src/types/` 目錄 |

## 術語表

| 術語 | 意義 |
|------|------|
| UAG | User Activity & Growth，導客系統 |
| Trust Flow | 安心流程，交易六階段 M1-M6 |
| Community Wall | 真實口碑牆 |
| MaiMai | 吉祥物，AI 互動角色 |
| RLS | Row Level Security，Supabase 行級安全 |
| RPC | Remote Procedure Call，Supabase 自訂函數 |
