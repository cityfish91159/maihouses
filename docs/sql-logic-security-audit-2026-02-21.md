# SQL 邏輯與安全優化報告（2026-02-21）

## 1. 審查範圍

- 掃描檔案：專案內全部 `.sql`，共 97 檔。
- 審查路徑：
- `supabase/migrations/*.sql`
- `supabase/scripts/*.sql`
- `scripts/*.sql`
- `.test/*.sql`
- 主要檢查項目：
- RLS policy 是否過度寬鬆
- `SECURITY DEFINER` 函數權限是否最小化
- View 是否使用 `security_invoker = true`
- 函數是否存在併發一致性問題

## 2. 已完成的修正

本次已新增兩個 migration：
- `supabase/migrations/20260221170000_sql_logic_security_hardening_followup.sql`
- `supabase/migrations/20260221174000_p0_rls_ownership_failsafe_fix.sql`

### 2.1 函數與權限補強（21170000）

- 強化 `public.toggle_like(UUID)`：
- 未登入拒絕（`auth.uid()` 必須存在）
- 使用 `FOR UPDATE` 避免併發覆寫
- 設定 `search_path = public, pg_temp`
- 收斂函數執行權限：
- `toggle_like(UUID)` 僅授權 `authenticated`、`service_role`
- `get_my_audit_logs(integer)` 僅授權 `authenticated`、`service_role`
- 內部 helper function（sanitizer/trigger/recalc）撤銷 `PUBLIC` execute
- 補強 `intimate_stats`：
- 設為 `security_invoker = true`
- 撤銷 `PUBLIC`、`anon` 查詢權限
- 僅保留 `authenticated`、`service_role` 查詢

### 2.2 P0 RLS 與 fail-safe 補強（21174000）

- 以下高風險表改為 `UPDATE/DELETE` 僅允許「本人或管理者（admin/official）」：
- `intimate_sessions`
- `muse_memory_vault`
- `muse_tasks`
- `sexual_preferences`
- `shadow_logs`
- `soul_treasures`
- `rival_decoder`
- `godview_messages`：
- 移除 fail-open 的 `SELECT/UPDATE/DELETE` 政策
- 改為 authenticated 的「本人或管理者」
- service role 保留專用查詢政策
- `shadow_logs`：
- 移除 fail-open `SELECT`
- 改為 authenticated 的「本人或管理者」
- service role 保留專用查詢政策
- `properties`：
- 改為明確 `properties_select_public` 公開讀取政策
- 不再依賴合併流程中的 fallback 行為

## 3. 目前仍需注意的點

- 部分表的 `INSERT` 仍為匿名或寬鬆策略（為現有前端匿名流程保留），此為產品行為取捨，不在本次 P0 直接封鎖。
- 本次為 migration 檔案層級修正，尚未在實際 Supabase 環境執行與驗證；部署後仍需做 smoke test。

## 4. 建議驗證清單（部署後）

1. 以一般使用者測試：只能更新/刪除自己的資料。
2. 以管理者測試：可處理目標使用者資料。
3. 以匿名狀態測試：不得讀取 `shadow_logs` 與 `godview_messages`。
4. 驗證 `toggle_like` 快速連點下的 likes 數值一致性。
5. 驗證既有 Muse/管理後台流程是否符合新政策。

## 5. 變更檔案

- `supabase/migrations/20260221170000_sql_logic_security_hardening_followup.sql`
- `supabase/migrations/20260221174000_p0_rls_ownership_failsafe_fix.sql`
- `docs/sql-logic-security-audit-2026-02-21.md`
