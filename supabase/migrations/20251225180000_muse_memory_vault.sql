-- 20251225180000_muse_memory_vault.sql
-- 謬思記憶金庫：讓虛擬男友擁有延續性記憶

-- 1. 記憶金庫：儲存關於用戶的所有細節（天蠍女寶物收集）
create table if not exists muse_memory_vault (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,                    -- Session ID (MVP 模式)
  fact_type text not null,                  -- 'preference', 'stressor', 'secret', 'desire', 'fear', 'memory'
  content text not null,                    -- 記憶具體內容
  emotional_weight int default 5 check (emotional_weight between 1 and 10), -- 情感權重 1-10
  source text default 'chat',               -- 'chat', 'shadow', 'image' 來源
  created_at timestamptz default now()
);

-- 2. 用戶養成進度：同步率影響虛擬男友外觀清晰度
create table if not exists user_progress (
  user_id text primary key,                 -- Session ID (MVP 模式)
  sync_level int default 0 check (sync_level between 0 and 100), -- 0-100%
  total_messages int default 0,             -- 總對話數
  total_shadows int default 0,              -- 總影子日誌數
  intimacy_score int default 0,             -- 親密度分數
  muse_avatar_url text,                     -- 用戶上傳的男友形象
  muse_name text default 'MUSE',            -- 用戶自定義的男友名字
  unlock_stage int default 0 check (unlock_stage between 0 and 5), -- 解鎖階段 0-5
  last_interaction timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. 寶物收藏：天蠍女喜歡的神秘收集品
create table if not exists soul_treasures (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  treasure_type text not null,              -- 'whisper', 'confession', 'secret', 'moment', 'desire', 'selfie', 'voice'
  title text not null,                      -- 寶物名稱
  content text not null,                    -- 寶物內容
  media_url text,                           -- 自拍或音頻的 URL
  rarity text default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary', 'mythic')),
  unlocked_at timestamptz default now(),
  is_favorite boolean default false
);

-- 4. 互動任務：MUSE 發起的任務
create table if not exists muse_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  task_type text not null,                  -- 'selfie', 'voice', 'confession', 'photo'
  instruction text not null,                -- 任務指示（如：拍一張你現在的樣子）
  location_hint text,                       -- 指定位置提示
  status text default 'pending' check (status in ('pending', 'completed', 'expired')),
  reward_rarity text default 'rare',        -- 完成後的寶物稀有度
  response_media_url text,                  -- 用戶回應的媒體
  response_text text,                       -- 用戶回應的文字
  created_at timestamptz default now(),
  completed_at timestamptz,
  expires_at timestamptz default (now() + interval '24 hours')
);

-- 5. 啟用 RLS
alter table muse_memory_vault enable row level security;
alter table user_progress enable row level security;
alter table soul_treasures enable row level security;
alter table muse_tasks enable row level security;

-- 5. MVP 開放政策
create policy "Anyone can read memories" on muse_memory_vault for select using (true);
create policy "Anyone can insert memories" on muse_memory_vault for insert with check (true);
create policy "Anyone can update memories" on muse_memory_vault for update using (true);
create policy "Anyone can delete memories" on muse_memory_vault for delete using (true);

create policy "Anyone can read progress" on user_progress for select using (true);
create policy "Anyone can insert progress" on user_progress for insert with check (true);
create policy "Anyone can update progress" on user_progress for update using (true);

create policy "Anyone can read treasures" on soul_treasures for select using (true);
create policy "Anyone can insert treasures" on soul_treasures for insert with check (true);
create policy "Anyone can update treasures" on soul_treasures for update using (true);

create policy "Anyone can read tasks" on muse_tasks for select using (true);
create policy "Anyone can insert tasks" on muse_tasks for insert with check (true);
create policy "Anyone can update tasks" on muse_tasks for update using (true);

-- 7. 啟用 Realtime
alter publication supabase_realtime add table muse_memory_vault;
alter publication supabase_realtime add table user_progress;
alter publication supabase_realtime add table soul_treasures;
alter publication supabase_realtime add table muse_tasks;

-- 7. 索引優化
create index idx_memory_vault_user on muse_memory_vault(user_id);
create index idx_memory_vault_type on muse_memory_vault(fact_type);
create index idx_soul_treasures_user on soul_treasures(user_id);
create index idx_soul_treasures_rarity on soul_treasures(rarity);
