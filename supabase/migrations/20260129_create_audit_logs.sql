/**
 * Migration: 建立 audit_logs 稽核日誌表
 *
 * Purpose: 修復 P0 致命問題 - 所有稽核日誌靜默失敗
 *
 * Team 11 Audit 發現問題:
 * - audit_logs 表不存在
 * - 所有 logAudit() 呼叫靜默失敗
 * - 違反合規要求
 *
 * 此 Migration 建立:
 * 1. 完整的 audit_logs 資料表 Schema
 * 2. 索引（transaction_id, user_id, action, created_at）
 * 3. RLS 政策（僅 service_role 可存取）
 * 4. CHECK constraint（role 必須是 'agent', 'buyer', 'system'）
 */

-- ============================================================================
-- 1. 建立 audit_logs 資料表
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('agent', 'buyer', 'system')),
  ip TEXT NOT NULL DEFAULT 'unknown',
  user_agent TEXT NOT NULL DEFAULT 'unknown',
  resource_id TEXT,
  resource_type TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. 建立索引（優化查詢效能）
-- ============================================================================

-- 交易 ID 索引（常用於追蹤特定交易）
CREATE INDEX idx_audit_logs_transaction_id ON public.audit_logs (transaction_id);

-- 用戶 ID 索引（常用於查詢特定用戶的操作）
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);

-- 動作類型索引（常用於統計特定類型的操作）
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);

-- 時間索引（常用於時間範圍查詢，降序排列）
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ============================================================================
-- 3. 啟用 Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. 建立 RLS 政策（僅 service_role 可存取）
-- ============================================================================

-- 稽核日誌是敏感資料，僅允許 service_role 讀寫
-- 前端不應直接存取此表
CREATE POLICY "audit_logs_service_role_only"
ON public.audit_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. 註解說明
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS '稽核日誌表 - 記錄所有安心留痕相關操作，用於合規追蹤';
COMMENT ON COLUMN public.audit_logs.transaction_id IS '交易 ID（例如：case_id, token）';
COMMENT ON COLUMN public.audit_logs.action IS '操作類型（例如：CREATE_TRUST_CASE, UPGRADE_TRUST_CASE）';
COMMENT ON COLUMN public.audit_logs.user_id IS '用戶 ID（匿名用戶為臨時代號）';
COMMENT ON COLUMN public.audit_logs.role IS '用戶角色：agent=房仲, buyer=買方, system=系統';
COMMENT ON COLUMN public.audit_logs.ip IS '客戶端 IP 地址';
COMMENT ON COLUMN public.audit_logs.user_agent IS '客戶端 User-Agent';
COMMENT ON COLUMN public.audit_logs.metadata IS '額外元數據（JSON 格式）';
