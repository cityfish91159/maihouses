# 測試1：站內訊息 100% 成功 - 完整檢查清單

## 🎯 測試目標

驗證當 LINE 發送失敗時，站內訊息仍能 100% 成功發送。

## 📋 前置條件

### 1. 暫時停用 LINE 發送（選擇一種方法）

**方法 A：移除 LINE_CHANNEL_ACCESS_TOKEN（推薦）**

```bash
# Vercel Dashboard
1. 進入 https://vercel.com/你的專案/settings/environment-variables
2. 找到 LINE_CHANNEL_ACCESS_TOKEN
3. 暫時刪除或改名為 LINE_CHANNEL_ACCESS_TOKEN_BACKUP
4. 重新部署
```

**方法 B：改錯 Token 值**

```bash
# 在 Vercel 設定環境變數
LINE_CHANNEL_ACCESS_TOKEN=INVALID_TOKEN_FOR_TESTING
```

### 2. 確認測試帳號

**需要的帳號：**

- ✅ 房仲測試帳號（已登入）
- ✅ 消費者 session（有 LINE 綁定記錄）
- ✅ 測試物件（有 Lead 資料）

### 3. 資料庫準備

**檢查 SQL：**

```sql
-- 1. 確認有測試用的 LINE 綁定（即使 LINE 會失敗）
SELECT * FROM uag_line_bindings
WHERE line_status = 'active'
LIMIT 3;

-- 2. 確認 messages 表可寫入
SELECT COUNT(*) FROM messages;

-- 3. 清空之前的測試資料（可選）
-- DELETE FROM uag_line_notification_queue WHERE created_at < NOW() - INTERVAL '1 hour';
```

---

## 🧪 測試步驟

### Step 1: 登入房仲帳號

- [ ] 開啟 https://maihouses.vercel.app/maihouses/
- [ ] 使用房仲測試帳號登入
- [ ] 確認導向 UAG 頁面

### Step 2: 購買 Lead

- [ ] 在 UAG 列表中找到有 LINE 綁定的 Lead
- [ ] 點擊「獲取聯絡權限」按鈕
- [ ] 確認購買成功（餘額扣除）

### Step 3: 發送訊息

- [ ] 點擊「LINE/站內信聯繫」按鈕
- [ ] 開啟 SendMessageModal
- [ ] 輸入訊息：「測試1 - 站內訊息獨立成功」
- [ ] 點擊「發送」按鈕

### Step 4: 觀察前端 Response

- [ ] **打開 Browser DevTools (F12)**
- [ ] **切換到 Network 標籤**
- [ ] **篩選 `/api/uag/send-message`**
- [ ] **檢查 Response JSON**

**預期 Response：**

```json
{
  "success": true,
  "conversationId": "uuid-xxxx-xxxx",
  "lineStatus": "error" // 或 "pending" 或 "skipped"
}
```

### Step 5: 檢查 Toast 訊息

- [ ] Toast 顯示「訊息已發送」（或類似成功訊息）
- [ ] **不應該**顯示「發送失敗」

### Step 6: 驗證資料庫（關鍵）

**SQL 1: 檢查站內訊息是否成功寫入**

```sql
SELECT
  id,
  conversation_id,
  sender_type,
  content,
  created_at
FROM messages
WHERE content LIKE '%測試1%'
ORDER BY created_at DESC
LIMIT 5;
```

**預期結果：**

- ✅ 找到 1 筆記錄
- ✅ `sender_type = 'agent'`
- ✅ `content = '測試1 - 站內訊息獨立成功'`
- ✅ `conversation_id` 與 API Response 一致

**SQL 2: 檢查 LINE 通知狀態**

```sql
SELECT
  id,
  purchase_id,
  notification_status,
  notification_retry_key,
  last_notification_at
FROM uag_lead_purchases
WHERE updated_at > NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC
LIMIT 3;
```

**預期結果：**

- ✅ `notification_status = 'skipped'` 或 `'error'` 或 `'pending'`
- ✅ **不是** `'sent'`（因為 LINE 失敗）

**SQL 3: 檢查 LINE 通知佇列（如果有嘗試發送）**

```sql
SELECT
  id,
  message_id,
  status,
  last_error,
  retry_count,
  created_at
FROM uag_line_notification_queue
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 3;
```

**預期結果（如果有建立 queue）：**

- ✅ `status = 'pending'` 或 `'failed'`
- ✅ `last_error` 包含錯誤訊息（如 "Invalid access token"）

**SQL 4: 檢查審計日誌（如果有記錄）**

```sql
SELECT
  id,
  purchase_id,
  status,
  line_response,
  created_at
FROM uag_line_audit_logs
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 3;
```

---

## ✅ 驗收標準（全部必須通過）

### 前端驗證

- [ ] API 回傳 `success: true`
- [ ] `lineStatus` 為 `"error"`, `"pending"`, 或 `"skipped"`（不是 "sent"）
- [ ] Toast 顯示成功訊息（不顯示失敗）
- [ ] UI 沒有報錯

### 資料庫驗證（最重要）

- [ ] `messages` 表有新記錄（站內訊息成功）
- [ ] `conversation_id` 正確
- [ ] `sender_type = 'agent'`
- [ ] `content` 正確
- [ ] `uag_lead_purchases.notification_status` **不是** `'sent'`

### 邏輯驗證

- [ ] 站內訊息成功 **獨立於** LINE 發送結果
- [ ] LINE 失敗不影響站內訊息
- [ ] 錯誤被正確記錄（audit logs 或 queue）

---

## 🐛 可能的問題與排查

### 問題 1: API 回傳 `success: false`

**原因：** 站內訊息發送失敗（嚴重錯誤）
**排查：**

```sql
-- 檢查 RPC 函數是否正常
SELECT fn_create_conversation('test-agent', 'test-session', NULL, 'test-purchase');
SELECT fn_send_message('conv-id', 'agent', 'agent-id', 'test message');
```

### 問題 2: messages 表沒有記錄

**原因：** `fn_send_message` RPC 失敗
**排查：**

- 檢查 Vercel Functions logs
- 檢查 Supabase logs
- 確認 SUPABASE_SERVICE_ROLE_KEY 正確

### 問題 3: Toast 顯示失敗訊息

**原因：** 前端錯誤處理邏輯問題
**排查：**

- 檢查 SendMessageModal.tsx 的 toast 邏輯
- 確認根據 `lineStatus` 而非 `success` 顯示訊息

---

## 📊 測試報告格式

完成後填寫：

```markdown
## 測試1 結果報告

**執行時間：** 2026-01-09 [HH:MM]
**執行人員：** [您的名字]
**環境：** Production (https://maihouses.vercel.app)

### API Response

- success: ✅ true / ❌ false
- lineStatus: [實際值]
- conversationId: [UUID]

### 資料庫驗證

- messages 表: ✅ 有記錄 / ❌ 無記錄
- notification_status: [實際值]
- LINE queue: ✅ 有錯誤記錄 / ❌ 無

### 整體結果

✅ 通過 / ❌ 失敗

### 備註

[任何額外發現或問題]
```

---

**準備好後，開始執行測試1！**
