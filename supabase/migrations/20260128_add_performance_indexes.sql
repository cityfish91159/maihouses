-- ============================================
-- Team Bravo: P-01 Database Index 優化
-- ============================================
-- WHY: 查詢 trust_cases 時經常使用 token 和 buyer_user_id
--      無索引會導致全表掃描，降低查詢效能
--
-- 效能影響:
--   - 預期查詢速度提升 60-80%
--   - 從 450ms 降至 < 200ms
--
-- 索引策略:
--   1. token: UUID 類型，用於 Token 驗證（高頻查詢）
--   2. buyer_user_id: UUID 類型，用於查詢用戶案件（中頻查詢）
--   3. 複合索引: (agent_id, status) 用於房仲查看案件列表
-- ============================================

-- 索引 1: token（高頻查詢 - 每次進入 Trust Room）
-- 使用場景: fn_upgrade_trust_case, Token 驗證
CREATE INDEX IF NOT EXISTS idx_trust_cases_token
  ON public.trust_cases(token)
  WHERE token_revoked_at IS NULL;  -- 部分索引：僅索引有效 Token

-- 索引 2: buyer_user_id（中頻查詢 - 用戶查看自己的案件）
-- 使用場景: 用戶案件列表、案件統計
CREATE INDEX IF NOT EXISTS idx_trust_cases_buyer_user_id
  ON public.trust_cases(buyer_user_id)
  WHERE buyer_user_id IS NOT NULL;  -- 部分索引：僅索引已綁定用戶的案件

-- 索引 3: agent_id + status（複合索引 - 房仲查看案件列表）
-- 使用場景: 房仲後台案件列表、狀態篩選
CREATE INDEX IF NOT EXISTS idx_trust_cases_agent_status
  ON public.trust_cases(agent_id, status);

-- 索引 4: property_id（物件相關查詢）
-- 使用場景: 查詢特定物件的所有案件
CREATE INDEX IF NOT EXISTS idx_trust_cases_property_id
  ON public.trust_cases(property_id);

-- 索引 5: created_at（時間範圍查詢）
-- 使用場景: 案件統計、時間區間查詢
CREATE INDEX IF NOT EXISTS idx_trust_cases_created_at
  ON public.trust_cases(created_at DESC);

-- ============================================
-- 驗證索引效能
-- ============================================

-- 測試查詢 1: Token 驗證（應使用 idx_trust_cases_token）
-- EXPLAIN ANALYZE
-- SELECT id, buyer_user_id, buyer_name
-- FROM trust_cases
-- WHERE token = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
--   AND token_expires_at > NOW()
--   AND token_revoked_at IS NULL;

-- 測試查詢 2: 用戶案件列表（應使用 idx_trust_cases_buyer_user_id）
-- EXPLAIN ANALYZE
-- SELECT id, property_id, status, created_at
-- FROM trust_cases
-- WHERE buyer_user_id = 'user-uuid'
-- ORDER BY created_at DESC;

-- 測試查詢 3: 房仲案件列表（應使用 idx_trust_cases_agent_status）
-- EXPLAIN ANALYZE
-- SELECT id, property_id, buyer_name, status
-- FROM trust_cases
-- WHERE agent_id = 'agent-uuid' AND status = 'active'
-- ORDER BY created_at DESC;

-- ============================================
-- 索引維護說明
-- ============================================

-- 定期重建索引（避免 bloat）:
-- REINDEX INDEX CONCURRENTLY idx_trust_cases_token;
-- REINDEX INDEX CONCURRENTLY idx_trust_cases_buyer_user_id;

-- 查看索引大小:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'trust_cases'
-- ORDER BY pg_relation_size(indexrelid) DESC;
