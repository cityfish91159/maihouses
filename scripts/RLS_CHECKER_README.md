# RLS Policy Checker

自動檢測 Supabase Migration 的 Row Level Security (RLS) 設定，確保資料庫安全性。

## 功能

1. ✅ 掃描所有 SQL migration 檔案
2. ✅ 檢查所有表是否啟用 RLS
3. ✅ 驗證敏感表的安全政策
4. ✅ 區分「系統內部表」和「用戶存取表」

## 使用方式

### 本地執行

```bash
# 檢查所有 migrations
python scripts/check-rls-policies.py
```

### CI/CD 整合

此檢查器已整合至 GitHub Actions，會在以下情況自動執行：

- 任何 PR 修改 `supabase/migrations/**/*.sql`
- Push 到 main 分支且修改 migration 檔案

## 安全分類

### Service-Role Only 表（系統內部表）

這些表只允許後端 API（使用 service_role key）存取，前端完全無法存取：

- `audit_logs` - 安心留痕稽核日誌
- `uag_audit_logs` - UAG 系統審計日誌
- `uag_archive_log` - UAG 歸檔日誌
- `vapid_keys` - Web Push VAPID 金鑰

**要求：**
```sql
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only"
ON public.your_table FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

### 敏感表（允許用戶存取自己的資料）

這些表包含敏感資料，但允許用戶存取自己的資料：

- `transactions` - 交易紀錄
- `uag_lead_purchases` - 客戶購買紀錄
- `push_subscriptions` - 推播訂閱

**要求：**
```sql
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己的資料
CREATE POLICY "users_view_own_data"
ON public.your_table FOR SELECT TO authenticated
USING (user_id = auth.uid()::text);

-- service_role 完全存取
CREATE POLICY "service_role_full_access"
ON public.your_table FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

## 檢查報告範例

### 通過檢查

```
[RLS Policy Check Report]
===============================================
Total migrations scanned: 79
Total tables found: 34
Service-role only tables: 4
Sensitive tables with user access: 3

PASS: All tables have correct RLS policies
PASS: All sensitive tables are properly protected

Service-role only tables: audit_logs, uag_audit_logs, uag_archive_log, vapid_keys
Sensitive tables with user access: transactions, uag_lead_purchases, push_subscriptions
```

### 發現違規

```
[RLS Policy Check Report]
===============================================
Total migrations scanned: 79
Total tables found: 34
Service-role only tables: 4
Sensitive tables with user access: 3

FAIL: RLS Policy Violations Found:

FILE: 20251231_001_uag_schema_setup.sql
  WARNING: Table 'uag_lead_purchases': RLS not enabled
  WARNING: Table 'uag_audit_logs': RLS not enabled

Total violations: 2

WARNING: Please fix RLS policies before merging
Reference: docs/property-detail-trust-ui-optimization.md
```

## 修復違規

### 問題 1: RLS 未啟用

**錯誤：**
```sql
CREATE TABLE public.my_table (
  id UUID PRIMARY KEY,
  data TEXT
);
-- ❌ 缺少 RLS 啟用
```

**修復：**
```sql
CREATE TABLE public.my_table (
  id UUID PRIMARY KEY,
  data TEXT
);

-- ✅ 啟用 RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- ✅ 設定政策
CREATE POLICY "service_role_only"
ON public.my_table FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

### 問題 2: 系統內部表允許用戶存取

**錯誤：**
```sql
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ❌ 審計日誌不應允許用戶存取
CREATE POLICY "users_can_read"
ON public.audit_logs FOR SELECT TO authenticated
USING (true);
```

**修復：**
```sql
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ✅ 只允許 service_role 存取
CREATE POLICY "service_role_only"
ON public.audit_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

## 參考文件

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [專案文件：property-detail-trust-ui-optimization.md](../docs/property-detail-trust-ui-optimization.md)
- [Migration 最佳實踐](../supabase/migrations/MIGRATION_STATUS.md)

## 技術細節

### 檢測邏輯

1. **表名提取**：使用正則表達式匹配 `CREATE TABLE` 語句
2. **RLS 檢查**：搜尋 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
3. **政策驗證**：檢查 `CREATE POLICY` 語句的目標角色

### 支援的 SQL 格式

- ✅ `CREATE TABLE public.my_table`
- ✅ `CREATE TABLE IF NOT EXISTS my_table`
- ✅ `ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY`
- ✅ `CREATE POLICY "name" ON public.my_table FOR ALL TO service_role`

### 跳過的檔案

- `DEPLOY_INSTRUCTIONS.md`
- `MIGRATION_STATUS.md`
- `DIAGNOSE_406.sql`
- `ROLLBACK_*.sql`

## 貢獻指南

如需新增敏感表監控：

1. 編輯 `scripts/check-rls-policies.py`
2. 將表名加入 `SERVICE_ROLE_ONLY_TABLES` 或 `SENSITIVE_TABLES_WITH_USER_ACCESS`
3. 執行測試確認檢測正確
4. 提交 PR

## 常見問題

### Q: 為什麼 push_subscriptions 不算違規？

A: push_subscriptions 允許用戶管理自己的推播訂閱，這是合理的設計。只要有正確的 RLS 政策（`profile_id = auth.uid()`），就符合安全要求。

### Q: 如何處理後來才啟用 RLS 的表？

A: 如果表在建立時未啟用 RLS，但後續 migration 有啟用，檢查器會標記第一個 migration 為違規。建議在同一個 migration 中同時建立表和啟用 RLS。

### Q: 檢查器會阻止 PR 合併嗎？

A: 是的。如果檢測到違規，CI/CD 會失敗，並在 PR 中自動留言說明問題。

## 授權

本腳本為 MaiHouses 專案內部工具，遵循專案授權條款。
