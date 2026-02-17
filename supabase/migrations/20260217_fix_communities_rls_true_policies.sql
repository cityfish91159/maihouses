-- ============================================================================
-- Fix: communities RLS overly permissive policies
-- Issue: "Authenticated users can create communities" used WITH CHECK (true)
-- Also tightens update policy that used USING (true)
-- ============================================================================

BEGIN;

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.communities;
CREATE POLICY "Authenticated users can create communities"
ON public.communities
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('agent', 'official', 'admin')
  )
);

DROP POLICY IF EXISTS "Authenticated users can update communities" ON public.communities;
CREATE POLICY "Authenticated users can update communities"
ON public.communities
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('agent', 'official', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('agent', 'official', 'admin')
  )
);

REVOKE INSERT, UPDATE ON TABLE public.communities FROM anon;
GRANT INSERT, UPDATE ON TABLE public.communities TO authenticated;

COMMIT;

