-- Seed additional QA answers to keep the first question populated
-- Community: demo wall data (communityId = 6c60721c-6bff-4e79-9f4d-0d3ccb3168f2)
-- Safe to rerun: uses fixed IDs and upserts

BEGIN;

DO $$
DECLARE
  community_id CONSTANT UUID := '6c60721c-6bff-4e79-9f4d-0d3ccb3168f2';
  question_air_id CONSTANT UUID := 'c170b79b-8a3b-4a71-b7d6-b42c0fede3da';
  question_fee_id CONSTANT UUID := 'ddd7b71b-0d2a-4a27-897c-dc7781d1b903';
  answer_air_resident_id CONSTANT UUID := 'ef66ad04-5b67-47a0-9e4f-e95c8f05de6b';
  answer_fee_agent_id CONSTANT UUID := 'fbea4646-b832-4e1e-b7b7-e5cb364a7e06';
  resident_user UUID;
  agent_user UUID;
BEGIN
  -- Pick two existing users as resident/agent placeholders
  SELECT id INTO resident_user FROM auth.users ORDER BY created_at LIMIT 1;
  IF resident_user IS NULL THEN
    RAISE NOTICE 'No auth users found; skip QA answer seed.';
    RETURN;
  END IF;

  SELECT id INTO agent_user FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1;
  IF agent_user IS NULL THEN
    agent_user := resident_user;
  END IF;

  -- Ensure the questions exist (upsert keeps text up to date)
  INSERT INTO community_questions (
    id, community_id, author_id, question, is_anonymous, status,
    answers_count, views_count, created_at
  ) VALUES
    (
      question_air_id,
      community_id,
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
      community_id,
      agent_user,
      '管理費包含游泳池維護嗎？想估算一年總開銷。',
      FALSE,
      'answered',
      0,
      41,
      NOW() - INTERVAL '1 day'
    )
  ON CONFLICT (id) DO UPDATE SET
    question = EXCLUDED.question,
    is_anonymous = EXCLUDED.is_anonymous,
    status = EXCLUDED.status,
    views_count = EXCLUDED.views_count;

  -- Answers (fixed IDs to stay idempotent)
  INSERT INTO community_answers (
    id, question_id, author_id, answer, author_type, is_best, likes_count, created_at
  ) VALUES
    (
      answer_air_resident_id,
      question_air_id,
      resident_user,
      '住在 20 樓，關窗後幾乎無聲，只有颱風夜才會聽到風鳴。',
      'resident',
      TRUE,
      5,
      NOW() - INTERVAL '2 days'
    ),
    (
      answer_fee_agent_id,
      question_fee_id,
      agent_user,
      '管理費 95 元/坪，含泳池維護與公共空調電費，半年繳一次。',
      'agent',
      FALSE,
      3,
      NOW() - INTERVAL '20 hours'
    )
  ON CONFLICT (id) DO UPDATE SET
    answer = EXCLUDED.answer,
    author_type = EXCLUDED.author_type,
    is_best = EXCLUDED.is_best,
    likes_count = EXCLUDED.likes_count,
    created_at = EXCLUDED.created_at;
END $$;

COMMIT;
