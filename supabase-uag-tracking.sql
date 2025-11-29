-- ==============================================================================
-- UAG v8.0 Ultimate Optimization Schema
-- Implements: Normalized Events, Session Summary, Materialized Views, Archiving
-- ==============================================================================

-- 1. UAG Sessions (Summary Table - Hot Data)
-- Replaces the old uag_sessions table. 
-- If migrating, you might need to drop the old one or rename it.
DROP TABLE IF EXISTS public.uag_sessions CASCADE;
CREATE TABLE public.uag_sessions (
    session_id TEXT PRIMARY KEY,
    agent_id TEXT,
    total_duration INTEGER DEFAULT 0,
    property_count INTEGER DEFAULT 0,
    grade CHAR(1) DEFAULT 'F',
    last_active TIMESTAMPTZ DEFAULT NOW(),
    summary JSONB DEFAULT '{}'::jsonb, -- Stores aggregated stats like district counts, strong signals
    fingerprint TEXT, -- For session recovery
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grade_time ON public.uag_sessions (grade, last_active DESC);
CREATE INDEX idx_session_fingerprint ON public.uag_sessions (fingerprint);
CREATE INDEX idx_session_agent ON public.uag_sessions (agent_id);

-- 2. UAG Events (Normalized Event Log - Hot Data)
DROP TABLE IF EXISTS public.uag_events CASCADE;
CREATE TABLE public.uag_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES public.uag_sessions(session_id) ON DELETE CASCADE,
    agent_id TEXT,
    property_id TEXT,
    district TEXT,
    duration INTEGER DEFAULT 0,
    actions JSONB DEFAULT '{}'::jsonb,
    focus TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_time ON public.uag_events (session_id, created_at DESC);
CREATE INDEX idx_property_agent ON public.uag_events (property_id, agent_id);
CREATE INDEX idx_events_created_at ON public.uag_events (created_at);

-- 3. UAG Events Archive (Cold Storage)
CREATE TABLE IF NOT EXISTS public.uag_events_archive (
    LIKE public.uag_events INCLUDING ALL
);

-- 4. Materialized View for Fast Filtering (Rankings)
DROP MATERIALIZED VIEW IF EXISTS public.uag_lead_rankings;
CREATE MATERIALIZED VIEW public.uag_lead_rankings AS
SELECT 
  session_id,
  agent_id,
  grade,
  last_active,
  CASE 
    WHEN last_active > NOW() - INTERVAL '3 hours' THEN 'HOT'
    WHEN last_active > NOW() - INTERVAL '24 hours' THEN 'WARM'
    ELSE 'COLD'
  END as temperature,
  ROW_NUMBER() OVER (
    PARTITION BY agent_id 
    ORDER BY 
      CASE grade 
        WHEN 'S' THEN 1 
        WHEN 'A' THEN 2 
        WHEN 'B' THEN 3 
        WHEN 'C' THEN 4 
        ELSE 5 
      END,
      last_active DESC
  ) as rank
FROM public.uag_sessions
WHERE grade IN ('S', 'A', 'B') -- Only rank valuable leads
WITH DATA;

CREATE INDEX idx_lead_ranking ON public.uag_lead_rankings(agent_id, grade, rank);

-- 5. PL/pgSQL Function: Calculate Lead Grade
CREATE OR REPLACE FUNCTION calculate_lead_grade(
  p_duration INTEGER,
  p_actions JSONB,
  p_revisits INTEGER,
  p_district_count INTEGER,
  p_competitor_duration INTEGER DEFAULT 0
) RETURNS CHAR(1) AS $$
BEGIN
  -- S Grade: Strong Signal + (Long Duration OR Competitor Heavy User)
  IF (p_actions->>'click_line' = '1' OR p_actions->>'click_call' = '1') THEN
     IF p_duration >= 120 OR p_competitor_duration >= 300 THEN
        RETURN 'S';
     END IF;
  END IF;
  
  -- A Grade
  IF p_duration >= 90 AND (p_actions->>'scroll_depth')::INT >= 80 THEN
    RETURN 'A';
  END IF;
  IF p_competitor_duration >= 180 AND p_duration >= 10 THEN
    RETURN 'A';
  END IF;
  
  -- B Grade (with District Bonus)
  IF p_duration >= 60 OR (p_revisits >= 2 AND p_duration >= 30) THEN
    IF p_district_count >= 3 THEN
      RETURN 'A'; -- Bonus B->A
    END IF;
    RETURN 'B';
  END IF;
  
  -- C Grade (with District Bonus)
  IF p_duration >= 20 THEN
    IF p_district_count >= 3 THEN
      RETURN 'B'; -- Bonus C->B
    END IF;
    RETURN 'C';
  END IF;
  
  RETURN 'F';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. PL/pgSQL Function: Archive Old History
CREATE OR REPLACE FUNCTION archive_old_history()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Move events older than 3 hours to archive
    WITH archived AS (
      INSERT INTO public.uag_events_archive 
      SELECT * FROM public.uag_events 
      WHERE created_at < NOW() - INTERVAL '3 hours'
      RETURNING id
    ),
    deleted AS (
      DELETE FROM public.uag_events 
      WHERE id IN (SELECT id FROM archived)
      RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM deleted;
    
    RETURN v_count;
END;
$$;

-- 7. RPC: Track Event & Incremental Update (The Core Logic)
-- v8.1 優化: 使用累加更新避免全表掃描，只在關鍵節點計算等級
CREATE OR REPLACE FUNCTION track_uag_event_v8(
  p_session_id TEXT,
  p_agent_id TEXT,
  p_fingerprint TEXT,
  p_event_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session public.uag_sessions%ROWTYPE;
    v_new_summary JSONB;
    v_new_total_duration INTEGER;
    v_new_grade CHAR(1);
    v_current_grade CHAR(1);
    v_district TEXT;
    v_pid TEXT;
    v_duration INTEGER;
    v_actions JSONB;
    v_district_count INTEGER;
    v_revisits INTEGER;
    v_competitor_duration INTEGER;
    v_property_duration INTEGER;
    v_should_calculate BOOLEAN := FALSE;
BEGIN
    -- Extract event data
    v_pid := p_event_data->>'property_id';
    v_district := p_event_data->>'district';
    v_duration := COALESCE((p_event_data->>'duration')::INTEGER, 0);
    v_actions := COALESCE(p_event_data->'actions', '{}'::jsonb);

    -- 1. Upsert Session (Ensure it exists)
    INSERT INTO public.uag_sessions (session_id, agent_id, fingerprint, last_active, total_duration, summary)
    VALUES (p_session_id, p_agent_id, p_fingerprint, NOW(), 0, '{}'::jsonb)
    ON CONFLICT (session_id) DO UPDATE SET
        last_active = NOW(),
        agent_id = COALESCE(NULLIF(p_agent_id, 'unknown'), public.uag_sessions.agent_id),
        fingerprint = COALESCE(p_fingerprint, public.uag_sessions.fingerprint)
    RETURNING * INTO v_session;
    
    v_current_grade := COALESCE(v_session.grade, 'F');

    -- 2. Insert Event
    INSERT INTO public.uag_events (session_id, agent_id, property_id, district, duration, actions, focus)
    VALUES (p_session_id, p_agent_id, v_pid, v_district, v_duration, v_actions, 
            ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_event_data->'focus', '[]'::jsonb))));

    -- 3. 🚀 優化核心：直接用 UPDATE 累加，避免 SELECT SUM() 全表掃描
    v_new_summary := COALESCE(v_session.summary, '{}'::jsonb);
    
    -- 更新 district_counts (原地累加)
    IF v_district IS NOT NULL AND v_district != 'unknown' THEN
        v_new_summary := jsonb_set(
            v_new_summary, 
            ARRAY['district_counts', v_district], 
            to_jsonb(COALESCE((v_new_summary->'district_counts'->>v_district)::INT, 0) + 1)
        );
    END IF;
    
    -- 更新 property 停留時間 (原地累加)
    IF v_pid IS NOT NULL THEN
        v_new_summary := jsonb_set(
            v_new_summary,
            ARRAY['props', v_pid, 'duration'],
            to_jsonb(COALESCE((v_new_summary->'props'->v_pid->>'duration')::INT, 0) + v_duration)
        );
        v_new_summary := jsonb_set(
            v_new_summary,
            ARRAY['props', v_pid, 'visits'],
            to_jsonb(COALESCE((v_new_summary->'props'->v_pid->>'visits')::INT, 0) + 1)
        );
    END IF;
    
    -- 記錄強信號
    IF (v_actions->>'click_line')::INT > 0 THEN
        v_new_summary := jsonb_set(v_new_summary, ARRAY['signals', 'click_line'], 'true'::jsonb);
    END IF;
    IF (v_actions->>'click_call')::INT > 0 THEN
        v_new_summary := jsonb_set(v_new_summary, ARRAY['signals', 'click_call'], 'true'::jsonb);
    END IF;

    -- 累加總時長
    v_new_total_duration := COALESCE(v_session.total_duration, 0) + v_duration;

    -- 4. 判斷是否需要重新計算等級 (只在關鍵節點計算，避免每次都跑)
    -- 條件：觸發強信號 / 累計時長超過閾值 / 當前等級較低
    IF (v_actions->>'click_line')::INT > 0 OR (v_actions->>'click_call')::INT > 0 THEN
        v_should_calculate := TRUE;
    ELSIF v_new_total_duration >= 20 AND v_current_grade = 'F' THEN
        v_should_calculate := TRUE;
    ELSIF v_new_total_duration >= 60 AND v_current_grade IN ('F', 'C') THEN
        v_should_calculate := TRUE;
    ELSIF v_new_total_duration >= 90 AND v_current_grade IN ('F', 'C', 'B') THEN
        v_should_calculate := TRUE;
    END IF;

    -- 5. 計算等級 (只在需要時執行)
    IF v_should_calculate THEN
        -- 從 summary 快速取得數據，避免掃描 events 表
        v_property_duration := COALESCE((v_new_summary->'props'->v_pid->>'duration')::INT, v_duration);
        v_revisits := COALESCE((v_new_summary->'props'->v_pid->>'visits')::INT, 1);
        v_district_count := COALESCE(jsonb_object_keys_count(v_new_summary->'district_counts'), 1);
        
        -- 計算同區競品時長 (從 summary 快速估算)
        SELECT COALESCE(SUM((value->>'duration')::INT), 0) - v_property_duration
        INTO v_competitor_duration
        FROM jsonb_each(v_new_summary->'props') 
        WHERE key != v_pid;
        
        v_new_grade := calculate_lead_grade(
            v_property_duration,
            v_actions,
            v_revisits,
            v_district_count,
            GREATEST(v_competitor_duration, 0)
        );
    ELSE
        v_new_grade := v_current_grade;
    END IF;

    -- 6. 更新 Session (等級只升不降)
    UPDATE public.uag_sessions
    SET 
        total_duration = v_new_total_duration,
        property_count = COALESCE(jsonb_object_keys_count(v_new_summary->'props'), 1),
        summary = v_new_summary,
        last_active = NOW()
    WHERE session_id = p_session_id;
    
    -- 等級升級檢查 (S=5, A=4, B=3, C=2, F=1)
    UPDATE public.uag_sessions
    SET grade = v_new_grade
    WHERE session_id = p_session_id 
      AND (
        CASE grade WHEN 'S' THEN 5 WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 ELSE 1 END
      ) < (
        CASE v_new_grade WHEN 'S' THEN 5 WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 ELSE 1 END
      );

    -- 取得最終等級
    SELECT grade INTO v_new_grade FROM public.uag_sessions WHERE session_id = p_session_id;

    RETURN jsonb_build_object('success', true, 'grade', v_new_grade);
END;
$$;

-- 輔助函數：計算 JSONB 物件的 key 數量
CREATE OR REPLACE FUNCTION jsonb_object_keys_count(j JSONB)
RETURNS INTEGER AS $$
BEGIN
    IF j IS NULL OR jsonb_typeof(j) != 'object' THEN
        RETURN 0;
    END IF;
    RETURN (SELECT COUNT(*) FROM jsonb_object_keys(j));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==============================================================================
-- UAG v8.2 業務導向升級
-- 新增: lead_score 連續分數、grade_reason 人話描述、entry_ref 流量來源
-- ==============================================================================

-- 8. 升級 uag_sessions 表 (新增欄位)
-- 執行前請先確認表已存在
DO $$ 
BEGIN
    -- 新增 lead_score 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'uag_sessions' AND column_name = 'lead_score') THEN
        ALTER TABLE public.uag_sessions ADD COLUMN lead_score INTEGER DEFAULT 10;
    END IF;
    
    -- 新增 grade_reason 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'uag_sessions' AND column_name = 'grade_reason') THEN
        ALTER TABLE public.uag_sessions ADD COLUMN grade_reason TEXT DEFAULT '';
    END IF;
    
    -- 新增 entry_ref 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'uag_sessions' AND column_name = 'entry_ref') THEN
        ALTER TABLE public.uag_sessions ADD COLUMN entry_ref TEXT DEFAULT 'direct';
    END IF;
    
    -- 新增 share_id 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'uag_sessions' AND column_name = 'share_id') THEN
        ALTER TABLE public.uag_sessions ADD COLUMN share_id TEXT;
    END IF;
END $$;

-- 9. 新增欄位到 uag_events
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'uag_events' AND column_name = 'entry_ref') THEN
        ALTER TABLE public.uag_events ADD COLUMN entry_ref TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'uag_events' AND column_name = 'share_id') THEN
        ALTER TABLE public.uag_events ADD COLUMN share_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'uag_events' AND column_name = 'event_type') THEN
        ALTER TABLE public.uag_events ADD COLUMN event_type TEXT DEFAULT 'view';
    END IF;
END $$;

-- 10. 產生等級人話描述的函數
CREATE OR REPLACE FUNCTION generate_grade_reason(
    p_grade CHAR(1),
    p_duration INTEGER,
    p_click_line BOOLEAN,
    p_click_call BOOLEAN,
    p_district_count INTEGER,
    p_revisits INTEGER,
    p_scroll_depth INTEGER,
    p_district TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    v_reason TEXT := '';
BEGIN
    CASE p_grade
        WHEN 'S' THEN
            IF p_click_line THEN
                v_reason := '點擊 LINE';
            ELSIF p_click_call THEN
                v_reason := '點擊電話';
            END IF;
            
            IF p_duration >= 120 THEN
                v_reason := v_reason || ' + 深度瀏覽 ' || (p_duration / 60) || ' 分鐘';
            END IF;
            
            IF p_district_count >= 3 THEN
                v_reason := v_reason || ' + 同區比較 ' || p_district_count || ' 間';
            END IF;
            
        WHEN 'A' THEN
            IF p_duration >= 90 AND p_scroll_depth >= 80 THEN
                v_reason := '深度瀏覽 ' || (p_duration / 60) || ' 分鐘，捲動 ' || p_scroll_depth || '%';
            ELSIF p_district_count >= 3 THEN
                v_reason := '同區比較 ' || p_district_count || ' 間物件';
            ELSE
                v_reason := '高度興趣行為';
            END IF;
            
        WHEN 'B' THEN
            IF p_revisits >= 2 THEN
                v_reason := '回訪 ' || p_revisits || ' 次';
            END IF;
            v_reason := v_reason || CASE WHEN v_reason != '' THEN '，' ELSE '' END;
            v_reason := v_reason || '停留 ' || p_duration || ' 秒';
            
        WHEN 'C' THEN
            v_reason := '初步瀏覽 ' || p_duration || ' 秒';
            
        ELSE
            v_reason := '快速略過';
    END CASE;
    
    -- 加上區域資訊
    IF p_district IS NOT NULL AND p_district != 'unknown' AND p_district != '' THEN
        v_reason := '【' || p_district || '】' || v_reason;
    END IF;
    
    RETURN v_reason;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 11. 等級轉分數函數
CREATE OR REPLACE FUNCTION grade_to_score(
    p_grade CHAR(1),
    p_district_count INTEGER DEFAULT 1,
    p_revisits INTEGER DEFAULT 1,
    p_click_map BOOLEAN DEFAULT FALSE
) RETURNS INTEGER AS $$
DECLARE
    v_base_score INTEGER;
    v_bonus INTEGER := 0;
BEGIN
    -- 基礎分數
    v_base_score := CASE p_grade
        WHEN 'S' THEN 90
        WHEN 'A' THEN 75
        WHEN 'B' THEN 55
        WHEN 'C' THEN 30
        ELSE 10
    END;
    
    -- 加分項
    IF p_district_count >= 5 THEN
        v_bonus := v_bonus + 5;
    ELSIF p_district_count >= 3 THEN
        v_bonus := v_bonus + 3;
    END IF;
    
    IF p_revisits >= 3 THEN
        v_bonus := v_bonus + 5;
    ELSIF p_revisits >= 2 THEN
        v_bonus := v_bonus + 2;
    END IF;
    
    IF p_click_map THEN
        v_bonus := v_bonus + 2;
    END IF;
    
    RETURN LEAST(v_base_score + v_bonus, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 12. 升級版 Track RPC v8.2 (含 reason + score)
CREATE OR REPLACE FUNCTION track_uag_event_v8_2(
  p_session_id TEXT,
  p_agent_id TEXT,
  p_fingerprint TEXT,
  p_event_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session public.uag_sessions%ROWTYPE;
    v_new_summary JSONB;
    v_new_total_duration INTEGER;
    v_new_grade CHAR(1);
    v_new_score INTEGER;
    v_new_reason TEXT;
    v_current_grade CHAR(1);
    v_district TEXT;
    v_pid TEXT;
    v_duration INTEGER;
    v_actions JSONB;
    v_district_count INTEGER;
    v_revisits INTEGER;
    v_competitor_duration INTEGER;
    v_property_duration INTEGER;
    v_should_calculate BOOLEAN := FALSE;
    v_entry_ref TEXT;
    v_share_id TEXT;
    v_event_type TEXT;
    v_scroll_depth INTEGER;
BEGIN
    -- Extract event data
    v_pid := p_event_data->>'property_id';
    v_district := p_event_data->>'district';
    v_duration := COALESCE((p_event_data->>'duration')::INTEGER, 0);
    v_actions := COALESCE(p_event_data->'actions', '{}'::jsonb);
    v_entry_ref := COALESCE(p_event_data->>'entry_ref', 'direct');
    v_share_id := p_event_data->>'share_id';
    v_event_type := COALESCE(p_event_data->>'type', 'view');
    v_scroll_depth := COALESCE((v_actions->>'scroll_depth')::INTEGER, 0);

    -- 1. Upsert Session
    INSERT INTO public.uag_sessions (
        session_id, agent_id, fingerprint, last_active, total_duration, 
        summary, entry_ref, share_id
    )
    VALUES (
        p_session_id, p_agent_id, p_fingerprint, NOW(), 0, 
        '{}'::jsonb, v_entry_ref, v_share_id
    )
    ON CONFLICT (session_id) DO UPDATE SET
        last_active = NOW(),
        agent_id = COALESCE(NULLIF(p_agent_id, 'unknown'), public.uag_sessions.agent_id),
        fingerprint = COALESCE(p_fingerprint, public.uag_sessions.fingerprint),
        entry_ref = COALESCE(NULLIF(public.uag_sessions.entry_ref, 'direct'), v_entry_ref)
    RETURNING * INTO v_session;
    
    v_current_grade := COALESCE(v_session.grade, 'F');

    -- 2. Insert Event
    INSERT INTO public.uag_events (
        session_id, agent_id, property_id, district, duration, 
        actions, focus, entry_ref, share_id, event_type
    )
    VALUES (
        p_session_id, p_agent_id, v_pid, v_district, v_duration, 
        v_actions, 
        ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_event_data->'focus', '[]'::jsonb))),
        v_entry_ref, v_share_id, v_event_type
    );

    -- 3. 累加 Summary
    v_new_summary := COALESCE(v_session.summary, '{}'::jsonb);
    
    IF v_district IS NOT NULL AND v_district != 'unknown' THEN
        v_new_summary := jsonb_set(
            v_new_summary, 
            ARRAY['district_counts', v_district], 
            to_jsonb(COALESCE((v_new_summary->'district_counts'->>v_district)::INT, 0) + 1)
        );
    END IF;
    
    IF v_pid IS NOT NULL THEN
        v_new_summary := jsonb_set(
            v_new_summary,
            ARRAY['props', v_pid, 'duration'],
            to_jsonb(COALESCE((v_new_summary->'props'->v_pid->>'duration')::INT, 0) + v_duration)
        );
        v_new_summary := jsonb_set(
            v_new_summary,
            ARRAY['props', v_pid, 'visits'],
            to_jsonb(COALESCE((v_new_summary->'props'->v_pid->>'visits')::INT, 0) + 1)
        );
        v_new_summary := jsonb_set(
            v_new_summary,
            ARRAY['props', v_pid, 'district'],
            to_jsonb(v_district)
        );
    END IF;
    
    -- 記錄強信號
    IF (v_actions->>'click_line')::INT > 0 THEN
        v_new_summary := jsonb_set(v_new_summary, ARRAY['signals', 'click_line'], 'true'::jsonb);
    END IF;
    IF (v_actions->>'click_call')::INT > 0 THEN
        v_new_summary := jsonb_set(v_new_summary, ARRAY['signals', 'click_call'], 'true'::jsonb);
    END IF;
    IF (v_actions->>'click_map')::INT > 0 THEN
        v_new_summary := jsonb_set(v_new_summary, ARRAY['signals', 'click_map'], 'true'::jsonb);
    END IF;

    v_new_total_duration := COALESCE(v_session.total_duration, 0) + v_duration;

    -- 4. 判斷是否需要計算等級
    IF (v_actions->>'click_line')::INT > 0 OR (v_actions->>'click_call')::INT > 0 THEN
        v_should_calculate := TRUE;
    ELSIF v_event_type = 'page_exit' AND v_duration > 0 THEN
        v_should_calculate := TRUE;
    ELSIF v_new_total_duration >= 20 AND v_current_grade = 'F' THEN
        v_should_calculate := TRUE;
    ELSIF v_new_total_duration >= 60 AND v_current_grade IN ('F', 'C') THEN
        v_should_calculate := TRUE;
    ELSIF v_new_total_duration >= 90 AND v_current_grade IN ('F', 'C', 'B') THEN
        v_should_calculate := TRUE;
    END IF;

    -- 5. 計算等級
    IF v_should_calculate THEN
        v_property_duration := COALESCE((v_new_summary->'props'->v_pid->>'duration')::INT, v_duration);
        v_revisits := COALESCE((v_new_summary->'props'->v_pid->>'visits')::INT, 1);
        v_district_count := COALESCE(jsonb_object_keys_count(v_new_summary->'district_counts'), 1);
        
        SELECT COALESCE(SUM((value->>'duration')::INT), 0) - v_property_duration
        INTO v_competitor_duration
        FROM jsonb_each(v_new_summary->'props') 
        WHERE key != v_pid;
        
        v_new_grade := calculate_lead_grade(
            v_property_duration,
            v_actions,
            v_revisits,
            v_district_count,
            GREATEST(v_competitor_duration, 0)
        );
        
        -- 產生人話描述
        v_new_reason := generate_grade_reason(
            v_new_grade,
            v_property_duration,
            COALESCE((v_new_summary->'signals'->>'click_line')::BOOLEAN, FALSE),
            COALESCE((v_new_summary->'signals'->>'click_call')::BOOLEAN, FALSE),
            v_district_count,
            v_revisits,
            v_scroll_depth,
            v_district
        );
        
        -- 計算分數
        v_new_score := grade_to_score(
            v_new_grade,
            v_district_count,
            v_revisits,
            COALESCE((v_new_summary->'signals'->>'click_map')::BOOLEAN, FALSE)
        );
    ELSE
        v_new_grade := v_current_grade;
        v_new_score := COALESCE(v_session.lead_score, 10);
        v_new_reason := COALESCE(v_session.grade_reason, '');
    END IF;

    -- 6. 更新 Session
    UPDATE public.uag_sessions
    SET 
        total_duration = v_new_total_duration,
        property_count = COALESCE(jsonb_object_keys_count(v_new_summary->'props'), 1),
        summary = v_new_summary,
        last_active = NOW()
    WHERE session_id = p_session_id;
    
    -- 等級升級 + 更新 reason/score
    UPDATE public.uag_sessions
    SET 
        grade = v_new_grade,
        lead_score = v_new_score,
        grade_reason = v_new_reason
    WHERE session_id = p_session_id 
      AND (
        CASE grade WHEN 'S' THEN 5 WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 ELSE 1 END
      ) < (
        CASE v_new_grade WHEN 'S' THEN 5 WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 ELSE 1 END
      );

    -- 取得最終結果
    SELECT grade, lead_score, grade_reason 
    INTO v_new_grade, v_new_score, v_new_reason 
    FROM public.uag_sessions WHERE session_id = p_session_id;

    RETURN jsonb_build_object(
        'success', true, 
        'grade', v_new_grade,
        'score', v_new_score,
        'reason', v_new_reason
    );
END;
$$;
