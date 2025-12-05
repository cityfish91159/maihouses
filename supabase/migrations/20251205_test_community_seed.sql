-- ============================================================
-- 測試社區完整 Seed（用於 API 穩定性測試）
-- 執行方式：在 Supabase Dashboard SQL Editor 貼上執行
-- ============================================================

-- 使用合法的 UUID v4 格式
-- 測試用戶 ID（cityfish911@yahoo.com.tw - 這是真實用戶）
DO $$ 
DECLARE
  test_user_id UUID := '636417db-556c-49cc-bca2-29da08193e72';
  -- 以下為合法 UUID v4（第 13 位 = 4，第 17 位 = 8/9/a/b）
  test_community_id UUID := '6959a167-1e23-4409-9c54-8475960a1d61';
  test_agent_id UUID := '6dd00242-9921-454e-8570-37c83931f56b';
BEGIN

-- ============================================
-- 0. 建立測試房仲（含帶看/成交統計）
-- ============================================
INSERT INTO agents (id, name, company, trust_score, encouragement_count, visit_count, deal_count)
VALUES (
  test_agent_id,
  '測試房仲 Lily',
  '邁房子信義旗艦店',
  92,
  18,
  27,
  9
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  company = EXCLUDED.company,
  trust_score = EXCLUDED.trust_score,
  encouragement_count = EXCLUDED.encouragement_count,
  visit_count = EXCLUDED.visit_count,
  deal_count = EXCLUDED.deal_count;

-- ============================================
-- 1. 建立測試社區
-- ============================================
INSERT INTO communities (id, name, address, building_age, total_units, management_fee)
VALUES (
  test_community_id,
  '測試社區（API 穩定性）',
  '台北市信義區測試路 123 號',
  5,
  100,
  3500
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  building_age = EXCLUDED.building_age,
  total_units = EXCLUDED.total_units,
  management_fee = EXCLUDED.management_fee;

-- ============================================
-- 2. 測試貼文（公開牆）
-- ============================================
INSERT INTO community_posts (id, community_id, author_id, content, visibility, likes_count, is_pinned, created_at)
VALUES
  ('6a7b313f-0ae7-4058-ab09-a3a8fc2fd19c', test_community_id, test_user_id, 
   '📢 歡迎來到測試社區！這是一則置頂公告，用來測試 API 的置頂排序功能。', 
   'public', 12, TRUE, NOW() - INTERVAL '3 days'),
  ('1ce548c1-49b0-4f43-afa9-295f69a0c66c', test_community_id, test_user_id, 
   '昨天社區中庭的燈修好了，管委會效率不錯👍', 
   'public', 8, FALSE, NOW() - INTERVAL '1 day'),
  ('07705f5d-509a-4fcf-bdb9-c6f275eec1be', test_community_id, test_user_id, 
   '有人知道附近哪裡有好吃的早餐店嗎？剛搬來不太熟悉～', 
   'public', 3, FALSE, NOW() - INTERVAL '6 hours'),
  ('30eddf4a-af42-43a5-80f9-cbda0544bc66', test_community_id, test_user_id, 
   '今天天氣真好，從窗戶看出去的景色超棒的！', 
   'public', 5, FALSE, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  likes_count = EXCLUDED.likes_count,
  is_pinned = EXCLUDED.is_pinned;

-- ============================================
-- 3. 測試貼文（私密牆）
-- ============================================
INSERT INTO community_posts (id, community_id, author_id, content, visibility, likes_count, is_pinned, created_at)
VALUES
  ('6db3e69f-184a-4c50-abe7-e90cc35665bf', test_community_id, test_user_id, 
   '【住戶限定】下週六社區烤肉活動，有要參加的請在這邊登記～', 
   'private', 15, TRUE, NOW() - INTERVAL '2 days'),
  ('071f2df1-4dd3-4901-a794-3ed99901a8f7', test_community_id, test_user_id, 
   '請問有人要一起團購衛生紙嗎？湊滿 10 箱可以免運', 
   'private', 6, FALSE, NOW() - INTERVAL '8 hours'),
  ('4c121af3-2058-4a38-9a34-dcd28b3d8301', test_community_id, test_user_id, 
   '我家的停車位 B1-25 這週末可以借出，有需要的鄰居私訊我', 
   'private', 2, FALSE, NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  likes_count = EXCLUDED.likes_count,
  is_pinned = EXCLUDED.is_pinned;

-- ============================================
-- 4. 測試問題
-- ============================================
INSERT INTO community_questions (id, community_id, author_id, question, is_anonymous, status, answers_count, views_count, created_at)
VALUES
  ('fc8c1529-4a0c-4ca9-bf2c-3fd0959650f7', test_community_id, test_user_id, 
   '請問這個社區的管理費包含哪些項目？', 
   TRUE, 'answered', 2, 45, NOW() - INTERVAL '5 days'),
  ('a1b2c3d4-1234-4567-89ab-cdef01234567', test_community_id, test_user_id, 
   '停車位是機械還是平面？月租大概多少？', 
   FALSE, 'answered', 1, 32, NOW() - INTERVAL '3 days'),
  ('b2c3d4e5-2345-4678-9abc-def012345678', test_community_id, test_user_id, 
   '社區有健身房嗎？使用時間是幾點到幾點？', 
   TRUE, 'open', 0, 18, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  status = EXCLUDED.status,
  answers_count = EXCLUDED.answers_count,
  views_count = EXCLUDED.views_count;

-- ============================================
-- 5. 測試回答
-- ============================================
INSERT INTO community_answers (id, question_id, author_id, answer, author_type, is_best, likes_count, created_at)
VALUES
  -- 管理費問題的回答
  ('c3d4e5f6-3456-4789-abcd-ef0123456789', 'fc8c1529-4a0c-4ca9-bf2c-3fd0959650f7', test_user_id, 
   '管理費包含：清潔、保全 24 小時、公共水電、電梯維護、垃圾處理。每坪約 80 元。', 
   'resident', TRUE, 8, NOW() - INTERVAL '4 days'),
  ('d4e5f6a7-4567-4890-bcde-f01234567890', 'fc8c1529-4a0c-4ca9-bf2c-3fd0959650f7', test_user_id, 
   '補充一下，每年還會有一次社區大掃除和消毒，費用也包含在管理費裡面。', 
   'resident', FALSE, 3, NOW() - INTERVAL '4 days' + INTERVAL '2 hours'),
  -- 停車位問題的回答
  ('e5f6a7b8-5678-4901-cdef-012345678901', 'a1b2c3d4-1234-4567-89ab-cdef01234567', test_user_id, 
   'B1 是平面車位，B2 是機械車位。平面月租約 3500，機械約 2500。建議看房時實際走一趟比較準。', 
   'agent', TRUE, 5, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET
  answer = EXCLUDED.answer,
  is_best = EXCLUDED.is_best,
  likes_count = EXCLUDED.likes_count;

-- ============================================
-- 6. 測試評價（透過 properties 表）
-- ============================================
INSERT INTO properties (id, public_id, title, price, address, community_id, agent_id, advantage_1, advantage_2, disadvantage, created_at)
VALUES
  ('f6a7b8c9-6789-4012-def0-123456789012', 'TEST-001', 
   '測試物件 A - 信義區三房', 2800, '台北市信義區測試路 123 號 5F',
   test_community_id, test_agent_id, '採光良好，全日照', '近捷運站步行 5 分鐘', '樓層較低，無景觀', 
   NOW() - INTERVAL '10 days'),
  ('a7b8c9d0-7890-4123-ef01-234567890123', 'TEST-002', 
   '測試物件 B - 信義區兩房', 2200, '台北市信義區測試路 125 號 12F',
   test_community_id, test_agent_id, '格局方正，空間利用率高', '管理優良，24 小時保全', '無陽台', 
   NOW() - INTERVAL '7 days'),
  ('b8c9d0e1-8901-4234-f012-345678901234', 'TEST-003', 
   '測試物件 C - 信義區套房', 1500, '台北市信義區測試路 127 號 8F',
   test_community_id, test_agent_id, '裝潢新穎，可直接入住', '公設完善，有健身房游泳池', '坪數較小，約 15 坪', 
   NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  community_id = EXCLUDED.community_id,
  agent_id = EXCLUDED.agent_id,
  advantage_1 = EXCLUDED.advantage_1,
  advantage_2 = EXCLUDED.advantage_2,
  disadvantage = EXCLUDED.disadvantage;

END $$;

-- ============================================
-- 7. 驗證結果
-- ============================================
SELECT '✅ 測試社區' AS item, COUNT(*) AS count FROM communities WHERE id = '6959a167-1e23-4409-9c54-8475960a1d61'
UNION ALL
SELECT '✅ 測試房仲', COUNT(*) FROM agents WHERE id = '6dd00242-9921-454e-8570-37c83931f56b'
UNION ALL
SELECT '✅ 公開貼文', COUNT(*) FROM community_posts WHERE community_id = '6959a167-1e23-4409-9c54-8475960a1d61' AND visibility = 'public'
UNION ALL
SELECT '✅ 私密貼文', COUNT(*) FROM community_posts WHERE community_id = '6959a167-1e23-4409-9c54-8475960a1d61' AND visibility = 'private'
UNION ALL
SELECT '✅ 問題', COUNT(*) FROM community_questions WHERE community_id = '6959a167-1e23-4409-9c54-8475960a1d61'
UNION ALL
SELECT '✅ 回答', COUNT(*) FROM community_answers WHERE question_id IN (SELECT id FROM community_questions WHERE community_id = '6959a167-1e23-4409-9c54-8475960a1d61')
UNION ALL
SELECT '✅ 評價', COUNT(*) FROM community_reviews WHERE community_id = '6959a167-1e23-4409-9c54-8475960a1d61';

-- ============================================
-- 測試網址
-- ============================================
-- https://maihouses.vercel.app/maihouses/community/6959a167-1e23-4409-9c54-8475960a1d61/wall
-- 
-- API 測試：
-- curl "https://maihouses.vercel.app/api/community/wall?communityId=6959a167-1e23-4409-9c54-8475960a1d61&type=all"
