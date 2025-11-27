-- ==============================================================================
-- Fix: Enable RLS on migration_logs table
-- Issue: Table public.migration_logs is public, but RLS has not been enabled.
-- ==============================================================================

-- 1. Enable Row Level Security
-- This effectively hides the table from the public API (anon/authenticated)
-- unless specific policies are added. Service role can still access it.
ALTER TABLE IF EXISTS public.migration_logs ENABLE ROW LEVEL SECURITY;
