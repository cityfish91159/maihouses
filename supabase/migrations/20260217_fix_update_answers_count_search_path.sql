-- ============================================================================
-- Fix: Function search_path mutable warning
-- Issue: public.update_answers_count has no fixed search_path
-- ============================================================================

ALTER FUNCTION public.update_answers_count()
  SET search_path = public;
