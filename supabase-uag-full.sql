-- ==============================================================================
-- UAG Full Stack Schema (Users, Leads, Listings, Feed, RPC)
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    points INTEGER DEFAULT 1000,
    quota_s INTEGER DEFAULT 0,
    quota_a INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 1.1 Auto-create user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, points, quota_s, quota_a)
  VALUES (NEW.id, NEW.email, 1000, 5, 10);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Leads Table (The radar bubbles)
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY, -- e.g., 'S-5566'
    name TEXT NOT NULL,
    grade TEXT CHECK (grade IN ('S', 'A', 'B', 'C', 'F')),
    intent INTEGER,
    prop TEXT,
    visit INTEGER,
    price INTEGER,
    status TEXT CHECK (status IN ('new', 'purchased')) DEFAULT 'new',
    purchased_at TIMESTAMPTZ,
    purchased_by UUID REFERENCES public.users(id),
    ai TEXT,
    remaining_hours NUMERIC,
    x NUMERIC, -- Radar X position
    y NUMERIC, -- Radar Y position
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- Everyone can see 'new' leads, Users can see their own 'purchased' leads
CREATE POLICY "View leads" ON public.leads FOR SELECT 
USING (status = 'new' OR purchased_by = auth.uid());
CREATE POLICY "No direct update on leads" ON public.leads FOR UPDATE USING (false);

-- 3. Listings Table (My Properties)
CREATE TABLE IF NOT EXISTS public.listings (
    id BIGSERIAL PRIMARY KEY,
    agent_id UUID REFERENCES public.users(id), -- Optional: link to specific agent
    title TEXT NOT NULL,
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    fav_count INTEGER DEFAULT 0,
    thumb_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own listings" ON public.listings FOR SELECT USING (agent_id = auth.uid());

-- 4. Feed Table (Community Wall)
CREATE TABLE IF NOT EXISTS public.feed (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    meta TEXT,
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View feed" ON public.feed FOR SELECT USING (true);

-- ==============================================================================
-- Stored Procedure: Buy Lead Transaction (RPC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION buy_lead_transaction(p_lead_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_lead_price INTEGER;
    v_user_points INTEGER;
    v_user_quota_s INTEGER;
    v_user_quota_a INTEGER;
    v_lead_grade TEXT;
    v_lead_status TEXT;
    v_new_points INTEGER;
    v_new_quota_s INTEGER;
    v_new_quota_a INTEGER;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock lead row for update
    SELECT price, grade, status INTO v_lead_price, v_lead_grade, v_lead_status
    FROM public.leads
    WHERE id = p_lead_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;

    IF v_lead_status <> 'new' THEN
        RAISE EXCEPTION 'Lead already purchased';
    END IF;

    -- Lock user row for update
    SELECT points, quota_s, quota_a INTO v_user_points, v_user_quota_s, v_user_quota_a
    FROM public.users
    WHERE id = v_user_id
    FOR UPDATE;

    IF v_user_points < v_lead_price THEN
        RAISE EXCEPTION 'Insufficient points';
    END IF;

    -- Quota Check
    IF v_lead_grade = 'S' AND v_user_quota_s <= 0 THEN
        RAISE EXCEPTION 'Insufficient S-Grade Quota';
    END IF;
    IF v_lead_grade = 'A' AND v_user_quota_a <= 0 THEN
        RAISE EXCEPTION 'Insufficient A-Grade Quota';
    END IF;

    -- Calculate new values
    v_new_points := v_user_points - v_lead_price;
    v_new_quota_s := CASE WHEN v_lead_grade = 'S' THEN v_user_quota_s - 1 ELSE v_user_quota_s END;
    v_new_quota_a := CASE WHEN v_lead_grade = 'A' THEN v_user_quota_a - 1 ELSE v_user_quota_a END;

    -- Deduct points
    UPDATE public.users
    SET points = v_new_points,
        quota_s = v_new_quota_s,
        quota_a = v_new_quota_a
    WHERE id = v_user_id;

    -- Update lead status
    UPDATE public.leads
    SET status = 'purchased',
        purchased_by = v_user_id,
        purchased_at = NOW(),
        remaining_hours = CASE 
            WHEN v_lead_grade = 'S' THEN 120 
            WHEN v_lead_grade = 'A' THEN 72 
            ELSE 336 
        END
    WHERE id = p_lead_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Transaction completed',
        'new_points', v_new_points,
        'new_quota_s', v_new_quota_s,
        'new_quota_a', v_new_quota_a,
        'purchased_at', NOW()
    );
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_purchased_by ON public.leads(purchased_by);
CREATE INDEX IF NOT EXISTS idx_listings_agent_id ON public.listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_feed_created_at ON public.feed(created_at DESC);

-- ==============================================================================
-- Seed Data (Initial Mock Data for Live DB)
-- ==============================================================================

-- Insert YOUR specific user (ID from screenshot)
INSERT INTO public.users (id, email, points, quota_s, quota_a)
VALUES 
  ('7865f1ae-4c7c-40d6-9956-45ca963baa36', 'cityfish91159@gmail.com', 1280, 2, 3)
ON CONFLICT (id) DO UPDATE 
SET points = EXCLUDED.points; -- Reset points if exists, or do nothing

-- Insert Leads
INSERT INTO public.leads (id, name, grade, intent, prop, visit, price, status, ai, x, y) VALUES
('B218', '買家 B218', 'S', 92, '捷運共構 3 房', 7, 20, 'new', '🔥 強烈建議立即聯繫！', 25, 25),
('A103', '買家 A103', 'S', 88, '惠宇上晴 12F', 12, 20, 'new', '建議立即發送獨家邀約！', 15, 45),
('S901', '買家 S901', 'S', 94, '高樓景觀宅', 9, 20, 'new', '重複詢問同一社區，請電話跟進。', 40, 32),
('S880', '買家 S880', 'S', 90, '預售捷運宅', 8, 20, 'new', '對捷運沿線有強烈偏好。', 60, 40),
('C055', '買家 C055', 'A', 75, '南屯學區宅', 4, 10, 'new', 'A 級學區需求明確。', 60, 20),
('A230', '買家 A230', 'A', 71, '次高樓層 3 房', 3, 10, 'new', '已追蹤兩個以上相似物件。', 70, 30),
('A550', '買家 A550', 'A', 69, '公園首排', 3, 10, 'new', '假日時段瀏覽頻繁。', 50, 15),
('D330', '買家 D330', 'B', 62, '捷運生活圈', 3, 3, 'new', '建議主動聯繫提供車位資訊。', 40, 60),
('B778', '買家 B778', 'B', 58, '小坪數投資宅', 2, 3, 'new', '屬於投資族群，可搭配多案推薦。', 30, 70),
('C021', '買家 C021', 'C', 48, '老屋翻新', 2, 1, 'new', '對低總價物件有興趣。', 75, 55),
('C990', '買家 C990', 'C', 42, '套房', 1, 1, 'new', '瀏覽時間短，建議先以訊息觸及。', 82, 65),
('H009', '買家 H009', 'F', 28, '小坪數', 1, 0.5, 'new', '潛在客戶。', 70, 75),
('F778', '買家 F778', 'F', 22, '套房出租', 1, 0.5, 'new', '互動較少，可作為備選追蹤。', 55, 80)
ON CONFLICT (id) DO NOTHING;

-- Insert Listings
INSERT INTO public.listings (title, tags, view_count, click_count, fav_count, thumb_color) VALUES
('惠宇上晴｜12/15F 視野戶・雙平車', ARRAY['南屯區','近捷運','雙平車'], 1284, 214, 37, '#eef2ff'),
('捷運共構 3 房｜視野棟距佳', ARRAY['捷運共構','次高樓層'], 986, 163, 22, '#f0fdf4'),
('南屯捷運宅｜3房・高樓層', ARRAY['近學區','雙衛浴'], 846, 128, 15, '#fff7ed');

-- Insert Feed
INSERT INTO public.feed (title, meta, body) VALUES
('成交故事｜12F 視野戶為什麼受歡迎', '來自：社區牆・成交故事', '買方看重的是採光、棟距與公設使用率。'),
('住戶心得｜公設使用率與噪音表現', '本週一・互動 41', '晚間 9 點後社區安靜。');
