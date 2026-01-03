-- =============================================================================
-- 驗證腳本草稿: UAG-13 Auto-Conversation 防偷懶檢查
-- 檔案: supabase/tests/UAG-13_verification.sql
-- =============================================================================
-- 此腳本用於在實作前後執行，證明功能符合規格且無安全漏洞。

BEGIN; -- 開始測試交易 (測試完會 Rollback，不污染 DB)

-- 1. [Setup] 準備測試資料
-- 建立測試用 Agent (UUID)
DO $$
DECLARE
    v_agent_id UUID;
    v_session_id TEXT := 'test-session-' || floor(random()*1000)::text;
    v_purchase_result JSONB;
    v_conversation_id UUID;
    v_lead_id UUID;
BEGIN
    RAISE NOTICE '=== 開始 UAG-13 嚴格驗證 ===';

    -- 假裝我們是某個 Agent
    v_agent_id := '00000000-0000-0000-0000-000000000001'::UUID;
    
    -- 確保 Agent 存在且有點數 (避免餘額不足錯誤)
    INSERT INTO public.agents (id, name, email, points, quota_s)
    VALUES (v_agent_id, 'Test Agent', 'test@agent.com', 1000, 10)
    ON CONFLICT (id) DO UPDATE SET points = 1000;

    -- 建立假 Session (避免 FK 錯誤)
    INSERT INTO public.uag_sessions (session_id, agent_id, fingerprint)
    VALUES (v_session_id, v_agent_id::TEXT, 'base64-fingerprint');
    
    -- 建立假 Event (避免 property_id 抓不到)
    INSERT INTO public.uag_events (session_id, property_id)
    VALUES (v_session_id, 'prop-123');

    -- =========================================================================
    -- 2. [Action] 執行 Purchase Lead
    -- =========================================================================
    -- 切換身分 (模擬 RPC 呼叫情境)
    -- SET ROLE authenticated; -- (實際測試時開啟)
    -- SET request.jwt.claim.sub = v_agent_id::TEXT;

    RAISE NOTICE '正在執行 purchase_lead...';
    
    -- 呼叫 RPC
    SELECT purchase_lead(
        v_agent_id::TEXT, -- 傳入 TEXT，測試 RPC 內是否正確轉型 UUID
        v_session_id,
        10,
        'A'
    ) INTO v_purchase_result;

    -- =========================================================================
    -- 3. [Assert] 防偷懶查核
    -- =========================================================================
    
    -- 查核 3.1: RPC 是否回傳 success = true ?
    IF (v_purchase_result->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION '測試失敗: purchase_lead RPC 回傳失敗: %', v_purchase_result;
    END IF;

    -- 查核 3.2: RPC 是否回傳 conversation_id ? (這是本次任務核心)
    v_conversation_id := (v_purchase_result->>'conversation_id')::UUID;
    IF v_conversation_id IS NULL THEN
        RAISE EXCEPTION '測試失敗: RPC 未回傳 conversation_id (偷懶點: 沒修改回傳值)';
    END IF;
    RAISE NOTICE 'PASS: RPC 回傳 conversation_id = %', v_conversation_id;

    -- 查核 3.3: 資料庫是否真的有這筆對話 ? (Atomicity check)
    PERFORM 1 FROM conversations WHERE id = v_conversation_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION '測試失敗: 資料庫找不到剛建立的對話 (偷懶點: insert 失敗卻沒 rollback)';
    END IF;
    RAISE NOTICE 'PASS: 資料庫存在對話記錄';

    -- 查核 3.4: 對話是否有連結到 Lead ? (FK integrity check)
    SELECT lead_id INTO v_lead_id FROM conversations WHERE id = v_conversation_id;
    IF v_lead_id IS NULL THEN
        RAISE EXCEPTION '測試失敗: 對話未連結 lead_id (偷懶點: FOREIGN KEY 漏填)';
    END IF;
    -- 進一步檢查 lead_id 是否等於回傳的 purchase_id
    IF v_lead_id::TEXT != (v_purchase_result->>'purchase_id') THEN
        RAISE EXCEPTION '測試失敗: 對話連結的 lead_id 與購買 ID 不符';
    END IF;
    RAISE NOTICE 'PASS: 對話正確連結至 Lead (FK Check OK)';

    -- 查核 3.5: 重複購買防呆測試 (Idempotency)
    -- 再次呼叫應該要失敗或回傳 old result，但不應報錯
    -- (這部分依賴現有邏輯，這裡檢查是否會因為自動建立對話而炸開)
    BEGIN
        PERFORM purchase_lead(v_agent_id::TEXT, v_session_id, 10, 'A');
        RAISE NOTICE 'PASS: 重複呼叫沒有 SQL Error';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '測試失敗: 重複呼叫導致崩潰 % (偷懶點: 沒處理重複邏輯)', SQLERRM;
    END;

    RAISE NOTICE '=== ✅ 所有防偷懶驗證通過 ===';
END $$;

ROLLBACK; -- 測試結束，還原資料庫
