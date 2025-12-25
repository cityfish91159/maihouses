-- 20251225160000_fix_godview_realtime.sql

-- 1. 啟用 Realtime 監聽 (必要的！否則 GodView 不會動)
-- 將資料表加入 supabase_realtime 發布清單
alter publication supabase_realtime add table shadow_logs;
alter publication supabase_realtime add table rival_decoder;

-- 2. 設定 Replica Identity 為 Full (確保 delete/update 事件也能完整傳送，雖然目前只用 insert)
alter table shadow_logs replica identity full;
alter table rival_decoder replica identity full;

-- 3. 開放 God View 讀取權限 (MVP 專用)
-- 之前只有 Admin 可以讀取，但現在因為沒有做登入頁面，我們開放 Public Read 以便您能立刻看到資料。
drop policy if exists "Admins View All Logs" on shadow_logs;
create policy "Public View Logs" on shadow_logs for select using (true);

drop policy if exists "Admins View Rivals" on rival_decoder;
drop policy if exists "Users can view own decoder results" on rival_decoder;
create policy "Public View Rivals" on rival_decoder for select using (true);
