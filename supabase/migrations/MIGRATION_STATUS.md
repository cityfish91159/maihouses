# Migration 執行狀態追蹤

最後確認：2026-02-22

## 已執行（經 DB 查詢確認）

| 檔案                                           | 內容                                            | 狀態      |
| ---------------------------------------------- | ----------------------------------------------- | --------- |
| `20260119_trust_cases_schema.sql`              | trust_cases 表 + RPC                            | ✅        |
| `20260120_trust_cases_agent_id_constraint.sql` | agent_id 約束                                   | ✅        |
| `20260122_add_trust_enabled.sql`               | trust_enabled 欄位                              | ✅        |
| `20260122_add_case_token.sql`                  | token 欄位                                      | ✅        |
| `20260122_add_case_token_final.sql`            | token 欄位（最終版）                            | ✅        |
| `20260122_add_case_buyer.sql`                  | buyer_user_id/buyer_line_id                     | ✅        |
| `20260122_add_case_status.sql`                 | DB-2 dormant_at/closed_at/closed_reason + CHECK | ✅        |
| `20260122_trust_phase1_optimization.sql`       | DB-1~4 索引/ENUM/CHECK                          | ✅        |
| `20260122_uag_archive_log_rls.sql`             | RLS 修復                                        | ✅        |
| `20260122_uag_lead_purchases_rls.sql`          | RLS 修復                                        | ✅        |
| `20260122_wp4_vapid_vault_rpc.sql`             | fn_get_vapid_private_key                        | ✅        |
| `20260122_create_property_with_review_rpc.sql` | fn_create_property_with_review                  | ✅        |
| `20260129_create_audit_logs.sql`               | audit_logs 表 + 基礎 RLS                        | ✅        |
| `20260130_agent_profile_extension.sql`         | agents 擴充 + agent-avatars bucket/RLS + trust score RPC/trigger | ✅        |
| `20260129_fix_audit_logs_rls.sql`              | audit_logs RLS 強化 + status/error 欄位         | ⚠️ 待執行 |
| `20260129_uag_audit_logs_sanitizer.sql`        | UAG audit logs 敏感資料脫敏 (40→95/100)         | ⚠️ 待執行 |

## 待確認/執行

| 檔案                                         | 內容                                    | 狀態      |
| -------------------------------------------- | --------------------------------------- | --------- |
| `20260122_be5_step_constraint_fix.sql`       | step 約束允許 0                         | ⚠️ 待確認 |
| `20260122_be5_create_case_hash_fix.sql`      | fn_create_trust_case hash 修復          | ⚠️ 待確認 |
| `20260122_be5_update_step_return_old.sql`    | fn_update_trust_case_step 回傳 old_step | ⚠️ 待確認 |
| `20260122_push_subscriptions_fail_count.sql` | BE-8 fail_count 欄位                    | ⚠️ 待確認 |

## 新增待執行（2026-02-22 P0 安全收斂）

| 檔案                                                  | 內容                                                | 狀態      |
| ----------------------------------------------------- | --------------------------------------------------- | --------- |
| `20260222201000_p0_harden_public_insert_policies.sql` | `shadow_logs` / `rival_decoder` INSERT policy 收斂 | ⚠️ 待執行 |
| `20260222202000_p0_harden_security_definer_boundaries.sql` | `get_property_stats_optimized` 權限與 search_path 收斂 | ⚠️ 待執行 |
| `20260222_sql_audit_40_p0_security_verification.sql` | P0 安全驗證（read-only）                            | ⚠️ 待執行 |

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

-- 檢查 UAG audit logs 脫敏機制
SELECT proname FROM pg_proc WHERE proname = 'sanitize_audit_log_data';
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_sanitize_uag_audit_logs_before_insert';
SELECT viewname FROM pg_views WHERE viewname = 'uag_audit_logs_safe';
```
