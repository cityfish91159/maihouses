-- ============================================================
-- 測試社區完整 Seed（用於 API 穩定性測試）
-- 執行方式：在 Supabase Dashboard SQL Editor 貼上執行
-- ============================================================

-- 測試用戶 ID（cityfish911@yahoo.com.tw）
-- 所有 author_id 都用這個
DO $$ 
DECLARE
  test_user_id UUID := '636417db-556c-49cc-bca2-29da08193e72';
  test_community_id UUID := '00000000-0000-0000-0000-000000000001';
  test_agent_id UUID := '00000000-0000-0000-0000-00000000a901';
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
  ('11111111-1111-1111-1111-111111111101', test_community_id, test_user_id, 
   '📢 歡迎來到測試社區！這是一則置頂公告，用來測試 API 的置頂排序功能。', 
   'public', 12, TRUE, NOW() - INTERVAL '3 days'),
  ('11111111-1111-1111-1111-111111111102', test_community_id, test_user_id, 
   '昨天社區中庭的燈修好了，管委會效率不錯👍', 
   'public', 8, FALSE, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111103', test_community_id, test_user_id, 
   '有人知道附近哪裡有好吃的早餐店嗎？剛搬來不太熟悉～', 
   'public', 3, FALSE, NOW() - INTERVAL '6 hours'),
  ('11111111-1111-1111-1111-111111111104', test_community_id, test_user_id, 
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
  ('11111111-1111-1111-1111-111111111201', test_community_id, test_user_id, 
   '【住戶限定】下週六社區烤肉活動，有要參加的請在這邊登記～', 
   'private', 15, TRUE, NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111202', test_community_id, test_user_id, 
   '請問有人要一起團購衛生紙嗎？湊滿 10 箱可以免運', 
   'private', 6, FALSE, NOW() - INTERVAL '8 hours'),
  ('11111111-1111-1111-1111-111111111203', test_community_id, test_user_id, 
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
  ('22222222-2222-2222-2222-222222222201', test_community_id, test_user_id, 
   '請問這個社區的管理費包含哪些項目？', 
   TRUE, 'answered', 2, 45, NOW() - INTERVAL '5 days'),
  ('22222222-2222-2222-2222-222222222202', test_community_id, test_user_id, 
   '停車位是機械還是平面？月租大概多少？', 
   FALSE, 'answered', 1, 32, NOW() - INTERVAL '3 days'),
  ('22222222-2222-2222-2222-222222222203', test_community_id, test_user_id, 
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
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', test_user_id, 
   '管理費包含：清潔、保全 24 小時、公共水電、電梯維護、垃圾處理。每坪約 80 元。', 
   'resident', TRUE, 8, NOW() - INTERVAL '4 days'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201', test_user_id, 
   '補充一下，每年還會有一次社區大掃除和消毒，費用也包含在管理費裡面。', 
   'resident', FALSE, 3, NOW() - INTERVAL '4 days' + INTERVAL '2 hours'),
  -- 停車位問題的回答
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222202', test_user_id, 
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
  ('44444444-4444-4444-4444-444444444401', 'TEST-001', 
   '測試物件 A - 信義區三房', 2800, '台北市信義區測試路 123 號 5F',
   test_community_id, test_agent_id, '採光良好，全日照', '近捷運站步行 5 分鐘', '樓層較低，無景觀', 
   NOW() - INTERVAL '10 days'),
  ('44444444-4444-4444-4444-444444444402', 'TEST-002', 
   '測試物件 B - 信義區兩房', 2200, '台北市信義區測試路 125 號 12F',
   test_community_id, test_agent_id, '格局方正，空間利用率高', '管理優良，24 小時保全', '無陽台', 
   NOW() - INTERVAL '7 days'),
  ('44444444-4444-4444-4444-444444444403', 'TEST-003', 
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
SELECT '✅ 測試社區' AS item, COUNT(*) AS count FROM communities WHERE id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT '✅ 測試房仲', COUNT(*) FROM agents WHERE id = '00000000-0000-0000-0000-00000000a901'
UNION ALL
SELECT '✅ 公開貼文', COUNT(*) FROM community_posts WHERE community_id = '00000000-0000-0000-0000-000000000001' AND visibility = 'public'
UNION ALL
SELECT '✅ 私密貼文', COUNT(*) FROM community_posts WHERE community_id = '00000000-0000-0000-0000-000000000001' AND visibility = 'private'
UNION ALL
SELECT '✅ 問題', COUNT(*) FROM community_questions WHERE community_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT '✅ 回答', COUNT(*) FROM community_answers WHERE question_id IN (SELECT id FROM community_questions WHERE community_id = '00000000-0000-0000-0000-000000000001')
UNION ALL
SELECT '✅ 評價', COUNT(*) FROM community_reviews WHERE community_id = '00000000-0000-0000-0000-000000000001';

-- 測試網址：
-- https://maihouses.vercel.app/maihouses/community/00000000-0000-0000-0000-000000000001/wall