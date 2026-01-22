-- ============================================================================
-- BE-5 修復：trust_case_events.step 約束調整
-- DEPENDS ON: 20260119_trust_cases_schema.sql (trust_case_events exists)
--
-- WHY: logNotificationFailure 需要使用 step=0 記錄系統事件
--      原 CHECK (step BETWEEN 1 AND 6) 會導致 INSERT 失敗
--
-- 修正：step 範圍由 1-6 改為 0-6
-- ============================================================================

ALTER TABLE public.trust_case_events
DROP CONSTRAINT IF EXISTS trust_case_events_step_check;

ALTER TABLE public.trust_case_events
ADD CONSTRAINT trust_case_events_step_check CHECK (step BETWEEN 0 AND 6);

COMMENT ON COLUMN public.trust_case_events.step
IS '步驟編號: 0=系統事件, 1=M1接觸, 2=M2帶看, 3=M3出價, 4=M4斡旋, 5=M5成交, 6=M6交屋';
