-- IM-5: 591 匯入品質追蹤表
-- Migration: 20251230_create_import_analytics
-- Description: 記錄 parse591 解析結果，用於品質監控與 Regex 優化

-- 建立 import_analytics 表
CREATE TABLE IF NOT EXISTS import_analytics (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本指標
  text_length INTEGER NOT NULL CHECK (text_length >= 0),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  fields_found INTEGER NOT NULL CHECK (fields_found >= 0 AND fields_found <= 10),

  -- 欄位解析狀態 (JSONB)
  field_status JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- 缺失欄位列表
  missing_fields TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- 來源追蹤
  source TEXT NOT NULL CHECK (source IN ('paste', 'url', 'button')),
  user_agent TEXT,

  -- 時間戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立索引 (查詢優化)
CREATE INDEX IF NOT EXISTS idx_import_analytics_created_at
  ON import_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_import_analytics_confidence
  ON import_analytics(confidence);

CREATE INDEX IF NOT EXISTS idx_import_analytics_source
  ON import_analytics(source);

-- RLS 政策 (安全性)
ALTER TABLE import_analytics ENABLE ROW LEVEL SECURITY;

-- 允許 service_role 完整存取 (API 使用)
CREATE POLICY "Service role full access" ON import_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 註解
COMMENT ON TABLE import_analytics IS 'IM-5: 591 匯入解析品質追蹤';
COMMENT ON COLUMN import_analytics.text_length IS '原始文字長度';
COMMENT ON COLUMN import_analytics.confidence IS '解析信心分數 (0-100)';
COMMENT ON COLUMN import_analytics.fields_found IS '成功解析的欄位數量';
COMMENT ON COLUMN import_analytics.field_status IS 'JSON: {title, price, size, layout, address, listingId}';
COMMENT ON COLUMN import_analytics.missing_fields IS '缺失的欄位名稱陣列';
COMMENT ON COLUMN import_analytics.source IS '匯入來源: paste/url/button';
