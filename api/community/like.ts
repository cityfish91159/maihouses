/**
 * Vercel API: /api/community/like
 *
 * 按讚/取消讚 API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { enforceCors } from '../lib/cors';
import { logger } from '../lib/logger';

// Zod Schema for request validation
const LikeRequestSchema = z.object({
  postId: z.string().uuid('postId 必須是有效的 UUID'),
});

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
  if (!enforceCors(req, res)) return;

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
    const parsed = LikeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
    }
    const { postId } = parsed.data;

    // 取得貼文（含 visibility 以檢查權限）
    const { data: post, error: fetchError } = await getSupabase()
      .from('community_posts')
      .select('liked_by, likes_count, visibility')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({ error: '找不到此貼文' });
    }

    // 權限驗證：私密貼文需已登入（已在上方驗證）
    // MVP：登入用戶都能操作私密牆，未來可加社區成員驗證
    // if (post.visibility === 'private') { ... }

    const likedBy: string[] = post.liked_by || [];
    const isLiked = likedBy.includes(user.id);

    let newLikedBy: string[];
    if (isLiked) {
      // 取消讚
      newLikedBy = likedBy.filter((id) => id !== user.id);
    } else {
      // 按讚
      newLikedBy = [...likedBy, user.id];
    }

    // 更新
    const { error: updateError } = await getSupabase()
      .from('community_posts')
      .update({
        liked_by: newLikedBy,
        likes_count: newLikedBy.length,
      })
      .eq('id', postId);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      liked: !isLiked,
      likes_count: newLikedBy.length,
    });
  } catch (error: unknown) {
    logger.error('[community/like] API error', error, {
      userId: user.id,
      postId: req.body?.postId,
    });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
