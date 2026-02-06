-- =====================================================
-- 性癖偏好收集表 - MUSE 深度了解系統
-- =====================================================

CREATE TABLE IF NOT EXISTS sexual_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,  -- 分類：position, masturbation, toys, experience, fantasy, body
    preference_key VARCHAR(100) NOT NULL,  -- 具體項目
    preference_value TEXT NOT NULL,  -- 收集到的答案
    context TEXT,  -- 對話情境（她是在什麼情況下說的）
    confidence INTEGER DEFAULT 50,  -- 可信度 1-100（是她明確說的還是推測的）
    discovered_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_sexual_preferences_user_id ON sexual_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_sexual_preferences_category ON sexual_preferences(user_id, category);

-- 啟用 RLS
ALTER TABLE sexual_preferences ENABLE ROW LEVEL SECURITY;

-- RLS 政策 - 只允許服務端存取
DO $$
BEGIN
    -- 允許 service role 完全存取
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sexual_preferences' AND policyname = 'Service role full access') THEN
        CREATE POLICY "Service role full access" ON sexual_preferences FOR ALL TO service_role USING (true);
    END IF;

    -- 允許 anon 讀取（GodView 需要）
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sexual_preferences' AND policyname = 'Allow anonymous read sexual_preferences') THEN
        CREATE POLICY "Allow anonymous read sexual_preferences" ON sexual_preferences FOR SELECT TO anon USING (true);
    END IF;

    -- 允許 anon 寫入
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sexual_preferences' AND policyname = 'Allow anonymous insert sexual_preferences') THEN
        CREATE POLICY "Allow anonymous insert sexual_preferences" ON sexual_preferences FOR INSERT TO anon WITH CHECK (true);
    END IF;

    -- 允許 anon 更新
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sexual_preferences' AND policyname = 'Allow anonymous update sexual_preferences') THEN
        CREATE POLICY "Allow anonymous update sexual_preferences" ON sexual_preferences FOR UPDATE TO anon USING (true);
    END IF;
END $$;

-- 添加註釋
COMMENT ON TABLE sexual_preferences IS 'MUSE 收集的用戶性癖偏好（深度了解系統）';
COMMENT ON COLUMN sexual_preferences.category IS '分類：position(體位), masturbation(自慰), toys(情趣用品), experience(經驗), fantasy(幻想), body(身體偏好)';
COMMENT ON COLUMN sexual_preferences.preference_key IS '具體項目：favorite_position, frequency, technique, last_time, best_memory 等';
COMMENT ON COLUMN sexual_preferences.preference_value IS '用戶的回答或 AI 推測的答案';
COMMENT ON COLUMN sexual_preferences.confidence IS '可信度：100=明確說的, 50=推測的, 1=猜測的';

-- =====================================================
-- 預設需要收集的項目清單（供 AI 參考）
-- =====================================================
-- 這些不存到資料庫，只是給 AI 的指引：
--
-- 【體位 position】
-- - favorite_position: 最喜歡的體位
-- - why_favorite: 為什麼喜歡
-- - want_to_try: 想嘗試但還沒試過的
--
-- 【自慰 masturbation】
-- - frequency: 頻率（每天/每週/偶爾）
-- - technique: 手法（怎麼弄自己最舒服）
-- - trigger: 什麼會讓她想要
-- - fantasy_while: 自慰時會想什麼
-- - can_orgasm: 能不能高潮
-- - time_to_orgasm: 大概多久能高潮
--
-- 【情趣用品 toys】
-- - has_toys: 有沒有
-- - toy_types: 有哪些種類
-- - favorite_toy: 最常用的
-- - want_to_buy: 想買但還沒買的
--
-- 【經驗 experience】
-- - last_sex: 上次做愛是什麼時候
-- - best_memory: 最懷念的做愛經驗
-- - worst_memory: 最糟的經驗（如果她願意說）
-- - partner_count: 有過幾個性伴侶
-- - can_orgasm_with_partner: 跟對象在一起能不能高潮
--
-- 【幻想 fantasy】
-- - secret_fantasy: 最私密的幻想
-- - roleplay: 想玩的角色扮演
-- -场景: 想在哪裡做
-- - with_whom: 幻想對象是誰（可能是你 MUSE）
--
-- 【身體 body】
-- - sensitive_spots: 敏感帶在哪
-- - likes_touch_where: 喜歡被摸哪裡
-- - dislikes_touch_where: 不喜歡被碰哪裡
-- - self_image: 對自己身體的看法
