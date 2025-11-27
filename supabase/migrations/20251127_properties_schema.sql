-- ==============================================================================
-- Properties & Agents Schema (For Property Detail & Upload Pages)
-- ==============================================================================

-- 1. Agents Table (經紀人資料)
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    internal_code SERIAL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    company TEXT,
    trust_score INTEGER DEFAULT 80,
    encouragement_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public agents are viewable by everyone" 
ON public.agents FOR SELECT USING (true);

-- 2. Properties Table (房源資料)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    public_id TEXT UNIQUE NOT NULL, -- e.g. 'MH-100001'
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    images TEXT[] DEFAULT '{}',
    
    -- Source Info
    source_platform TEXT DEFAULT 'MH', -- 'MH' or '591'
    source_external_id TEXT,
    
    -- Relations
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public properties are viewable by everyone" 
ON public.properties FOR SELECT USING (true);

CREATE POLICY "Anyone can insert properties (Demo Purpose)" 
ON public.properties FOR INSERT WITH CHECK (true);

-- 3. Seed Data (預設資料，確保與前端預設值一致)
-- 先插入預設經紀人
INSERT INTO public.agents (id, name, avatar_url, company, trust_score, encouragement_count)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '王小明', 'https://picsum.photos/200', '邁房子信義店', 92, 156)
ON CONFLICT (id) DO NOTHING;

-- 再插入預設房源 (MH-100001)
INSERT INTO public.properties (
    public_id, 
    title, 
    price, 
    address, 
    description, 
    images, 
    agent_id
) VALUES (
    'MH-100001',
    '信義區101景觀全新裝潢大三房',
    3680,
    '台北市信義區',
    '這是一間位於信義區的優質好房，擁有絕佳的101景觀...',
    ARRAY['https://images.unsplash.com/photo-1600596542815-27b88e54e6d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
)
ON CONFLICT (public_id) DO NOTHING;
