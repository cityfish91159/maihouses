# UAG 業務廣告後台部署指南

## 📋 總覽

完整的 UAG (User Activity & Growth) 系統,用於追蹤用戶行為、分析廣告效果。

**技術棧:**
- 前端: React + TypeScript
- 後端: Vercel Serverless Functions
- 資料庫: Supabase (PostgreSQL)
- 追蹤: 自動批次上傳,斷線重試

---

## 🚀 部署步驟

### 1. Supabase 設定

#### 1.1 建立資料表
登入 [Supabase Dashboard](https://supabase.com/dashboard) → 選擇專案 → SQL Editor

執行 `supabase-schema.sql`:

```sql
-- 複製 supabase-schema.sql 的內容並執行
```

#### 1.2 取得 API Keys
Settings → API → 複製:
- `Project URL` (例: https://xxx.supabase.co)
- `anon public key` (前端用)
- `service_role key` (後端用,保密!)

---

### 2. Vercel 環境變數設定

#### 2.1 前往 Vercel Dashboard
https://vercel.com/cityfish91159/maihouses → Settings → Environment Variables

#### 2.2 新增以下變數

| 變數名稱 | 值 | 環境 |
|---------|---|------|
| `VITE_SUPABASE_URL` | https://xxx.supabase.co | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | eyJhbG... (anon key) | Production, Preview, Development |
| `SUPABASE_SERVICE_KEY` | eyJhbG... (service_role key) | **僅 Production** |

⚠️ **注意:** 
- `VITE_` 開頭的變數會打包進前端代碼
- `SUPABASE_SERVICE_KEY` 只能用於後端 API

---

### 3. 安裝依賴套件

```bash
npm install @supabase/supabase-js
```

---

### 4. 部署到 Vercel

#### 4.1 提交代碼
```bash
git add .
git commit -m "feat: add UAG analytics backend"
git push origin main
```

#### 4.2 Vercel 自動部署
- Vercel 會自動偵測 push 並開始建置
- 等待 2-3 分鐘完成部署

#### 4.3 驗證部署
訪問: https://maihouses.vercel.app/api/v1/uag/events
- 應該返回 `405 Method not allowed` (正常,因為需要 POST)

---

### 5. 測試 UAG 追蹤

#### 5.1 開啟網站並打開瀏覽器開發者工具
https://maihouses.vercel.app/maihouses/

#### 5.2 檢查 Console
應該看到:
```
[track] card_view {...}
```

#### 5.3 檢查 Network
過濾 `uag` → 應該看到 POST 請求到 `/api/v1/uag/events`
- Status: 200 OK
- Response: `{"success": true, "saved": 1}`

#### 5.4 驗證 Supabase 資料
Supabase Dashboard → Table Editor → `uag_events`
- 應該看到新增的事件記錄

---

## 📊 UAG 後台管理頁面

### 建立 `/p/uag-dashboard.html`

簡易後台可以查看:
- 每日事件統計
- 熱門頁面/事件
- 用戶旅程分析
- 廣告效果追蹤

(下一步建立)

---

## 🔍 故障排查

### 問題: API 返回 500 錯誤

**檢查:**
1. Vercel Logs: https://vercel.com/cityfish91159/maihouses/logs
2. 環境變數是否正確設定
3. Supabase 資料表是否建立成功

### 問題: 前端無法送出事件

**檢查:**
1. Browser Console 有無錯誤
2. Network 請求是否被 CORS 阻擋
3. LocalStorage 是否有 `uag_queue`

### 問題: 資料重複

**解決:** 
- Schema 已設定 `request_id UNIQUE`
- API 使用 `upsert` + `ignoreDuplicates`
- 自動防重複

---

## 📈 資料分析查詢範例

### 每日活躍用戶
```sql
SELECT * FROM uag_daily_stats
ORDER BY date DESC
LIMIT 30;
```

### 最熱門事件
```sql
SELECT event, COUNT(*) as count
FROM uag_events
WHERE ts > NOW() - INTERVAL '7 days'
GROUP BY event
ORDER BY count DESC;
```

### 用戶轉換漏斗
```sql
SELECT 
  session_id,
  BOOL_OR(event = 'card_view') as viewed,
  BOOL_OR(event = 'card_member_cta') as clicked_cta,
  BOOL_OR(event LIKE 'register%') as registered
FROM uag_events
GROUP BY session_id;
```

---

## 🔐 安全性

- ✅ 前端使用 `anon key` (RLS 保護)
- ✅ 後端使用 `service_role key` (僅 Vercel 環境變數)
- ✅ CORS 設定允許跨域請求
- ✅ Request ID 防重複插入
- ✅ RLS Policy 限制讀取權限

---

## 下一步

- [ ] 建立 UAG Dashboard UI
- [ ] 設定 Supabase Realtime 通知
- [ ] 整合 Google Analytics 4
- [ ] A/B Testing 框架
- [ ] 自動報表寄送

---

## 聯絡資訊

如有問題請參考:
- Vercel 文件: https://vercel.com/docs
- Supabase 文件: https://supabase.com/docs
- UAG 代碼: `src/services/uag.ts`
