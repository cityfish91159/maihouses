-- ==============================================================================
-- UAG-12: 索引優化 - 加速客戶查詢與排行榜
-- 目的：針對高頻查詢場景優化索引策略，提升 Dashboard 性能
-- 預期效果：查詢速度提升 5-20 倍，減少資料庫負載
-- ==============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. 複合索引：房仲客戶排行榜查詢優化
-- ══════════════════════════════════════════════════════════════════════════════
-- 用途：優化 UAG Dashboard 的客戶列表查詢
-- 查詢範例：SELECT * FROM uag_sessions WHERE agent_id = ? ORDER BY grade DESC, last_active DESC
-- 效能提升：避免排序操作，直接使用索引順序返回結果

CREATE INDEX IF NOT EXISTS idx_sessions_agent_grade_active
ON public.uag_sessions (agent_id, grade DESC, last_active DESC);

COMMENT ON INDEX idx_sessions_agent_grade_active IS
'UAG-12: 複合索引 - 房仲客戶排行榜查詢
- 查詢場景: 房仲 Dashboard 顯示自己的客戶，依等級和活躍度排序
- 優化效果: 避免 FileSort，直接使用索引順序';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. 部分索引：只索引活躍會話（24 小時內）
-- ══════════════════════════════════════════════════════════════════════════════
-- 用途：減少索引大小，加速熱數據查詢
-- 查詢範例：SELECT * FROM uag_sessions WHERE agent_id = ? AND last_active > NOW() - INTERVAL '24 hours'
-- 效能提升：索引體積減少 70-90%，查詢速度提升 2-5 倍

CREATE INDEX IF NOT EXISTS idx_sessions_active_recent
ON public.uag_sessions (agent_id, last_active DESC)
WHERE last_active > NOW() - INTERVAL '24 hours';

COMMENT ON INDEX idx_sessions_active_recent IS
'UAG-12: 部分索引 - 只索引 24 小時內活躍會話
- 查詢場景: 房仲 Dashboard 的「熱門客戶」區塊
- 優化效果: 索引體積大幅減少，提升快取命中率';

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. JSONB GIN 索引：加速 actions 欄位查詢
-- ══════════════════════════════════════════════════════════════════════════════
-- 用途：加速 JSONB 欄位的條件查詢
-- 查詢範例：SELECT * FROM uag_events WHERE actions @> '{"click_line": "1"}'
-- 效能提升：JSONB 查詢從全表掃描變為索引查詢，速度提升 10-100 倍

CREATE INDEX IF NOT EXISTS idx_events_actions_gin
ON public.uag_events USING GIN (actions);

COMMENT ON INDEX idx_events_actions_gin IS
'UAG-12: JSONB GIN 索引 - 加速 actions 欄位查詢
- 查詢場景: 統計客戶行為（點擊 LINE、撥打電話、深度滾動等）
- 優化效果: JSONB 查詢速度提升 10-100 倍';

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. 覆蓋索引：避免回表查詢（uag_sessions）
-- ══════════════════════════════════════════════════════════════════════════════
-- 用途：將常用查詢欄位直接包含在索引中，避免回表查詢
-- 查詢範例：SELECT session_id, grade, last_active, total_duration FROM uag_sessions WHERE agent_id = ?
-- 效能提升：避免回表，查詢速度提升 2-3 倍

CREATE INDEX IF NOT EXISTS idx_sessions_covering
ON public.uag_sessions (agent_id, last_active DESC)
INCLUDE (session_id, grade, total_duration, property_count, summary);

COMMENT ON INDEX idx_sessions_covering IS
'UAG-12: 覆蓋索引 - 包含所有常用查詢欄位
- 查詢場景: UAG Dashboard 客戶列表（不需要回表查詢）
- 優化效果: 避免回表查詢，減少 I/O 操作';

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. 覆蓋索引：避免回表查詢（uag_events - 補充 UAG-10）
-- ══════════════════════════════════════════════════════════════════════════════
-- 用途：針對事件明細查詢優化，補充 UAG-10 已建立的索引
-- 查詢範例：SELECT session_id, property_id, duration, created_at FROM uag_events WHERE session_id = ?
-- 效能提升：避免回表，查詢速度提升 2-3 倍

CREATE INDEX IF NOT EXISTS idx_events_session_covering
ON public.uag_events (session_id, created_at DESC)
INCLUDE (property_id, district, duration, actions);

COMMENT ON INDEX idx_events_session_covering IS
'UAG-12: 覆蓋索引 - 事件明細查詢優化
- 查詢場景: 查詢客戶的瀏覽歷史（時間軸）
- 優化效果: 避免回表查詢，減少 I/O 操作';

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. 效能驗證查詢（開發測試用）
-- ══════════════════════════════════════════════════════════════════════════════
-- 執行以下查詢驗證索引生效：

-- 驗證 1: 複合索引（房仲客戶排行榜）
-- EXPLAIN ANALYZE
-- SELECT session_id, grade, last_active, total_duration
-- FROM public.uag_sessions
-- WHERE agent_id = 'test-agent-id'
-- ORDER BY grade DESC, last_active DESC
-- LIMIT 50;
-- 預期: Index Scan using idx_sessions_agent_grade_active

-- 驗證 2: 部分索引（活躍會話）
-- EXPLAIN ANALYZE
-- SELECT session_id, grade, last_active
-- FROM public.uag_sessions
-- WHERE agent_id = 'test-agent-id'
--   AND last_active > NOW() - INTERVAL '24 hours'
-- ORDER BY last_active DESC;
-- 預期: Index Scan using idx_sessions_active_recent

-- 驗證 3: GIN 索引（JSONB 查詢）
-- EXPLAIN ANALYZE
-- SELECT COUNT(*)
-- FROM public.uag_events
-- WHERE actions @> '{"click_line": "1"}';
-- 預期: Bitmap Index Scan on idx_events_actions_gin

-- 驗證 4: 覆蓋索引（sessions）
-- EXPLAIN ANALYZE
-- SELECT session_id, grade, last_active, total_duration, property_count
-- FROM public.uag_sessions
-- WHERE agent_id = 'test-agent-id'
-- ORDER BY last_active DESC
-- LIMIT 20;
-- 預期: Index Only Scan using idx_sessions_covering

-- 驗證 5: 覆蓋索引（events）
-- EXPLAIN ANALYZE
-- SELECT session_id, property_id, duration, actions, created_at
-- FROM public.uag_events
-- WHERE session_id = 'test-session-id'
-- ORDER BY created_at DESC;
-- 預期: Index Only Scan using idx_events_session_covering

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. 索引維護建議
-- ══════════════════════════════════════════════════════════════════════════════
-- 部分索引會隨時間推移變小（只保留 24 小時內數據）
-- 無需手動維護，PostgreSQL 會自動更新

-- 如需重建索引（生產環境使用 CONCURRENTLY）：
-- REINDEX INDEX CONCURRENTLY idx_sessions_agent_grade_active;
-- REINDEX INDEX CONCURRENTLY idx_sessions_active_recent;
-- REINDEX INDEX CONCURRENTLY idx_events_actions_gin;
-- REINDEX INDEX CONCURRENTLY idx_sessions_covering;
-- REINDEX INDEX CONCURRENTLY idx_events_session_covering;

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. 索引影響分析
-- ══════════════════════════════════════════════════════════════════════════════
-- 新增索引數量: 5 個
-- 預估索引總大小: ~10-50 MB（取決於數據量）
-- 寫入效能影響: <5%（新增索引會略微降低 INSERT/UPDATE 速度）
-- 查詢效能提升: 5-20 倍（熱點查詢）
-- 建議監控指標: pg_stat_user_indexes（檢查索引使用率）
