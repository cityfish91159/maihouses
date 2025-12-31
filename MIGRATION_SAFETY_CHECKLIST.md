# ⚠️ Migration 執行安全檢查清單

## 🔴 緊急狀態：20251231_004 Migration 尚未執行

此 migration 包含**破壞性操作**：
- `DROP COLUMN agent_id` (刪除欄位)
- `ALTER COLUMN` 類型轉換

**在執行前必須完成以下檢查：**

---

## 📋 執行前檢查清單

### 1. 備份資料庫
```bash
# Supabase Dashboard > Database > Backups
# 或使用 pg_dump
pg_dump "$DATABASE_URL" > backup_before_msg1_fix_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 檢查現有資料
```sql
-- 檢查 conversations 表是否有資料
SELECT COUNT(*) FROM conversations;

-- 檢查 agent_id 格式
SELECT agent_id,
       agent_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AS is_valid_uuid
FROM conversations
LIMIT 10;

-- 檢查是否有無效的 UUID
SELECT COUNT(*) FROM conversations
WHERE agent_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
```

### 3. 確認正確的表名
```sql
-- 確認 uag_lead_purchases 表存在
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE '%lead%';
```

### 4. 測試環境執行
```bash
# 在 local Supabase 先測試
supabase db reset
supabase migration up
```

---

## 🛠️ 安全執行方案

### 方案 A: 分步執行（推薦）

**Step 1: 只修正 FK（安全，無破壞性）**
```sql
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_lead_id_fkey;

ALTER TABLE conversations
ADD CONSTRAINT conversations_lead_id_fkey
FOREIGN KEY (lead_id) REFERENCES uag_lead_purchases(id) ON DELETE SET NULL;
```

**Step 2: 只修正 RLS Pending 邏輯（安全）**
```sql
DROP POLICY IF EXISTS "conversations_consumer_select" ON conversations;

CREATE POLICY "conversations_consumer_select" ON conversations
  FOR SELECT
  TO authenticated
  USING (
    consumer_profile_id = auth.uid()
    OR
    (
      status = 'pending'
      AND (
        consumer_session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
        OR
        consumer_session_id = current_setting('app.session_id', true)
      )
    )
  );
```

**Step 3: agent_id 類型轉換（破壞性，需確認無資料或資料格式正確）**
- ⚠️ 只在確認以下條件後執行：
  - `SELECT COUNT(*) FROM conversations;` 返回 0
  - 或所有 `agent_id` 都是有效的 UUID 格式

### 方案 B: 如果資料庫是空的
- 可以直接執行完整的 `20251231_004_fix_messaging_critical_issues.sql`

### 方案 C: 如果已有資料且 agent_id 不是 UUID
- 需要先修改應用層代碼，確保新資料使用 UUID
- 使用 `ALTER TABLE ... USING` 語法轉換

---

## 🔙 回滾方案

如果執行後發現問題，使用 `ROLLBACK_20251231_004.sql`

---

## 📝 執行記錄

請在執行後填寫：

- [ ] 執行日期：_____________
- [ ] 執行人員：_____________
- [ ] 備份檔案：_____________
- [ ] 執行結果：成功 / 失敗 / 部分成功
- [ ] 遇到的問題：_____________
- [ ] 解決方式：_____________

---

## ⚠️ 重要提醒

**此 migration 已經 push 到 main branch (commit 66b1449f)**

如果 Supabase 設定為自動執行 migration，可能已經執行。請立即檢查：
```sql
SELECT * FROM supabase_migrations.schema_migrations
WHERE version = '20251231_004_fix_messaging_critical_issues';
```

如果已執行且發生問題，立即執行 ROLLBACK。
