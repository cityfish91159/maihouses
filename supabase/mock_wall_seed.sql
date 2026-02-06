-- Supabase mock dataset for Community Wall manual verification
-- -------------------------------------------------------------
-- 目的：為「社區牆」API 提供一組固定的範例資料，確保前端可以在
--       Vercel 環境改用 API 模式時看到真實內容，而不會干擾到現有
--       測試／資料。所有記錄都綁定在單一 community_id 上，重覆執行
--       此腳本會先清除舊資料再重新寫入。
-- 使用方式：
--   1. 打開 Supabase Dashboard → SQL Editor。
--   2. 貼上整份 SQL，按下 RUN。需要 service role / Owner 權限。
--   3. API 查詢時改用 communityId=6c60721c-6bff-4e79-9f4d-0d3ccb3168f2。
--      例如：https://maihouses.vercel.app/api/community/wall?communityId=6c60721c-6bff-4e79-9f4d-0d3ccb3168f2&type=all
--
-- 注意：腳本會抓現有 auth.users 前兩位使用者作為 mock 住戶／房仲。
-- 如系統目前沒有使用者，請先註冊至少一組帳號再執行。

BEGIN;

-- 確保 communities 表存在必要欄位（不同環境有可能尚未套用最新 migration）
ALTER TABLE communities ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS story_vibe TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS two_good TEXT[];
ALTER TABLE communities ADD COLUMN IF NOT EXISTS one_fair TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS lifestyle_tags TEXT[];
ALTER TABLE communities ADD COLUMN IF NOT EXISTS completeness_score INTEGER;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS total_units INTEGER;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS management_fee INTEGER;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS builder TEXT;

-- 確保 community_posts 表存在 liked_by 欄位
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS liked_by UUID[] DEFAULT '{}';
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 使用自訂 delimiter 避免 $$ 被截斷
DO $seed$
DECLARE
  mock_community_id CONSTANT UUID := '6c60721c-6bff-4e79-9f4d-0d3ccb3168f2';
  mock_property_id  CONSTANT UUID := '550975a0-2cbe-47d1-8ded-061c15de6a9d';
  mock_property_2_id CONSTANT UUID := '7b8c1d2e-3f4a-5b6c-7d8e-9f0a1b2c3d4e';
  mock_property_3_id CONSTANT UUID := '8c9d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f';
  mock_property_4_id CONSTANT UUID := '9d0e1f2a-3b4c-5d6e-7f8a-9b0c1d2e3f4a';
  mock_property_5_id CONSTANT UUID := '0e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';
  post_public_pin_id CONSTANT UUID := 'a2d4f580-0ca4-4ade-996b-025ae882b58c';
  post_public_id     CONSTANT UUID := 'a6930de6-cf07-4cdd-836e-20259bd68d61';
  post_public_id_2   CONSTANT UUID := 'd1a7c1b8-7e3a-4d95-9a5c-4e8d7f6cba01';
  post_public_id_3   CONSTANT UUID := '2f3b1c9d-9b4a-49a8-97db-d7d70ad5b502';
  post_public_id_4   CONSTANT UUID := 'b6f22c9d-62fb-4e0a-9e5c-4b7e2dd1a1c3';
  post_private_id    CONSTANT UUID := 'be3afb5b-03cf-4abb-8b91-8aa0774fe11d';
  question_air_id    CONSTANT UUID := 'c170b79b-8a3b-4a71-b7d6-b42c0fede3da';
  question_fee_id    CONSTANT UUID := 'ddd7b71b-0d2a-4a27-897c-dc7781d1b903';
  question_noise_id  CONSTANT UUID := '2c1f8d9c-3f6a-4ed4-8a19-5f0d9a9c30df';
  question_parking_id CONSTANT UUID := '8c0b6ef1-0a47-4db3-9c8f-9c8ed0433cf7';
  question_pet_id    CONSTANT UUID := 'f5b7edc4-0dbe-4724-9a37-9d5ef05f1f34';
  answer_resident_id CONSTANT UUID := 'ef66ad04-5b67-47a0-9e4f-e95c8f05de6b';
  answer_agent_id    CONSTANT UUID := 'fbea4646-b832-4e1e-b7b7-e5cb364a7e06';
  answer_noise_id    CONSTANT UUID := 'e6a30a4d-2f92-4a3b-90f9-5f1f14a2b4c2';
  answer_parking_id  CONSTANT UUID := '1b7b1c9a-6f93-4d27-9c6b-6f9c5b9f2a40';
  resident_user UUID;
  agent_user UUID;
BEGIN
  SELECT id INTO resident_user FROM auth.users ORDER BY created_at LIMIT 1;
  IF resident_user IS NULL THEN
    RAISE EXCEPTION 'Supabase 至少需要一名 auth 使用者才可建立 mock 資料';
  END IF;

  SELECT id INTO agent_user FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
  IF agent_user IS NULL THEN
    agent_user := resident_user;
  END IF;

  -- 清空舊資料以確保腳本可重覆執行
  DELETE FROM community_answers WHERE question_id IN (
    SELECT id FROM community_questions WHERE community_id = mock_community_id
  );
  DELETE FROM community_questions WHERE community_id = mock_community_id;
  DELETE FROM community_posts WHERE community_id = mock_community_id;
  DELETE FROM community_members WHERE community_id = mock_community_id;
  DELETE FROM properties WHERE community_id = mock_community_id;
  DELETE FROM communities WHERE id = mock_community_id;

  -- 建立示範社區
  INSERT INTO communities (
    id, name, address, district, city, story_vibe,
    two_good, one_fair, lifestyle_tags, completeness_score,
    total_units, management_fee, builder
  ) VALUES (
    mock_community_id,
    '榮耀城示範社區',
    '台北市信義區松壽路 9 號',
    '信義區',
    '台北市',
    '重視社區活動，週末都有住戶市集',
    ARRAY['24H Concierge', '泳池溫水開放'],
    '尖峰電梯偶爾需要等候',
    ARRAY['親子友善', '交通便利'],
    88,
    420,
    95,
    '榮耀建設'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    district = EXCLUDED.district,
    city = EXCLUDED.city,
    story_vibe = EXCLUDED.story_vibe,
    two_good = EXCLUDED.two_good,
    one_fair = EXCLUDED.one_fair,
    lifestyle_tags = EXCLUDED.lifestyle_tags,
    completeness_score = EXCLUDED.completeness_score,
    total_units = EXCLUDED.total_units,
    management_fee = EXCLUDED.management_fee,
    builder = EXCLUDED.builder,
    updated_at = NOW();

  -- 建立房源（供 community_reviews view 產生 pros/cons）
  INSERT INTO properties (
    id, public_id, title, price, address, description, images,
    source_platform, source_external_id,
    community_id, community_name,
    advantage_1, advantage_2, disadvantage
  ) VALUES (
    mock_property_id,
    'MOCK-888001',
    '榮耀城景觀雙車位 3 房',
    3180,
    '台北市信義區松壽路 9 號 20F',
    '高樓層景觀＋雙車位，全天候門廳管理。',
    ARRAY['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'],
    'MH',
    'demo-property-888001',
    mock_community_id,
    '榮耀城示範社區',
    '管理嚴謹，門廳人員記得每位住戶',
    '公設維持良好，泳池全年恆溫',
    '尖峰時間車道偶爾壅塞'
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    address = EXCLUDED.address,
    description = EXCLUDED.description,
    images = EXCLUDED.images,
    source_platform = EXCLUDED.source_platform,
    source_external_id = EXCLUDED.source_external_id,
    community_id = EXCLUDED.community_id,
    community_name = EXCLUDED.community_name,
    advantage_1 = EXCLUDED.advantage_1,
    advantage_2 = EXCLUDED.advantage_2,
    disadvantage = EXCLUDED.disadvantage,
    updated_at = NOW();

  -- 額外 4 筆房源，供評價 View 顯示 5 則評價
  INSERT INTO properties (
    id, public_id, title, price, address, description, images,
    source_platform, source_external_id,
    community_id, community_name,
    advantage_1, advantage_2, disadvantage
  ) VALUES
    (
      mock_property_2_id,
      'MOCK-888002',
      '榮耀城中高樓雙陽台 3 房',
      2980,
      '台北市信義區松壽路 9 號 16F',
      '雙陽台對流採光佳，客廳面中庭安靜。',
      ARRAY['https://images.unsplash.com/photo-1505692069463-5e3405e1b1d1?auto=format&fit=crop&w=1200&q=80'],
      'MH',
      'demo-property-888002',
      mock_community_id,
      '榮耀城示範社區',
      '中庭景觀安靜，樓層通風好',
      '管理員協助代收包裹，服務到位',
      '尖峰電梯需等候 5 分鐘左右'
    ),
    (
      mock_property_3_id,
      'MOCK-888003',
      '榮耀城邊間高樓 2+1 房',
      2550,
      '台北市信義區松壽路 9 號 22F',
      '邊間三面採光，書房可改小孩房。',
      ARRAY['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80'],
      'MH',
      'demo-property-888003',
      mock_community_id,
      '榮耀城示範社區',
      '社區健身房器材新，維護良好',
      '管理費含泳池與清潔，CP 值高',
      '車道轉彎半徑小，新手需注意'
    ),
    (
      mock_property_4_id,
      'MOCK-888004',
      '榮耀城低樓層大三房',
      2350,
      '台北市信義區松壽路 9 號 8F',
      '低樓層免等電梯久，動線方便。',
      ARRAY['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'],
      'MH',
      'demo-property-888004',
      mock_community_id,
      '榮耀城示範社區',
      '管委會處理報修效率快',
      '社區中庭維護良好，適合小孩放風',
      '靠近車道偶有車聲，需關窗'
    ),
    (
      mock_property_5_id,
      'MOCK-888005',
      '榮耀城景觀高樓 4 房',
      3580,
      '台北市信義區松壽路 9 號 25F',
      '高樓遠景視野，四房雙衛格局。',
      ARRAY['https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80'],
      'MH',
      'demo-property-888005',
      mock_community_id,
      '榮耀城示範社區',
      '社區公設多，游泳池全年可用',
      '24H 保全與門禁系統安心',
      '車道坡度較陡，雨天要小心'
    )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    address = EXCLUDED.address,
    description = EXCLUDED.description,
    images = EXCLUDED.images,
    source_platform = EXCLUDED.source_platform,
    source_external_id = EXCLUDED.source_external_id,
    community_id = EXCLUDED.community_id,
    community_name = EXCLUDED.community_name,
    advantage_1 = EXCLUDED.advantage_1,
    advantage_2 = EXCLUDED.advantage_2,
    disadvantage = EXCLUDED.disadvantage,
    updated_at = NOW();

  INSERT INTO community_members (
    community_id, user_id, role, status, joined_at
  ) VALUES
    (mock_community_id, resident_user, 'resident', 'active', NOW() - INTERVAL '180 days'),
    (mock_community_id, agent_user, 'agent', 'active', NOW() - INTERVAL '365 days')
  ON CONFLICT (community_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    joined_at = EXCLUDED.joined_at;

  -- 建立貼文（2 公開 + 1 私密）
  INSERT INTO community_posts (
    id, community_id, author_id, content, images, visibility,
    post_type, is_pinned, likes_count, comments_count, liked_by, created_at
  ) VALUES
    (
      post_public_pin_id,
      mock_community_id,
      resident_user,
      '社區泳池這週末會有救生員體驗課，歡迎家長帶小朋友參加！',
      ARRAY[]::TEXT[],
      'public',
      'announcement',
      TRUE,
      18,
      4,
      ARRAY[resident_user],
      NOW() - INTERVAL '2 days'
    ),
    (
      post_public_id,
      mock_community_id,
      agent_user,
      '地下室 B3 停車場 42 號臨時有短租名額，有需要的住戶私訊我。',
      ARRAY[]::TEXT[],
      'public',
      'parking',
      FALSE,
      7,
      2,
      ARRAY[resident_user, agent_user],
      NOW() - INTERVAL '16 hours'
    ),
    (
      post_public_id_2,
      mock_community_id,
      resident_user,
      '有人要一起團購掃地機嗎？滿 5 台有折扣，留言+1 統計人數。',
      ARRAY[]::TEXT[],
      'public',
      'group_buy',
      FALSE,
      31,
      14,
      ARRAY[resident_user],
      NOW() - INTERVAL '3 days'
    ),
    (
      post_public_id_3,
      mock_community_id,
      agent_user,
      '惠宇上晴 12F 雙陽台視野戶，屋主剛降價 50 萬，有興趣私訊。',
      ARRAY[]::TEXT[],
      'public',
      'property',
      FALSE,
      12,
      5,
      ARRAY[agent_user],
      NOW() - INTERVAL '5 days'
    ),
    (
      post_public_id_4,
      mock_community_id,
      resident_user,
      '有人有推薦的水電師傅嗎？想換浴室排風扇。',
      ARRAY[]::TEXT[],
      'public',
      'general',
      FALSE,
      9,
      3,
      ARRAY[resident_user],
      NOW() - INTERVAL '7 days'
    ),
    (
      post_private_id,
      mock_community_id,
      resident_user,
      '有人願意一起團購空氣清淨機濾網嗎？已整理好價目表放在附件。',
      ARRAY[]::TEXT[],
      'private',
      'group_buy',
      FALSE,
      3,
      1,
      ARRAY[agent_user],
      NOW() - INTERVAL '8 hours'
    )
  ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    visibility = EXCLUDED.visibility,
    post_type = EXCLUDED.post_type,
    is_pinned = EXCLUDED.is_pinned,
    likes_count = EXCLUDED.likes_count,
    comments_count = EXCLUDED.comments_count,
    liked_by = EXCLUDED.liked_by,
    images = EXCLUDED.images,
    updated_at = NOW();

  -- 建立問答
  INSERT INTO community_questions (
    id, community_id, author_id, question, is_anonymous, status,
    answers_count, views_count, created_at
  ) VALUES
    (
      question_air_id,
      mock_community_id,
      resident_user,
      '高樓層風聲會不會很大？晚上關窗還聽得到嗎？',
      TRUE,
      'answered',
      0,
      56,
      NOW() - INTERVAL '3 days'
    ),
    (
      question_fee_id,
      mock_community_id,
      agent_user,
      '管理費包含游泳池維護嗎？想估算一年總開銷。',
      FALSE,
      'answered',
      0,
      41,
      NOW() - INTERVAL '1 day'
    ),
    (
      question_noise_id,
      mock_community_id,
      resident_user,
      '隔壁棟施工噪音平日白天會影響嗎？',
      TRUE,
      'answered',
      0,
      33,
      NOW() - INTERVAL '12 hours'
    ),
    (
      question_parking_id,
      mock_community_id,
      agent_user,
      '訪客車位要事先登記嗎？臨時來得及嗎？',
      FALSE,
      'answered',
      0,
      27,
      NOW() - INTERVAL '6 hours'
    ),
    (
      question_pet_id,
      mock_community_id,
      resident_user,
      '社區對寵物的規定嚴格嗎？電梯能抱狗嗎？',
      FALSE,
      'open',
      0,
      21,
      NOW() - INTERVAL '2 hours'
    )
  ON CONFLICT (id) DO UPDATE SET
    question = EXCLUDED.question,
    is_anonymous = EXCLUDED.is_anonymous,
    status = EXCLUDED.status,
    views_count = EXCLUDED.views_count;

  -- 建立回答（trigger 會自動更新 answers_count）
  INSERT INTO community_answers (
    id, question_id, author_id, answer, author_type, is_best, likes_count, created_at
  ) VALUES
    (
      answer_resident_id,
      question_air_id,
      resident_user,
      '住在 20 樓，平常關窗後幾乎無聲，只有颱風夜才會聽到風鳴。',
      'resident',
      TRUE,
      5,
      NOW() - INTERVAL '2 days'
    ),
    (
      answer_agent_id,
      question_fee_id,
      agent_user,
      '管理費 95 元/坪，已包含泳池維護與公共空調電費，半年繳一次。',
      'agent',
      FALSE,
      3,
      NOW() - INTERVAL '20 hours'
    ),
    (
      answer_noise_id,
      question_noise_id,
      resident_user,
      '目前平日 10-16 點有施工聲，晚上和週末大多安靜，窗戶關起來影響不大。',
      'resident',
      FALSE,
      2,
      NOW() - INTERVAL '10 hours'
    ),
    (
      answer_parking_id,
      question_parking_id,
      agent_user,
      '訪客車位需在管委會 LINE 群預約，臨時來可先讓警衛代登記，但以空位為主。',
      'agent',
      FALSE,
      1,
      NOW() - INTERVAL '5 hours'
    )
  ON CONFLICT (id) DO UPDATE SET
    answer = EXCLUDED.answer,
    author_type = EXCLUDED.author_type,
    is_best = EXCLUDED.is_best,
    likes_count = EXCLUDED.likes_count;

END;
$seed$;

COMMIT;
