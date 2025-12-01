/**
 * Vercel API: /api/community/like
 * 
 * 按讚/取消讚 API
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
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: '缺少 postId' });
    }

    // 取得目前按讚狀態
    const { data: post, error: fetchError } = await supabase
      .from('community_posts')
      .select('liked_by, likes_count')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      return res.status(404).json({ error: '找不到此貼文' });
    }

    const likedBy: string[] = post.liked_by || [];
    const isLiked = likedBy.includes(user.id);

    let newLikedBy: string[];
    if (isLiked) {
      // 取消讚
      newLikedBy = likedBy.filter(id => id !== user.id);
    } else {
      // 按讚
      newLikedBy = [...likedBy, user.id];
    }

    // 更新
    const { error: updateError } = await supabase
      .from('community_posts')
      .update({
        liked_by: newLikedBy,
        likes_count: newLikedBy.length
      })
      .eq('id', postId);

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      liked: !isLiked,
      likes_count: newLikedBy.length
    });

  } catch (error: any) {
    console.error('Like API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
