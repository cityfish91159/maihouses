-- 20251225150000_muse_godview.sql

-- 1. 核心表： profiles 用於權限管理
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  role text default 'user' check (role in ('user', 'admin'))
);

-- 2. 影子日誌：紀錄輸入猶豫 (Hesitation Tracking)
create table if not exists shadow_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  content text not null, -- 加密後的 Base64
  hesitation_count int default 0,
  mode text check (mode in ('day', 'night')),
  created_at timestamptz default now()
);

-- 3. 競爭者解碼：影像診斷報告
create table if not exists rival_decoder (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  image_url text not null,
  analysis_report jsonb not null,
  risk_score int check (risk_score between 1 and 100),
  created_at timestamptz default now()
);

-- 4. RLS 政策：僅管理員可讀取所有資料
alter table shadow_logs enable row level security;
alter table rival_decoder enable row level security;
alter table profiles enable row level security;

-- Profiles: Users can view their own profile, Admins can view all
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on profiles
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Shadow Logs: Users can insert their own logs. Only Admins can select (view) all.
create policy "Users can insert own logs" on shadow_logs
  for insert with check (auth.uid() = user_id);

create policy "Admins View All Logs" on shadow_logs
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Rival Decoder: Users can insert their own reports. Users can view their own. Admins can view all.
create policy "Users can insert own decoder results" on rival_decoder
  for insert with check (auth.uid() = user_id);

create policy "Users can view own decoder results" on rival_decoder
  for select using (auth.uid() = user_id);

create policy "Admins View Rivals" on rival_decoder
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
