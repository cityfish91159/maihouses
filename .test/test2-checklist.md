# 測試2：有綁定 LINE 測試 - 完整檢查清單

## 🎯 測試目標

驗證當客戶有綁定 LINE 時，可以成功收到 LINE 通知，且訊息包含修3和修4的新功能。

## 📋 前置條件

### 1. 環境設定

- ✅ Vercel 已部署最新版本（commit: 34c01aab）
- ✅ **LINE_CHANNEL_ACCESS_TOKEN 已正確設定**（與測1相反）
- ✅ LINE Official Account 正常運作

### 2. 測試帳號準備

**需要的帳號：**

- [ ] 房仲測試帳號（已登入 UAG 系統）
- [ ] 消費者 session（**必須有 LINE 綁定**）
- [ ] 測試物件（有 propertyId）
- [ ] LINE 測試用手機（已加入官方帳號好友）

### 3. 資料庫檢查

**SQL 1: 確認有測試用的 LINE 綁定**

```sql
SELECT
  consumer_session_id,
  line_user_id,
  line_status,
  created_at
FROM uag_line_bindings
WHERE line_status = 'active'
ORDER BY created_at DESC
LIMIT 5;
```

**預期結果：**

- ✅ 至少有 1 筆 active 綁定記錄
- ✅ `line_user_id` 有值（格式：U + 32 位字元）
- ✅ `line_status = 'active'`（不是 'blocked'）

**SQL 2: 記錄測試用的 consumer_session_id**

```sql
-- 選擇一個要用於測試的 session
SELECT
  consumer_session_id,
  line_user_id
FROM uag_line_bindings
WHERE line_status = 'active'
LIMIT 1;
```

**記錄：**

- `consumer_session_id`: **********\_\_\_\_**********
- `line_user_id`: **********\_\_\_\_**********

---

## 🧪 測試步驟

### Step 1: 房仲登入並購買 Lead

1. [ ] 開啟 https://maihouses.vercel.app/maihouses/
2. [ ] 使用房仲測試帳號登入
3. [ ] 導向 UAG 頁面
4. [ ] 找到對應上述 `consumer_session_id` 的 Lead
5. [ ] 點擊「獲取聯絡權限」
6. [ ] 確認購買成功

### Step 2: 發送訊息

1. [ ] 點擊「LINE/站內信聯繫」按鈕
2. [ ] 開啟 SendMessageModal
3. [ ] **輸入訊息：** 「測試2 - 有綁定 LINE 推播測試」
4. [ ] **記錄發送時間：** ******\_\_\_****** (HH:MM:SS)
5. [ ] 點擊「發送」按鈕

### Step 3: 檢查前端 Response

**打開 Browser DevTools (F12):**

1. [ ] 切換到 **Network** 標籤
2. [ ] 篩選 `/api/uag/send-message`
3. [ ] 檢查 Response JSON

**預期 Response：**

```json
{
  "success": true,
  "conversationId": "uuid-xxxx-xxxx-xxxx-xxxx",
  "lineStatus": "sent" // 🔑 關鍵：應該是 "sent"
}
```

**驗證點：**

- [ ] `success: true`
- [ ] `lineStatus: "sent"` ✅（不是 "error" 或 "skipped"）
- [ ] `conversationId` 有值

### Step 4: 檢查 Toast 訊息

- [ ] Toast 顯示「**已同時透過 LINE 通知客戶**」
- [ ] **不應該**顯示「客戶未綁定 LINE」
- [ ] **不應該**顯示任何錯誤訊息

### Step 5: 等待手機 LINE 通知（關鍵）

**預計等待時間：** 5-30 秒

1. [ ] 手機收到 LINE 推播通知
2. [ ] 通知來自「邁房子」官方帳號
3. [ ] 通知有震動/聲音（依手機設定）

### Step 6: 檢查 LINE 訊息內容（修3驗證）

**打開 LINE APP，檢查訊息內容：**

**預期訊息格式：**

```
🚨【邁房子】獨家 S 級推薦！限時 120h
房仲：[房仲名稱]（[物件標題]）

物件詳情：https://maihouses.vercel.app/maihouses/#/property/[propertyId]

點此查看並回覆：https://maihouses.vercel.app/maihouses/chat/connect?token=[token]
```

**驗證點（修3：物件連結）：**

- [ ] 訊息包含「物件詳情：」文字
- [ ] 包含物件連結：`https://maihouses.vercel.app/maihouses/#/property/xxx`
- [ ] 連結格式正確（有 `/#/property/` 路徑）

**驗證點（其他內容）：**

- [ ] 包含房仲名稱
- [ ] 包含物件標題（如果有）
- [ ] 包含等級前綴（S/A 級）
- [ ] 包含 Connect URL

### Step 7: 點擊物件連結（修3驗證）

1. [ ] 在 LINE 內點擊「物件詳情：https://.../#/property/xxx」連結
2. [ ] 使用 LINE 內建瀏覽器開啟
3. [ ] 確認導向正確的物件頁面
4. [ ] 頁面顯示物件資訊（圖片、標題、價格等）

**驗證點：**

- [ ] URL 正確：`/maihouses/#/property/[propertyId]`
- [ ] 頁面正常載入（不是 404）
- [ ] propertyId 與測試物件一致

### Step 8: 點擊 Connect URL（修4驗證）

1. [ ] 回到 LINE 訊息
2. [ ] 點擊「點此查看並回覆：https://.../chat/connect?token=xxx」
3. [ ] 使用 LINE 內建瀏覽器開啟

**預期行為：**

- [ ] 導向 `/maihouses/chat/connect?token=xxx`
- [ ] Connect 頁面自動處理 token
- [ ] 自動設置 localStorage `uag_session`
- [ ] 自動導向 `/maihouses/chat/[conversationId]`

### Step 9: 驗證 Chat 頁面

1. [ ] Chat 頁面成功載入
2. [ ] 顯示對話內容（包含房仲發送的訊息）
3. [ ] **檢查是否顯示物件資訊卡片**（如果 Chat 有整合）

**驗證點：**

- [ ] 顯示房仲名稱
- [ ] 顯示「測試2 - 有綁定 LINE 推播測試」訊息
- [ ] 可以輸入回覆訊息
- [ ] 頁面無錯誤

### Step 10: 測試回覆訊息

1. [ ] 在 Chat 頁面輸入回覆：「測試回覆 - 確認雙向溝通」
2. [ ] 點擊發送
3. [ ] 確認訊息成功發送

---

## 📊 資料庫驗證（必須執行）

### SQL 1: 檢查站內訊息

```sql
SELECT
  m.id,
  m.conversation_id,
  m.sender_type,
  m.content,
  m.created_at,
  c.property_id
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE m.created_at > NOW() - INTERVAL '10 minutes'
  AND m.content LIKE '%測試2%'
ORDER BY m.created_at DESC;
```

**預期結果：**

- [ ] 有 1 筆記錄
- [ ] `sender_type = 'agent'`
- [ ] `content = '測試2 - 有綁定 LINE 推播測試'`
- [ ] `property_id` 有值（修4驗證）

### SQL 2: 檢查 LINE 發送狀態

```sql
SELECT
  id,
  notification_status,
  notification_retry_key,
  last_notification_at
FROM uag_lead_purchases
WHERE updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY updated_at DESC
LIMIT 3;
```

**預期結果：**

- [ ] `notification_status = 'sent'` ✅（成功發送）
- [ ] `notification_retry_key` 有值（UUID）
- [ ] `last_notification_at` 時間正確

### SQL 3: 檢查 LINE 通知佇列

```sql
SELECT
  id,
  message_id,
  status,
  sent_at,
  last_error
FROM uag_line_notification_queue
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 3;
```

**預期結果：**

- [ ] 有 1 筆記錄
- [ ] `status = 'sent'`
- [ ] `sent_at` 有值
- [ ] `last_error = NULL` 或空

### SQL 4: 檢查 LINE 審計日誌

```sql
SELECT
  id,
  purchase_id,
  status,
  line_response,
  created_at
FROM uag_line_audit_logs
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 3;
```

**預期結果：**

- [ ] 有 1 筆記錄
- [ ] `status = 'sent'`
- [ ] `line_response` 為 NULL 或空物件（LINE API 成功時不回傳詳細）

### SQL 5: 驗證 Connect Token 包含 propertyId（修4驗證）

**從 LINE 訊息複製 token，然後解碼：**

1. 複製 Connect URL 中的 token 參數：`?token=xxxxxx`
2. 在瀏覽器 Console 執行：

```javascript
const token = '貼上你的_token_值';
const decoded = JSON.parse(atob(token.replace(/-/g, '+').replace(/_/g, '/')));
console.log(decoded);
```

**預期結果：**

```json
{
  "conversationId": "uuid-xxxx",
  "sessionId": "session-xxxx",
  "propertyId": "prop-xxxx", // ✅ 修4：應該包含
  "exp": 1736496000000
}
```

**驗證點：**

- [ ] `propertyId` 欄位存在
- [ ] `propertyId` 值正確（與測試物件一致）
- [ ] `exp` 未過期

---

## ✅ 驗收標準（全部必須通過）

### A. LINE 通知發送

- [ ] 手機收到 LINE 推播
- [ ] 訊息包含房仲名稱
- [ ] 訊息包含物件連結（修3）
- [ ] 物件連結可點擊並導向正確頁面

### B. Connect Token

- [ ] Token 包含 propertyId（修4）
- [ ] Token 可正確解析
- [ ] Connect URL 正常運作
- [ ] 自動導向 Chat 頁面

### C. 資料庫記錄

- [ ] `messages` 表有記錄
- [ ] `notification_status = 'sent'`
- [ ] `uag_line_notification_queue.status = 'sent'`
- [ ] `uag_line_audit_logs.status = 'sent'`

### D. 前端 UI

- [ ] API Response `lineStatus = "sent"`
- [ ] Toast 顯示「已同時透過 LINE 通知客戶」
- [ ] Chat 頁面正常載入

---

## 🐛 常見問題排查

### 問題 1: 手機沒收到 LINE 通知

**可能原因：**

1. LINE_CHANNEL_ACCESS_TOKEN 錯誤
2. 測試帳號沒有加入官方帳號好友
3. 測試帳號封鎖了官方帳號
4. LINE API 延遲（等待 1 分鐘）

**排查：**

```sql
-- 檢查綁定狀態
SELECT * FROM uag_line_bindings
WHERE consumer_session_id = '你的_session_id';

-- 檢查審計日誌
SELECT * FROM uag_line_audit_logs
WHERE created_at > NOW() - INTERVAL '10 minutes';
```

### 問題 2: LINE 訊息沒有物件連結

**可能原因：**

- propertyId 為 NULL 或未傳遞
- buildLineMessage 邏輯錯誤

**排查：**

- 檢查 API Request body 是否包含 propertyId
- 檢查 Vercel Functions logs

### 問題 3: Connect Token 沒有 propertyId

**可能原因：**

- 使用舊版代碼（修4未部署）
- generateConnectToken 未傳遞 propertyId

**排查：**

- 確認部署版本：git log --oneline -1
- 檢查 send-message.ts L399

---

## 📝 測試報告格式

```markdown
## 測試2 結果報告

**執行時間：** 2026-01-09 [HH:MM]
**執行人員：** [您的名字]

### LINE 通知發送

- 手機收到通知: ✅ / ❌
- 訊息包含物件連結: ✅ / ❌
- 物件連結可點擊: ✅ / ❌

### Connect Token

- Token 包含 propertyId: ✅ / ❌
- Connect URL 正常: ✅ / ❌
- Chat 頁面載入: ✅ / ❌

### 資料庫驗證

- notification_status: [實際值]
- queue status: [實際值]
- audit log status: [實際值]

### 整體結果

✅ 通過 / ❌ 失敗

### 截圖/備註

[附上 LINE 訊息截圖]
```

---

**準備好後，開始執行測試2！**
