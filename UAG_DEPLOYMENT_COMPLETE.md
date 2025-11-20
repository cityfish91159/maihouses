# ✅ UAG 業務廣告後台部署完成!

## 📦 已建立的檔案

1. **`supabase-schema.sql`** - Supabase 資料庫 Schema
   - `uag_events` 資料表
   - 索引優化
   - Views: `uag_daily_stats`, `uag_user_journey`
   - RLS 安全策略

2. **`api/v1/uag/events.js`** - Vercel Serverless API
   - 接收前端追蹤事件
   - 批次寫入 Supabase
   - 重複防護 (request_id)
   - 錯誤處理 & 重試機制

3. **`public/p/uag-dashboard.html`** - UAG 後台管理介面
   - 即時數據總覽
   - 熱門事件/頁面排行
   - 最近事件記錄
   - 時間範圍篩選

4. **`UAG_DEPLOYMENT_GUIDE.md`** - 完整部署文件
5. **`UAG_QUICK_START.md`** - 快速啟動指南

## 🚀 下一步操作 (必須手動完成)

### 1️⃣ 執行 Supabase Schema (5 分鐘)

```bash
# 登入 Supabase Dashboard
open https://supabase.com/dashboard

# 1. 選擇專案
# 2. 點選 SQL Editor
# 3. 複製 supabase-schema.sql 的內容
# 4. 貼上並執行
# 5. 確認 uag_events 資料表已建立
```

### 2️⃣ 設定 Vercel 環境變數 (3 分鐘)

```bash
# 前往 Vercel 設定頁
open https://vercel.com/cityfish91159/maihouses/settings/environment-variables

# 新增以下 3 個變數:
# 1. VITE_SUPABASE_URL = https://你的專案.supabase.co
# 2. VITE_SUPABASE_ANON_KEY = eyJhbG...你的anon_key
# 3. SUPABASE_SERVICE_KEY = eyJhbG...你的service_role_key (僅 Production)
```

**如何取得 Supabase Keys:**
```
Supabase Dashboard → Settings → API
- Project URL (VITE_SUPABASE_URL)
- anon public key (VITE_SUPABASE_ANON_KEY)  
- service_role key (SUPABASE_SERVICE_KEY) ⚠️ 保密!
```

### 3️⃣ 修改 Dashboard 設定 (2 分鐘)

編輯 `public/p/uag-dashboard.html` 第 214-215 行:

```javascript
// 替換成你的 Supabase 資訊
const SUPABASE_URL = 'https://你的專案.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbG...你的anon_key'
```

然後提交並部署:
```bash
git add public/p/uag-dashboard.html docs/p/uag-dashboard.html
git commit -m "fix: update UAG dashboard Supabase config"
git push
```

### 4️⃣ 等待 Vercel 重新部署 (2-3 分鐘)

Vercel 會自動偵測 push 並重新建置。

檢查部署狀態:
```bash
open https://vercel.com/cityfish91159/maihouses/deployments
```

### 5️⃣ 測試 API (1 分鐘)

```bash
# 測試 UAG 事件 API
curl -X POST https://maihouses.vercel.app/api/v1/uag/events \
  -H "Content-Type: application/json" \
  -d '[{
    "event": "test_deployment",
    "page": "/test",
    "sessionId": "test-session-123",
    "userId": null,
    "ts": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "meta": {"source": "manual_test"},
    "requestId": "'$(uuidgen)'"
  }]'

# 預期結果: {"success":true,"saved":1}
```

### 6️⃣ 訪問 Dashboard (1 分鐘)

```bash
# 開啟 UAG 後台
open https://maihouses.vercel.app/p/uag-dashboard.html
```

應該看到:
- ✅ 總覽數據卡片
- ✅ 熱門事件表格
- ✅ 熱門頁面表格
- ✅ 最近事件記錄

## ✅ 驗證清單

- [ ] Supabase 資料表 `uag_events` 已建立
- [ ] Vercel 環境變數 (3個) 已設定
- [ ] Dashboard HTML 已修改 Supabase 設定
- [ ] Git push 成功,Vercel 重新部署完成
- [ ] API 測試返回 `{"success":true}`
- [ ] Dashboard 能正常顯示數據

## 📊 系統架構

```
前端 (React App)
  ↓ trackEvent()
localStorage Queue (離線支援)
  ↓ 批次上傳
Vercel API (/api/v1/uag/events)
  ↓ 驗證 & 轉換
Supabase (PostgreSQL)
  ↓ 查詢
UAG Dashboard (/p/uag-dashboard.html)
```

## 🎯 功能特點

✅ **自動追蹤** - 前端已整合 `src/services/uag.ts`  
✅ **離線支援** - LocalStorage 佇列,斷線重試  
✅ **防重複** - request_id UNIQUE 約束  
✅ **批次處理** - 減少 API 請求次數  
✅ **即時分析** - Dashboard 即時查詢 Supabase  
✅ **RLS 安全** - 資料庫層級權限控制  

## 📚 文件參考

- 完整指南: `UAG_DEPLOYMENT_GUIDE.md`
- 快速啟動: `UAG_QUICK_START.md`
- Schema: `supabase-schema.sql`
- API: `api/v1/uag/events.js`
- 前端: `src/services/uag.ts`

## 🔍 故障排查

### API 返回 500
→ 檢查 Vercel Logs: https://vercel.com/cityfish91159/maihouses/logs  
→ 確認環境變數是否正確設定

### Dashboard 無數據
→ 確認已執行 `supabase-schema.sql`  
→ 確認已修改 Dashboard 的 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`

### 前端無追蹤
→ 開啟 Browser Console 檢查錯誤  
→ 檢查 Network 面板的 `/api/v1/uag/events` 請求

---

**部署時間:** $(date)  
**Commit:** ad63c04  
**狀態:** ✅ 代碼已推送,等待 Vercel 重新部署
