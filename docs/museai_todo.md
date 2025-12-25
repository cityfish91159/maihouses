# MuseAI Todo List

## 1. 資料庫 (Supabase)
- [ ] 執行 SQL Migration: `profiles`, `shadow_logs`, `rival_decoder`
- [ ] 設定 RLS 安全策略

## 2. 後端 (API)
- [ ] 建立 `api/muse-analyze.ts` (OpenAI + Zod)
- [ ] 驗證 API 回應格式

## 3. 前端 - MuseAI
- [ ] 頁面 `/muse` (日夜模式切換)
- [ ] 元件 `ShadowSyncBox` (猶豫偵測)
- [ ] 整合 API 呼叫

## 4. 前端 - GodView
- [ ] 頁面 `/admin/god-view`
- [ ] 實時訂閱 `shadow_logs`
- [ ] Base64 解碼展示

## 5. 部署
- [ ] Vercel 部署驗證
