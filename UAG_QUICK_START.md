# UAG 業務廣告後台 - 快速啟動指南

## 🎯 現在開始使用

### Step 1: 執行 Supabase SQL Schema (2 分鐘)

1. 登入 https://supabase.com/dashboard
2. 選擇專案 → **SQL Editor**
3. 複製 `supabase-schema.sql` 的內容並執行
4. 確認資料表 `uag_events` 已建立

### Step 2: 設定 Vercel 環境變數 (3 分鐘)

1. 前往 https://vercel.com/cityfish91159/maihouses/settings/environment-variables

2. 新增以下 3 個變數:

```
VITE_SUPABASE_URL = https://你的專案.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbG...你的anon_key
SUPABASE_SERVICE_KEY = eyJhbG...你的service_role_key (保密!)
```

3. 全部選擇 **Production, Preview, Development**

### Step 3: 安裝套件 (1 分鐘)

```bash
npm install @supabase/supabase-js
```

### Step 4: 部署 (2 分鐘)

```bash
git add .
git commit -m "feat: UAG 業務廣告後台完整部署"
git push origin main
```

等待 Vercel 自動部署完成!

### Step 5: 測試 UAG API (1 分鐘)

```bash
curl -X POST https://maihouses.vercel.app/api/v1/uag/events \
  -H "Content-Type: application/json" \
  -d '[{
    "event": "test_event",
    "page": "/test",
    "sessionId": "test-123",
    "userId": null,
    "ts": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "meta": {},
    "requestId": "'$(uuidgen)'"
  }]'
```

**預期結果:** `{"success":true,"saved":1}`

### Step 6: 查看後台 Dashboard

1. 訪問: https://maihouses.vercel.app/p/uag-dashboard.html

2. **修改 dashboard 的 Supabase 設定:**

編輯 `public/p/uag-dashboard.html` 第 214-215 行:

```javascript
const SUPABASE_URL = 'https://你的專案.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbG...你的anon_key'
```

3. 重新部署:
```bash
git add public/p/uag-dashboard.html
git commit -m "fix: update UAG dashboard Supabase config"
git push
```

---

## ✅ 驗證清單

- [ ] Supabase 資料表建立成功
- [ ] Vercel 環境變數設定完成
- [ ] npm install 成功
- [ ] Git push 部署成功
- [ ] API 測試返回 200 OK
- [ ] Dashboard 能正常顯示數據

---

## 📊 使用 Dashboard

**功能:**
- 📈 即時總覽數據 (事件數、會話數、用戶數、轉換率)
- 🔥 熱門事件排行
- 📄 熱門頁面排行
- ⏱️ 最近事件記錄
- 🔄 時間範圍篩選 (今天/7天/30天/90天)

**訪問:**
```
https://maihouses.vercel.app/p/uag-dashboard.html
```

---

## 🔍 故障排查

### API 返回 500
→ 檢查 Vercel Logs: https://vercel.com/cityfish91159/maihouses/logs

### Dashboard 無數據
→ 確認已修改 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`

### 前端無追蹤
→ 檢查 Browser Console 有無錯誤

---

## 📚 完整文件

詳細配置請參考: `UAG_DEPLOYMENT_GUIDE.md`
