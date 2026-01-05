-- =============================================================================
-- UAG-8: 自動刷新設定 (pg_cron Scheduled Jobs)
-- Migration: 20260105_uag_8_pg_cron_setup.sql
-- =============================================================================

-- =============================================================================
-- [CRITICAL GUARD] 依賴性檢查
-- =============================================================================
DO $$ 
BEGIN 
    -- 1. 檢查 pg_cron extension 是否已啟用
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE EXCEPTION '❌ CRITICAL ERROR: Extension "pg_cron" not enabled. Please enable it in Supabase Dashboard > Database > Extensions first.';
    END IF;

    -- 2. 檢查物化視圖存在
    IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'uag_lead_rankings') THEN
        RAISE EXCEPTION '❌ CRITICAL ERROR: Materialized view "uag_lead_rankings" missing. Please run 20251230_uag_tracking_v8.sql first.';
    END IF;

    -- 3. 檢查歸檔函數存在
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'archive_old_history') THEN
        RAISE EXCEPTION '❌ CRITICAL ERROR: Function "archive_old_history" missing. Please run 20251230_uag_tracking_v8.sql first.';
    END IF;
    
    RAISE NOTICE '✅ All dependencies verified. Proceeding with pg_cron setup...';
END $$;

-- =============================================================================
-- [Job 1] 物化視圖自動刷新 - 每 5 分鐘
-- =============================================================================
-- 先移除舊的排程（如果存在），確保冪等性
SELECT cron.unschedule('refresh-uag-rankings') 
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-uag-rankings');

-- 建立新排程
SELECT cron.schedule(
    'refresh-uag-rankings',           -- Job 名稱
    '*/5 * * * *',                    -- Cron 表達式：每 5 分鐘
    'REFRESH MATERIALIZED VIEW CONCURRENTLY public.uag_lead_rankings;'
);

-- =============================================================================
-- [Job 2] 事件自動歸檔 - 每小時整點
-- =============================================================================
-- 先移除舊的排程（如果存在）
SELECT cron.unschedule('archive-uag-events')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'archive-uag-events');

-- 建立新排程
SELECT cron.schedule(
    'archive-uag-events',             -- Job 名稱
    '0 * * * *',                       -- Cron 表達式：每小時整點
    'SELECT public.archive_old_history();'
);

-- =============================================================================
-- [Job 3] 歸檔日誌記錄 - 每天午夜 (可選)
-- =============================================================================
-- 建立歸檔日誌表（如果不存在）
CREATE TABLE IF NOT EXISTS public.uag_archive_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    events_archived INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立唯一索引避免重複記錄
CREATE UNIQUE INDEX IF NOT EXISTS idx_uag_archive_log_date 
ON public.uag_archive_log(date);

-- 先移除舊的排程（如果存在）
SELECT cron.unschedule('log-uag-stats')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'log-uag-stats');

-- 建立新排程
SELECT cron.schedule(
    'log-uag-stats',                   -- Job 名稱
    '0 0 * * *',                        -- Cron 表達式：每天午夜
    $$
        INSERT INTO public.uag_archive_log (date, events_archived)
        SELECT
            CURRENT_DATE - 1,
            COUNT(*)
        FROM public.uag_events_archive
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
          AND created_at < CURRENT_DATE
        ON CONFLICT (date) DO UPDATE SET events_archived = EXCLUDED.events_archived;
    $$
);

-- =============================================================================
-- [驗證] 確認排程已建立
-- =============================================================================
DO $$
DECLARE
    v_job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_job_count
    FROM cron.job
    WHERE jobname IN ('refresh-uag-rankings', 'archive-uag-events', 'log-uag-stats');
    
    IF v_job_count < 3 THEN
        RAISE WARNING '⚠️ Expected 3 jobs but found %. Please verify cron.job table.', v_job_count;
    ELSE
        RAISE NOTICE '✅ UAG-8 Setup Complete: % cron jobs configured.', v_job_count;
    END IF;
END $$;

-- =============================================================================
-- 完成
-- =============================================================================
