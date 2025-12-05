-- ============================================================
-- 為每個問題加入 5 條回答（測試非會員限制顯示）
-- 執行方式：在 Supabase Dashboard SQL Editor 貼上執行
-- ============================================================

DO $$ 
DECLARE
  test_user_id UUID := '636417db-556c-49cc-bca2-29da08193e72';
  test_agent_id UUID := '6dd00242-9921-454e-8570-37c83931f56b';
  
  -- 問題 ID
  q1_id UUID := 'fc8c1529-4a0c-4ca9-bf2c-3fd0959650f7';  -- 管理費問題
  q2_id UUID := 'a1b2c3d4-1234-4567-89ab-cdef01234567';  -- 停車位問題
  q3_id UUID := 'b2c3d4e5-2345-4678-9abc-def012345678';  -- 健身房問題
BEGIN

-- ============================================
-- 問題 1：管理費問題（已有 2 條，再加 3 條）
-- ============================================
INSERT INTO community_answers (id, question_id, author_id, answer, author_type, is_best, likes_count, created_at)
VALUES
  ('11111111-1111-4111-8111-111111111111', q1_id, test_user_id, 
   '我住這邊三年了，管理費每年大概漲 2-3%，算是還可以接受的範圍。', 
   'resident', FALSE, 2, NOW() - INTERVAL '3 days'),
  ('22222222-2222-4222-8222-222222222222', q1_id, test_agent_id, 
   '這個社區的管理費在同區段算中等偏低，CP 值很高，而且管委會運作得很好。', 
   'agent', FALSE, 4, NOW() - INTERVAL '2 days'),
  ('33333333-3333-4333-8333-333333333333', q1_id, test_user_id, 
   '補充：如果車位要另外租的話，平面車位一個月大約 3000-3500。', 
   'resident', FALSE, 1, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  answer = EXCLUDED.answer,
  likes_count = EXCLUDED.likes_count;

-- ============================================
-- 問題 2：停車位問題（已有 1 條，再加 4 條）
-- ============================================
INSERT INTO community_answers (id, question_id, author_id, answer, author_type, is_best, likes_count, created_at)
VALUES
  ('44444444-4444-4444-8444-444444444444', q2_id, test_user_id, 
   '機械車位操作蠻順的，不過尖峰時段要等一下。我個人是覺得平面比較方便。', 
   'resident', FALSE, 3, NOW() - INTERVAL '1 day' + INTERVAL '2 hours'),
  ('55555555-5555-4555-8555-555555555555', q2_id, test_user_id, 
   '我是租 B2 機械的，每月 2500，但要注意車高限制，休旅車可能進不去。', 
   'resident', FALSE, 5, NOW() - INTERVAL '1 day' + INTERVAL '4 hours'),
  ('66666666-6666-4666-8666-666666666666', q2_id, test_agent_id, 
   '目前社區有幾個車位在出租，如果需要我可以幫您詢問。機械跟平面都有。', 
   'agent', FALSE, 2, NOW() - INTERVAL '1 day' + INTERVAL '6 hours'),
  ('77777777-7777-4777-8777-777777777777', q2_id, test_user_id, 
   '聽說明年管委會在討論要不要把部分機械改成充電樁，電動車主可以期待一下！', 
   'resident', FALSE, 6, NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO UPDATE SET
  answer = EXCLUDED.answer,
  likes_count = EXCLUDED.likes_count;

-- ============================================
-- 問題 3：健身房問題（原本 0 條，加 5 條）
-- ============================================
INSERT INTO community_answers (id, question_id, author_id, answer, author_type, is_best, likes_count, created_at)
VALUES
  ('88888888-8888-4888-8888-888888888888', q3_id, test_user_id, 
   '有健身房！在 B1，開放時間是早上 6 點到晚上 10 點。設備蠻新的。', 
   'resident', TRUE, 8, NOW() - INTERVAL '20 hours'),
  ('99999999-9999-4999-8999-999999999999', q3_id, test_user_id, 
   '健身房有跑步機 3 台、腳踏車 2 台、還有一些重訓器材。假日人比較多。', 
   'resident', FALSE, 4, NOW() - INTERVAL '18 hours'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', q3_id, test_agent_id, 
   '這個社區的公設使用率很高，除了健身房還有閱覽室和交誼廳，很適合年輕家庭。', 
   'agent', FALSE, 3, NOW() - INTERVAL '16 hours'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', q3_id, test_user_id, 
   '我都早上去，6-7 點幾乎沒人，可以獨享整個健身房 💪', 
   'resident', FALSE, 5, NOW() - INTERVAL '10 hours'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', q3_id, test_user_id, 
   '提醒一下，使用健身房要先到管理室登記拿磁扣，第一次去記得帶住戶證明。', 
   'resident', FALSE, 7, NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO UPDATE SET
  answer = EXCLUDED.answer,
  likes_count = EXCLUDED.likes_count;

-- ============================================
-- 更新問題的回答數
-- ============================================
UPDATE community_questions SET answers_count = 5, status = 'answered' WHERE id = q1_id;
UPDATE community_questions SET answers_count = 5, status = 'answered' WHERE id = q2_id;
UPDATE community_questions SET answers_count = 5, status = 'answered' WHERE id = q3_id;

END $$;

-- ============================================
-- 驗證結果
-- ============================================
SELECT 
  q.question,
  COUNT(a.id) AS actual_answers
FROM community_questions q
LEFT JOIN community_answers a ON a.question_id = q.id
WHERE q.community_id = '6959a167-1e23-4409-9c54-8475960a1d61'
GROUP BY q.id, q.question
ORDER BY q.created_at DESC;
