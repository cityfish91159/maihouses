-- ============================================================================
-- Ticket #12-B: Fix MH-100001 agent seed metrics for production profile display
-- ============================================================================

UPDATE public.agents
SET
  service_rating = 4.8,
  review_count = 32,
  completed_cases = 45,
  encouragement_count = 156,
  joined_at = NOW() - INTERVAL '4 years'
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Recompute trust score deterministically from the current formula.
-- IMPORTANT: 此 migration 依賴 fn_calculate_trust_score 函數
-- 請確保在執行此 migration 前，該函數已部署
-- （通常由 agents table trigger 自動創建）
UPDATE public.agents
SET trust_score = public.fn_calculate_trust_score(id)
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
