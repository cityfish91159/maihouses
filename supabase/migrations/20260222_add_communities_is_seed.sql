-- ============================================================
-- Migration: 新增 is_seed 欄位，標記 seed/demo 社區
-- 目的：探索頁 API 透過 is_seed = false 過濾，不再顯示測試社區
-- 執行方式：複製全部內容 → Supabase Dashboard → SQL Editor → 貼上 → RUN
-- ============================================================

-- 步驟 1：新增欄位（既有社區預設 false = 真實社區）
ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_seed BOOLEAN NOT NULL DEFAULT false;

-- 步驟 2：標記榮耀城示範社區為 seed
UPDATE communities SET is_seed = true
WHERE id = '6c60721c-6bff-4e79-9f4d-0d3ccb3168f2';

-- 步驟 3：標記明湖水岸為 seed（依名稱比對，找不到就跳過不報錯）
UPDATE communities SET is_seed = true
WHERE name LIKE '%明湖水岸%';

-- 驗證：執行後跑這句確認結果
-- SELECT id, name, is_seed FROM communities ORDER BY is_seed DESC, name;
