-- 20251225153000_remove_auth_mvp.sql

-- 1. 移除 Foreign Key 外鍵限制 (不再強制 user_id 必須存在於 auth.users)
alter table shadow_logs drop constraint if exists shadow_logs_user_id_fkey;
alter table rival_decoder drop constraint if exists rival_decoder_user_id_fkey;

-- 2. 開放 RLS 政策 (允許匿名訪客寫入)
-- Shadow Logs
drop policy if exists "Users can insert own logs" on shadow_logs;
create policy "Public Insert Logs" on shadow_logs for insert with check (true);

-- Rival Decoder
drop policy if exists "Users can insert own decoder results" on rival_decoder;
create policy "Public Insert Decoder" on rival_decoder for insert with check (true);

-- God View 雖然應該要保護，但為了 MVP 方便測試，我們先允許讀取 (或者您可以維持原狀，僅自己手動改 DB 權限)
-- 這裡僅放寬寫入權限給前台 Muse 使用。
