-- =====================================================
-- 完整診斷 406 錯誤
-- 請執行後把所有結果都貼給我
-- =====================================================

-- 1️⃣ 檢查表是否存在及 RLS 狀態
SELECT '1️⃣ Table Status' as section;
SELECT
  tablename,
  tableowner,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_progress';

-- 2️⃣ 檢查所有 RLS 政策
SELECT '2️⃣ RLS Policies' as section;
SELECT
  policyname,
  cmd as command,
  roles,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'user_progress'
ORDER BY policyname;

-- 3️⃣ 檢查表權限
SELECT '3️⃣ Table Privileges' as section;
SELECT
  grantee as role,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE table_name = 'user_progress'
GROUP BY grantee
ORDER BY grantee;

-- 4️⃣ 檢查表結構
SELECT '4️⃣ Table Columns' as section;
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_progress'
ORDER BY ordinal_position;

-- 5️⃣ 測試查詢（作為 postgres 用戶）
SELECT '5️⃣ Test Query (as postgres)' as section;
SELECT COUNT(*) as total_rows FROM user_progress;

-- 6️⃣ 檢查 anon 角色是否存在
SELECT '6️⃣ Anon Role Check' as section;
SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname = 'anon';

-- 7️⃣ 檢查是否有任何阻止 SELECT 的政策
SELECT '7️⃣ Blocking Policies Check' as section;
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'user_progress'
  AND cmd IN ('SELECT', 'ALL')
ORDER BY policyname;
