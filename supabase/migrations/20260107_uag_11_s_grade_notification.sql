-- ==============================================================================
-- UAG-11: S 級推播 - 資料庫觸發器與通知機制
-- 功能：當客戶升級到 S 級時，記錄事件並支援 Realtime 推播
-- ==============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. 創建 S 級升級事件記錄表（用於審計和分析）
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.uag_s_grade_upgrades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES public.uag_sessions(session_id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    previous_grade CHAR(1) NOT NULL,
    upgraded_at TIMESTAMPTZ DEFAULT NOW(),
    notified BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引：快速查詢房仲的 S 級升級記錄
CREATE INDEX IF NOT EXISTS idx_s_upgrades_agent ON public.uag_s_grade_upgrades (agent_id, upgraded_at DESC);

-- 索引：查詢未通知的升級事件
CREATE INDEX IF NOT EXISTS idx_s_upgrades_notified ON public.uag_s_grade_upgrades (notified, upgraded_at DESC) WHERE notified = false;

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. 觸發器函數：記錄 S 級升級事件
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION fn_log_s_grade_upgrade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 只有當 grade 變更為 'S' 且之前不是 'S' 時才記錄
    IF NEW.grade = 'S' AND (OLD.grade IS NULL OR OLD.grade != 'S') THEN
        INSERT INTO public.uag_s_grade_upgrades (
            session_id,
            agent_id,
            previous_grade,
            upgraded_at
        ) VALUES (
            NEW.session_id,
            NEW.agent_id,
            COALESCE(OLD.grade, 'F'), -- 如果是新記錄，預設為 F
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. 創建觸發器：監聽 uag_sessions.grade 更新
-- ══════════════════════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS trg_log_s_grade_upgrade ON public.uag_sessions;

CREATE TRIGGER trg_log_s_grade_upgrade
    AFTER UPDATE OF grade ON public.uag_sessions
    FOR EACH ROW
    WHEN (NEW.grade = 'S' AND (OLD.grade IS NULL OR OLD.grade != 'S'))
    EXECUTE FUNCTION fn_log_s_grade_upgrade();

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. RPC 函數：標記通知已發送
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION mark_s_upgrade_notified(p_session_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.uag_s_grade_upgrades
    SET notified = true,
        notification_sent_at = NOW()
    WHERE session_id = p_session_id
      AND notified = false;

    RETURN FOUND;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. RPC 函數：查詢房仲的 S 級升級記錄
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_s_grade_upgrades(p_agent_id TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    session_id TEXT,
    previous_grade CHAR(1),
    upgraded_at TIMESTAMPTZ,
    notified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.session_id,
        u.previous_grade,
        u.upgraded_at,
        u.notified
    FROM public.uag_s_grade_upgrades u
    WHERE u.agent_id = p_agent_id
    ORDER BY u.upgraded_at DESC
    LIMIT p_limit;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. Row Level Security (RLS) 政策
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.uag_s_grade_upgrades ENABLE ROW LEVEL SECURITY;

-- 允許房仲查詢自己的 S 級升級記錄
CREATE POLICY "Agent can read own S upgrades" ON public.uag_s_grade_upgrades
    FOR SELECT TO authenticated
    USING (agent_id = auth.uid()::text);

-- 系統可以插入（由觸發器執行）
CREATE POLICY "System can insert S upgrades" ON public.uag_s_grade_upgrades
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 系統可以更新（標記已通知）
CREATE POLICY "System can update notification status" ON public.uag_s_grade_upgrades
    FOR UPDATE TO authenticated
    USING (agent_id = auth.uid()::text);

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. 授權：允許認證用戶調用 RPC 函數
-- ══════════════════════════════════════════════════════════════════════════════
GRANT EXECUTE ON FUNCTION mark_s_upgrade_notified(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_s_grade_upgrades(TEXT, INTEGER) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. 註解說明
-- ══════════════════════════════════════════════════════════════════════════════
COMMENT ON TABLE public.uag_s_grade_upgrades IS
'UAG-11: S 級升級事件記錄表
- 記錄所有客戶升級到 S 級的事件
- 追蹤通知發送狀態
- 支援 Supabase Realtime 即時推播';

COMMENT ON FUNCTION fn_log_s_grade_upgrade() IS
'UAG-11: S 級升級觸發器函數
- 當 uag_sessions.grade 變更為 S 時自動記錄
- 只記錄首次升級（避免重複）';

COMMENT ON FUNCTION mark_s_upgrade_notified(TEXT) IS
'UAG-11: 標記 S 級升級通知已發送
- 前端調用以標記已推播
- 防止重複通知';

COMMENT ON FUNCTION get_s_grade_upgrades(TEXT, INTEGER) IS
'UAG-11: 查詢房仲的 S 級升級記錄
- 用於 UAG Dashboard 顯示歷史記錄
- 依時間倒序排列';

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. 驗證觸發器（測試用，可選）
-- ══════════════════════════════════════════════════════════════════════════════
-- 模擬更新測試（在 psql 中執行）:
-- UPDATE public.uag_sessions SET grade = 'S' WHERE session_id = 'test-session-123';
-- SELECT * FROM public.uag_s_grade_upgrades WHERE session_id = 'test-session-123';
