# Migration 執行狀態追蹤

最後確認：2026-01-22

## 已執行（經 DB 查詢確認）

| 檔案 | 內容 | 狀態 |
|------|------|------|
| `20260119_trust_cases_schema.sql` | trust_cases 表 + RPC | ✅ |
| `20260120_trust_cases_agent_id_constraint.sql` | agent_id 約束 | ✅ |
| `20260122_add_trust_enabled.sql` | trust_enabled 欄位 | ✅ |
| `20260122_add_case_token.sql` | token 欄位 | ✅ |
| `20260122_add_case_token_final.sql` | token 欄位（最終版） | ✅ |
| `20260122_add_case_buyer.sql` | buyer_user_id/buyer_line_id | ✅ |
| `20260122_trust_phase1_optimization.sql` | DB-1~4 索引/ENUM/CHECK | ✅ |
| `20260122_uag_archive_log_rls.sql` | RLS 修復 | ✅ |
| `20260122_uag_lead_purchases_rls.sql` | RLS 修復 | ✅ |
| `20260122_wp4_vapid_vault_rpc.sql` | fn_get_vapid_private_key | ✅ |
| `20260122_create_property_with_review_rpc.sql` | fn_create_property_with_review | ✅ |

## 待執行

無

## 驗證指令

```sql
-- 檢查 trust_cases 欄位
SELECT column_name FROM information_schema.columns
WHERE table_name = 'trust_cases' ORDER BY ordinal_position;

-- 檢查索引
SELECT indexname FROM pg_indexes WHERE tablename = 'trust_cases';

-- 檢查約束
SELECT conname FROM pg_constraint WHERE conrelid = 'public.trust_cases'::regclass;

-- 檢查 RLS
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('uag_archive_log', 'uag_lead_purchases');

-- 檢查 RPC
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'fn_%';
```
