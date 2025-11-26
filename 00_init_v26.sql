-- ============================================
-- 邁房子安心留痕 V26 - Database Schema (Final)
-- ============================================

-- 1. 基礎擴充
create extension if not exists "uuid-ossp";

-- 2. 建立交易主表
DROP TABLE IF EXISTS public.trust_transactions CASCADE;
CREATE TABLE public.trust_transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  case_name text not null,
  agent_id uuid references auth.users(id) not null,
  agent_name text,
  
  guest_token uuid default uuid_generate_v4() not null,
  token_expires_at timestamptz default (now() + interval '30 days'),
  
  current_step int default 1 check (current_step >= 1 and current_step <= 6),
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  
  -- V26: Array 結構 JSONB
  steps_data jsonb default '[
    {"step": 1, "name": "已電聯", "done": false, "confirmed": false, "date": null, "note": ""},
    {"step": 2, "name": "已帶看", "done": false, "confirmed": false, "date": null, "note": ""},
    {"step": 3, "name": "已出價", "done": false, "confirmed": false, "date": null, "note": ""},
    {"step": 4, "name": "已斡旋", "done": false, "confirmed": false, "date": null, "note": ""},
    {"step": 5, "name": "已成交", "done": false, "confirmed": false, "date": null, "note": ""},
    {"step": 6, "name": "已交屋", "done": false, "confirmed": false, "date": null, "note": ""}
  ]'::jsonb
);

-- 3. Trigger: 自動更新 updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trust_updated_at on public.trust_transactions;
create trigger trust_updated_at
  before update on public.trust_transactions
  for each row
  execute function update_updated_at();

-- 4. RPC: 安全讀取函數 (Stable, 回傳 token_expires_at)
drop function if exists get_trust_room_by_token(uuid, uuid);
create or replace function get_trust_room_by_token(p_id uuid, p_token uuid)
returns table (
  id uuid,
  case_name text,
  agent_name text,
  current_step int,
  steps_data jsonb,
  status text,
  created_at timestamptz,
  token_expires_at timestamptz
)
language sql
security definer
stable
as $$
  select 
    id, case_name, agent_name, current_step, steps_data, status, created_at, token_expires_at
  from public.trust_transactions
  where id = p_id 
    and guest_token = p_token
    and token_expires_at > now()
    and status = 'active';
$$;

-- 5. RPC: 消費者確認函數 (V26 安全版)
drop function if exists confirm_trust_step(uuid, uuid, int);
create or replace function confirm_trust_step(p_id uuid, p_token uuid, p_step int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_tx record;
  v_step_obj jsonb;
  v_step_done boolean;
  v_step_confirmed boolean;
begin
  -- 驗證 token
  select * into v_tx
  from public.trust_transactions
  where id = p_id 
    and guest_token = p_token
    and token_expires_at > now()
    and status = 'active';
    
  if not found then
    return jsonb_build_object('success', false, 'error', '連結無效或已過期');
  end if;
  
  -- 找到對應步驟
  select obj into v_step_obj
  from jsonb_array_elements(v_tx.steps_data) obj
  where (obj->>'step')::int = p_step;
  
  if v_step_obj is null then
    return jsonb_build_object('success', false, 'error', '步驟不存在');
  end if;
  
  v_step_done := coalesce((v_step_obj->>'done')::boolean, false);
  v_step_confirmed := coalesce((v_step_obj->>'confirmed')::boolean, false);
  
  if not v_step_done then
    return jsonb_build_object('success', false, 'error', '此步驟尚未完成，無法確認');
  end if;
  
  if v_step_confirmed then
    return jsonb_build_object('success', false, 'error', '此步驟已經確認過');
  end if;
  
  -- 更新狀態 (確保陣列順序)
  update public.trust_transactions
  set steps_data = (
    select jsonb_agg(
      case when (obj->>'step')::int = p_step
        then obj || jsonb_build_object(
          'confirmed', true, 
          'confirmedAt', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        )
        else obj
      end
      order by (obj->>'step')::int asc
    )
    from jsonb_array_elements(v_tx.steps_data) obj
  )
  where id = p_id;
  
  return jsonb_build_object('success', true);
end;
$$;

-- 6. RLS 權限設定
alter table public.trust_transactions enable row level security;

drop policy if exists "Agent full access" on public.trust_transactions;
create policy "Agent full access" 
  on public.trust_transactions 
  for all 
  to authenticated 
  using (auth.uid() = agent_id);

-- 開放 RPC 給匿名用戶 (消費者)
grant execute on function get_trust_room_by_token to anon, authenticated;
grant execute on function confirm_trust_step to anon, authenticated;

-- 7. Realtime 啟用
begin;
  -- 嘗試新增 table 到 publication，若已存在則忽略錯誤
  do $$
  begin
    if not exists (select 1 from pg_publication_tables where tablename = 'trust_transactions') then
      alter publication supabase_realtime add table public.trust_transactions;
    end if;
  exception when others then
    null;
  end $$;
commit;

-- 8. 索引
create index if not exists idx_trust_token on public.trust_transactions(guest_token) where status = 'active';
create index if not exists idx_trust_agent on public.trust_transactions(agent_id);
