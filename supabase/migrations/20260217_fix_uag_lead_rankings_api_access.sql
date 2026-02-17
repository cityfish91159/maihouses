-- ============================================================================
-- Fix: Materialized view exposed to Data API roles
-- Entity: public.uag_lead_rankings
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_matviews
    WHERE schemaname = 'public'
      AND matviewname = 'uag_lead_rankings'
  ) THEN
    -- Block Data API roles from directly querying materialized view
    EXECUTE 'REVOKE ALL ON TABLE public.uag_lead_rankings FROM anon';
    EXECUTE 'REVOKE ALL ON TABLE public.uag_lead_rankings FROM authenticated';
    EXECUTE 'REVOKE ALL ON TABLE public.uag_lead_rankings FROM public';

    -- Keep backend access for trusted server path
    EXECUTE 'GRANT SELECT ON TABLE public.uag_lead_rankings TO service_role';
  END IF;
END $$;

COMMIT;
