-- =============================================================================
-- Migration: Fix featured-reviews source labels (remove runtime patch dependency)
-- Purpose:
-- 1. Normalize test community name in source table `public.communities`
-- 2. Keep `public.properties.community_name` in sync for the same community
-- =============================================================================

DO $$
DECLARE
  target_community_id UUID := '6959a167-1e23-4409-9c54-8475960a1d61';
  normalized_name TEXT := U&'\660E\6E56\6C34\5CB8';
BEGIN
  -- Step 1: Normalize community source name (idempotent)
  UPDATE public.communities
  SET name = normalized_name
  WHERE id = target_community_id
    AND name IS DISTINCT FROM normalized_name;

  -- Step 2: Sync denormalized column if it exists (idempotent + fail-safe)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'community_name'
  ) THEN
    UPDATE public.properties
    SET community_name = normalized_name
    WHERE community_id = target_community_id
      AND community_name IS DISTINCT FROM normalized_name;
  END IF;
END $$;
