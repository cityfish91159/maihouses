-- ============================================================================
-- SQL hardening follow-up (logic + security)
-- Date: 2026-02-21
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Harden community post like RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_like(post_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  actor_id UUID;
  current_liked_by UUID[];
  next_liked_by UUID[];
BEGIN
  actor_id := auth.uid();
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT COALESCE(liked_by, ARRAY[]::UUID[])
  INTO current_liked_by
  FROM public.community_posts
  WHERE id = post_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found: %', post_id;
  END IF;

  IF actor_id = ANY(current_liked_by) THEN
    next_liked_by := array_remove(current_liked_by, actor_id);
  ELSE
    next_liked_by := array_append(current_liked_by, actor_id);
  END IF;

  UPDATE public.community_posts
  SET liked_by = next_liked_by,
      likes_count = cardinality(next_liked_by)
  WHERE id = post_id;

  RETURN json_build_object(
    'liked', actor_id = ANY(next_liked_by),
    'likes_count', cardinality(next_liked_by)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_like(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_like(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_like(UUID) TO service_role;

-- ----------------------------------------------------------------------------
-- 2) Restrict helper SECURITY DEFINER function execution
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regprocedure('public.sanitize_audit_log_data(jsonb)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.sanitize_audit_log_data(jsonb) FROM PUBLIC';
  END IF;

  IF to_regprocedure('public.trigger_sanitize_uag_audit_logs()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.trigger_sanitize_uag_audit_logs() FROM PUBLIC';
  END IF;

  IF to_regprocedure('public.fn_recalc_encouragement_count()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.fn_recalc_encouragement_count() FROM PUBLIC';
  END IF;

  IF to_regprocedure('public.get_my_audit_logs(integer)') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.get_my_audit_logs(integer) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_my_audit_logs(integer) TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_my_audit_logs(integer) TO service_role';
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- 3) Enforce invoker security on sensitive stats view
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.intimate_stats') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.intimate_stats SET (security_invoker = true)';
    EXECUTE 'REVOKE ALL ON TABLE public.intimate_stats FROM PUBLIC, anon';
    EXECUTE 'GRANT SELECT ON TABLE public.intimate_stats TO authenticated, service_role';
  END IF;
END
$$;

COMMIT;
