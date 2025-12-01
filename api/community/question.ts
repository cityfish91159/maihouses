/**
 * Vercel API: /api/community/question
 * 
 * 準住戶問答 API - 發問和回答
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 驗證登入
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '請先登入' });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return res.status(401).json({ error: '登入已過期，請重新登入' });
  }

  try {
    const { action, communityId, questionId, content, isAnonymous = true } = req.body;

    if (!action) {
      return res.status(400).json({ error: '缺少 action 參數' });
    }

    switch (action) {
      case 'ask':
        return await handleAsk(res, user.id, communityId, content, isAnonymous);
      case 'answer':
        return await handleAnswer(res, user.id, questionId, content);
      default:
        return res.status(400).json({ error: '無效的 action' });
    }

  } catch (error: any) {
    console.error('Question API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// 發問
async function handleAsk(
  res: VercelResponse,
  userId: string,
  communityId: string,
  question: string,
  isAnonymous: boolean
) {
  if (!communityId || !question) {
    return res.status(400).json({ error: '缺少 communityId 或 question' });
  }

  if (question.length < 5) {
    return res.status(400).json({ error: '問題至少需要 5 個字' });
  }

  const { data, error } = await supabase
    .from('community_questions')
    .insert({
      community_id: communityId,
      author_id: userId,
      question,
      is_anonymous: isAnonymous
    })
    .select()
    .single();

  if (error) throw error;

  return res.status(200).json({
    success: true,
    data,
    message: '問題已發布，住戶會收到通知'
  });
}

// 回答
async function handleAnswer(
  res: VercelResponse,
  userId: string,
  questionId: string,
  answer: string
) {
  if (!questionId || !answer) {
    return res.status(400).json({ error: '缺少 questionId 或 answer' });
  }

  if (answer.length < 10) {
    return res.status(400).json({ error: '回答至少需要 10 個字' });
  }

  // 判斷回答者類型（這裡簡化處理，實際需查詢用戶身份）
  // TODO: 查詢用戶是否為該社區住戶或房仲
  const authorType = 'resident'; // 預設為住戶

  const { data, error } = await supabase
    .from('community_answers')
    .insert({
      question_id: questionId,
      author_id: userId,
      answer,
      author_type: authorType
    })
    .select()
    .single();

  if (error) throw error;

  return res.status(200).json({
    success: true,
    data,
    message: '回答已發布'
  });
}
