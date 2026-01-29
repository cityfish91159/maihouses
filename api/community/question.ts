/**
 * Vercel API: /api/community/question
 *
 * 準住戶問答 API - 發問和回答
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '../lib/logger';

// Zod Schemas for request validation
const AskRequestSchema = z.object({
  action: z.literal('ask'),
  communityId: z.string().uuid('communityId 必須是有效的 UUID'),
  content: z.string().min(5, '問題至少需要 5 個字').max(2000),
  isAnonymous: z.boolean().optional().default(true),
});

const AnswerRequestSchema = z.object({
  action: z.literal('answer'),
  questionId: z.string().uuid('questionId 必須是有效的 UUID'),
  content: z.string().min(10, '回答至少需要 10 個字').max(5000),
});

const QuestionRequestSchema = z.discriminatedUnion('action', [
  AskRequestSchema,
  AnswerRequestSchema,
]);

// 延遲初始化 Supabase client
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數');
  }

  supabase = createClient(url, key);
  return supabase;
}

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
  const {
    data: { user },
    error: authError,
  } = await getSupabase().auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: '登入已過期，請重新登入' });
  }

  try {
    // 驗證 request body
    const parsed = QuestionRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    if (data.action === 'ask') {
      return await handleAsk(res, user.id, data.communityId, data.content, data.isAnonymous);
    } else {
      return await handleAnswer(res, user.id, data.questionId, data.content);
    }
  } catch (error: unknown) {
    logger.error('[community/question] API error', error, {
      userId: user.id,
      action: req.body?.action,
    });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
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
  // Zod 已驗證，直接執行
  const { data, error } = await getSupabase()
    .from('community_questions')
    .insert({
      community_id: communityId,
      author_id: userId,
      question,
      is_anonymous: isAnonymous,
    })
    .select()
    .single();

  if (error) throw error;

  return res.status(200).json({
    success: true,
    data,
    message: '問題已發布，住戶會收到通知',
  });
}

// 回答
async function handleAnswer(
  res: VercelResponse,
  userId: string,
  questionId: string,
  answer: string
) {
  // Zod 已驗證，直接執行
  // 判斷回答者類型：查詢是否為房仲
  let authorType: 'resident' | 'agent' = 'resident';

  const { data: agentProfile } = await getSupabase()
    .from('agents')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (agentProfile) {
    authorType = 'agent';
  }

  const { data, error } = await getSupabase()
    .from('community_answers')
    .insert({
      question_id: questionId,
      author_id: userId,
      answer,
      author_type: authorType,
    })
    .select()
    .single();

  if (error) throw error;

  return res.status(200).json({
    success: true,
    data,
    message: '回答已發布',
  });
}
