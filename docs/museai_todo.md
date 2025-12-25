# MuseAI Todo List

## 1. 資料庫 (Supabase)
- [x] 執行 SQL Migration: `profiles`, `shadow_logs`, `rival_decoder`
- [x] 設定 RLS 安全策略

## 2. 後端 (API)
- [x] 建立 `api/muse-analyze.ts` (OpenAI + Zod)
- [x] 驗證 API 回應格式

## 3. 前端 - MuseAI
- [x] 頁面 `/muse` (日夜模式切換)
- [x] 元件 `ShadowSyncBox` (猶豫偵測)
- [x] 整合 API 呼叫

## 4. 前端 - GodView
- [x] 頁面 `/admin/god-view`
- [x] 實時訂閱 `shadow_logs`
- [x] Base64 解碼展示

## 5. 部署
- [x] Vercel 部署驗證
