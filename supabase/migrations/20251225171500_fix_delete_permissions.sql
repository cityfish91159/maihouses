-- 20251225171500_fix_delete_permissions.sql

-- 1. Reset Policies for Shadow Logs
-- We drop existing policies to avoid "policy already exists" errors or conflicts
DROP POLICY IF EXISTS "Enable Delete for All" ON shadow_logs;
DROP POLICY IF EXISTS "Enable Delete for All Logs" ON shadow_logs;
DROP POLICY IF EXISTS "Enable Insert for All" ON shadow_logs;
DROP POLICY IF EXISTS "Enable Select for All" ON shadow_logs;

-- Re-apply Full Access (MVP Mode)
CREATE POLICY "Enable Read for All" ON shadow_logs FOR SELECT USING (true);
CREATE POLICY "Enable Insert for All" ON shadow_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Delete for All" ON shadow_logs FOR DELETE USING (true);


-- 2. Reset Policies for Rival Decoder
DROP POLICY IF EXISTS "Enable Delete for All" ON rival_decoder;
DROP POLICY IF EXISTS "Enable Delete for All Rivals" ON rival_decoder;

CREATE POLICY "Enable Read for All" ON rival_decoder FOR SELECT USING (true);
CREATE POLICY "Enable Insert for All" ON rival_decoder FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Delete for All" ON rival_decoder FOR DELETE USING (true);

-- 3. Verify RLS is enabled (Safety)
ALTER TABLE shadow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rival_decoder ENABLE ROW LEVEL SECURITY;
