-- Supabase Security & RLS Setup
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uag_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uag_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uag_events ENABLE ROW LEVEL SECURITY;

-- 2. Users Policies
-- Users can view their own profile
CREATE POLICY "Users view own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- 3. Leads Policies
-- Everyone can see 'new' leads (public marketplace)
CREATE POLICY "View new leads" ON public.leads
FOR SELECT USING (status = 'new');

-- Users can see leads they purchased
CREATE POLICY "View purchased leads" ON public.leads
FOR SELECT USING (purchased_by = auth.uid());

-- No one can update leads directly (must use RPC)
CREATE POLICY "No direct lead updates" ON public.leads
FOR UPDATE USING (false);

-- 4. Listings Policies
-- Agents can view their own listings
CREATE POLICY "Agents view own listings" ON public.listings
FOR SELECT USING (agent_id = auth.uid());

-- Public can view listings (if you have a public flag, add it here)
-- Assuming all listings are public for now:
CREATE POLICY "Public view listings" ON public.listings
FOR SELECT USING (true);

-- Agents can update their own listings
CREATE POLICY "Agents update own listings" ON public.listings
FOR UPDATE USING (agent_id = auth.uid());

-- Agents can insert their own listings
CREATE POLICY "Agents insert own listings" ON public.listings
FOR INSERT WITH CHECK (agent_id = auth.uid());

-- 5. Feed Policies
-- Everyone can view the feed
CREATE POLICY "Public view feed" ON public.feed
FOR SELECT USING (true);

-- Only admin/service role can insert/update feed (default deny for others)

-- 6. UAG Tracking Policies
-- Allow anonymous inserts for tracking events
CREATE POLICY "Allow anonymous tracking insert" ON public.uag_events
FOR INSERT WITH CHECK (true);

-- Only authenticated users can read their own events (or admins)
CREATE POLICY "Read own events" ON public.uag_events
FOR SELECT USING (auth.uid()::text = user_id);

-- 7. UAG Sessions & Logs
CREATE POLICY "Insert sessions" ON public.uag_sessions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Insert logs" ON public.uag_event_logs
FOR INSERT WITH CHECK (true);

-- Service role only for reading raw logs (analytics dashboard)
CREATE POLICY "Service role read logs" ON public.uag_event_logs
FOR SELECT USING (auth.role() = 'service_role');
