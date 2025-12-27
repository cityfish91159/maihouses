-- 20251225170000_godview_delete.sql

-- Enable deletion for everyone (MVP style) or Admins
-- Since we removed strict auth for MVP, we allow public delete for now, 
-- or we can restrict it to the app level.

-- Shadow Logs
create policy "Enable Delete for All" on shadow_logs
for delete using (true);

-- Rival Decoder
create policy "Enable Delete for All" on rival_decoder
for delete using (true);
