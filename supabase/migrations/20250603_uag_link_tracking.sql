-- ==============================================================================
-- UAG v8.4 Link Tracking Enhancement
-- 新增: source, listing_id, search_query 欄位追蹤用戶來源
-- ==============================================================================

-- 1. 為 uag_events 增加來源追蹤欄位
ALTER TABLE public.uag_events 
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS listing_id TEXT,
  ADD COLUMN IF NOT EXISTS search_query TEXT,
  ADD COLUMN IF NOT EXISTS share_id TEXT;

-- 建立索引以便快速查詢來源分析
CREATE INDEX IF NOT EXISTS idx_events_source ON public.uag_events (source);
CREATE INDEX IF NOT EXISTS idx_events_listing_id ON public.uag_events (listing_id);

-- 2. 更新 RPC 函數以處理新欄位
CREATE OR REPLACE FUNCTION public.track_uag_event_v8_2(
  p_session_id TEXT,
  p_agent_id TEXT DEFAULT 'unknown',
  p_fingerprint TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property_id TEXT;
  v_district TEXT;
  v_duration INTEGER;
  v_actions JSONB;
  v_focus TEXT[];
  v_source TEXT;
  v_listing_id TEXT;
  v_search_query TEXT;
  v_share_id TEXT;
  v_session_summary JSONB;
  v_total_duration INTEGER;
  v_property_count INTEGER;
  v_revisits INTEGER;
  v_district_count INTEGER;
  v_grade CHAR(1);
  v_grade_reason TEXT;
  v_lead_score INTEGER;
BEGIN
  -- 解析事件數據
  v_property_id := p_event_data->>'property_id';
  v_district := COALESCE(p_event_data->>'district', 'unknown');
  v_duration := COALESCE((p_event_data->>'duration')::INTEGER, 0);
  v_actions := COALESCE(p_event_data->'actions', '{}'::jsonb);
  v_focus := COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_event_data->'focus')), ARRAY[]::TEXT[]);
  
  -- 新增: 來源追蹤欄位
  v_source := COALESCE(p_event_data->>'entry_ref', p_event_data->>'source', 'direct');
  v_listing_id := p_event_data->>'listing_id';
  v_search_query := p_event_data->>'search_query';
  v_share_id := p_event_data->>'share_id';

  -- 1. UPSERT Session (若不存在則創建)
  INSERT INTO public.uag_sessions (session_id, agent_id, fingerprint, total_duration, property_count, grade, last_active, summary, created_at)
  VALUES (p_session_id, p_agent_id, p_fingerprint, v_duration, 1, 'F', NOW(), '{}'::jsonb, NOW())
  ON CONFLICT (session_id) DO UPDATE SET
    agent_id = COALESCE(EXCLUDED.agent_id, uag_sessions.agent_id),
    fingerprint = COALESCE(EXCLUDED.fingerprint, uag_sessions.fingerprint),
    last_active = NOW();

  -- 2. 插入事件記錄 (包含新欄位)
  INSERT INTO public.uag_events (session_id, agent_id, property_id, district, duration, actions, focus, source, listing_id, search_query, share_id, created_at)
  VALUES (p_session_id, p_agent_id, v_property_id, v_district, v_duration, v_actions, v_focus, v_source, v_listing_id, v_search_query, v_share_id, NOW());

  -- 3. 計算聚合數據 (基於所有事件)
  SELECT 
    COUNT(*) as visits,
    COUNT(DISTINCT property_id) as props,
    COALESCE(MAX(duration), 0) as max_dur,
    (SELECT COUNT(DISTINCT value->>'district') FROM public.uag_events e2, jsonb_each(e2.actions) WHERE e2.session_id = p_session_id AND value->>'district' IS NOT NULL) as dist_count
  INTO v_revisits, v_property_count, v_total_duration, v_district_count
  FROM public.uag_events
  WHERE session_id = p_session_id;

  -- 🔧 修正: revisits = 訪問次數 - 1 (首次不算回訪)
  v_revisits := GREATEST(v_revisits - 1, 0);
  
  -- 🔧 修正: district_count 從 props JSONB 取得 (不是 actions)
  SELECT COUNT(DISTINCT district) INTO v_district_count
  FROM public.uag_events
  WHERE session_id = p_session_id AND district IS NOT NULL AND district != 'unknown';

  -- 4. 計算等級
  v_grade := calculate_lead_grade(v_total_duration, v_actions, v_revisits, v_district_count);
  
  -- 5. 生成等級原因說明
  v_grade_reason := generate_grade_reason(v_grade, v_total_duration, v_actions, v_revisits, v_district_count);
  
  -- 6. 計算分數
  v_lead_score := grade_to_score(v_grade, v_total_duration, v_actions);

  -- 7. 組裝 summary JSONB (包含來源資訊)
  v_session_summary := jsonb_build_object(
    'visits', v_revisits + 1,
    'props', (SELECT jsonb_agg(DISTINCT jsonb_build_object('id', property_id, 'district', district)) FROM public.uag_events WHERE session_id = p_session_id AND property_id IS NOT NULL),
    'max_duration', v_total_duration,
    'click_line', COALESCE((v_actions->>'click_line')::INT, 0),
    'click_call', COALESCE((v_actions->>'click_call')::INT, 0),
    'district_count', v_district_count,
    'source', v_source,
    'listing_id', v_listing_id,
    'search_query', v_search_query
  );

  -- 8. 更新 Session Summary 與等級
  UPDATE public.uag_sessions SET
    total_duration = v_total_duration,
    property_count = v_property_count,
    grade = v_grade,
    summary = v_session_summary
  WHERE session_id = p_session_id;

  -- 返回結果
  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'grade', v_grade,
    'score', v_lead_score,
    'reason', v_grade_reason,
    'source', v_source
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 3. 為舊版 RPC 也增加基本來源支援 (向下兼容)
CREATE OR REPLACE FUNCTION public.track_uag_event_v8(
  p_session_id TEXT,
  p_agent_id TEXT DEFAULT 'unknown',
  p_fingerprint TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property_id TEXT;
  v_district TEXT;
  v_duration INTEGER;
  v_actions JSONB;
  v_focus TEXT[];
  v_source TEXT;
  v_session_summary JSONB;
  v_total_duration INTEGER;
  v_property_count INTEGER;
  v_revisits INTEGER;
  v_district_count INTEGER;
  v_grade CHAR(1);
BEGIN
  -- 解析事件數據
  v_property_id := p_event_data->>'property_id';
  v_district := COALESCE(p_event_data->>'district', 'unknown');
  v_duration := COALESCE((p_event_data->>'duration')::INTEGER, 0);
  v_actions := COALESCE(p_event_data->'actions', '{}'::jsonb);
  v_focus := COALESCE(ARRAY(SELECT jsonb_array_elements_text(p_event_data->'focus')), ARRAY[]::TEXT[]);
  v_source := COALESCE(p_event_data->>'entry_ref', 'direct');

  -- 1. UPSERT Session
  INSERT INTO public.uag_sessions (session_id, agent_id, fingerprint, total_duration, property_count, grade, last_active, summary, created_at)
  VALUES (p_session_id, p_agent_id, p_fingerprint, v_duration, 1, 'F', NOW(), '{}'::jsonb, NOW())
  ON CONFLICT (session_id) DO UPDATE SET
    agent_id = COALESCE(EXCLUDED.agent_id, uag_sessions.agent_id),
    fingerprint = COALESCE(EXCLUDED.fingerprint, uag_sessions.fingerprint),
    last_active = NOW();

  -- 2. 插入事件記錄 (含 source)
  INSERT INTO public.uag_events (session_id, agent_id, property_id, district, duration, actions, focus, source, created_at)
  VALUES (p_session_id, p_agent_id, v_property_id, v_district, v_duration, v_actions, v_focus, v_source, NOW());

  -- 3. 計算聚合數據
  SELECT 
    COUNT(*),
    COUNT(DISTINCT property_id),
    COALESCE(MAX(duration), 0)
  INTO v_revisits, v_property_count, v_total_duration
  FROM public.uag_events
  WHERE session_id = p_session_id;

  -- 修正: revisits = 訪問次數 - 1
  v_revisits := GREATEST(v_revisits - 1, 0);
  
  -- 修正: district_count 從 events 取 DISTINCT
  SELECT COUNT(DISTINCT district) INTO v_district_count
  FROM public.uag_events
  WHERE session_id = p_session_id AND district IS NOT NULL AND district != 'unknown';

  -- 4. 計算等級
  v_grade := calculate_lead_grade(v_total_duration, v_actions, v_revisits, v_district_count);

  -- 5. 組裝 summary
  v_session_summary := jsonb_build_object(
    'visits', v_revisits + 1,
    'props', (SELECT jsonb_agg(DISTINCT jsonb_build_object('id', property_id, 'district', district)) FROM public.uag_events WHERE session_id = p_session_id AND property_id IS NOT NULL),
    'max_duration', v_total_duration,
    'click_line', COALESCE((v_actions->>'click_line')::INT, 0),
    'click_call', COALESCE((v_actions->>'click_call')::INT, 0),
    'district_count', v_district_count,
    'source', v_source
  );

  -- 6. 更新 Session
  UPDATE public.uag_sessions SET
    total_duration = v_total_duration,
    property_count = v_property_count,
    grade = v_grade,
    summary = v_session_summary
  WHERE session_id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'grade', v_grade
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- 4. 來源分析用的 View (方便 Dashboard 查詢)
CREATE OR REPLACE VIEW public.uag_source_analytics AS
SELECT 
  source,
  COUNT(*) as total_views,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT property_id) as properties_viewed,
  AVG(duration)::INTEGER as avg_duration,
  SUM(CASE WHEN (actions->>'click_line')::INT >= 1 THEN 1 ELSE 0 END) as line_clicks,
  SUM(CASE WHEN (actions->>'click_call')::INT >= 1 THEN 1 ELSE 0 END) as call_clicks
FROM public.uag_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY source
ORDER BY total_views DESC;

COMMENT ON TABLE public.uag_events IS 'UAG v8.4 - 增加 source, listing_id, search_query, share_id 欄位';
