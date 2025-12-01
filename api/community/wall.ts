/**
 * Vercel API: /api/community/wall
 * 
 * 社區牆資料 API - 取得貼文、評價、問答
 * 支援權限控制（訪客/會員/住戶）
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 非會員可見數量
const GUEST_LIMIT = 2;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { communityId, type, visibility } = req.query;

  if (!communityId) {
    return res.status(400).json({ error: '缺少 communityId' });
  }

  // 檢查登入狀態
  const authHeader = req.headers.authorization;
  let userId: string | null = null;
  let isAuthenticated = false;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        isAuthenticated = true;
      }
    } catch (e) {
      console.warn('Token 驗證失敗');
    }
  }

  try {
    switch (type) {
      case 'posts':
        return await getPosts(res, communityId as string, visibility as string, isAuthenticated);
      case 'reviews':
        return await getReviews(res, communityId as string, isAuthenticated);
      case 'questions':
        return await getQuestions(res, communityId as string, isAuthenticated);
      case 'all':
      default:
        return await getAll(res, communityId as string, isAuthenticated);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// 取得貼文
async function getPosts(
  res: VercelResponse,
  communityId: string,
  visibility: string = 'public',
  isAuthenticated: boolean
) {
  let query = supabase
    .from('community_posts')
    .select('*', { count: 'exact' })
    .eq('community_id', communityId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  // 非登入用戶只能看公開牆
  if (!isAuthenticated) {
    query = query.eq('visibility', 'public').limit(GUEST_LIMIT);
  } else if (visibility === 'public') {
    query = query.eq('visibility', 'public');
  } else if (visibility === 'private') {
    query = query.eq('visibility', 'private');
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return res.status(200).json({
    success: true,
    data,
    total: count || data?.length || 0,
    limited: !isAuthenticated,
    visibleCount: isAuthenticated ? (data?.length || 0) : GUEST_LIMIT
  });
}

// 取得評價
// 注意：community_reviews 是 View，資料來源為 properties 表的兩好一公道欄位
async function getReviews(
  res: VercelResponse,
  communityId: string,
  isAuthenticated: boolean
) {
  let query = supabase
    .from('community_reviews') // 這是 View，對接 properties 表
    .select('*', { count: 'exact' })
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (!isAuthenticated) {
    query = query.limit(GUEST_LIMIT);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  // 取得社區的 AI 總結
  const { data: community } = await supabase
    .from('communities')
    .select('two_good, one_fair, story_vibe')
    .eq('id', communityId)
    .single();

  return res.status(200).json({
    success: true,
    data,
    summary: community || null,
    total: count || 0,
    limited: !isAuthenticated,
    hiddenCount: !isAuthenticated && count ? Math.max(0, count - GUEST_LIMIT) : 0
  });
}

// 取得問答
async function getQuestions(
  res: VercelResponse,
  communityId: string,
  isAuthenticated: boolean
) {
  const { data, error, count } = await supabase
    .from('community_questions')
    .select(`
      *,
      answers:community_answers(
        id, answer, author_type, likes_count, is_best, created_at
      )
    `, { count: 'exact' })
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  // 非會員：隱藏部分回答內容
  if (!isAuthenticated && data) {
    data.forEach((q: any) => {
      if (q.answers && q.answers.length > 1) {
        // 只顯示第一則回答，其餘截斷
        q.answers = q.answers.slice(0, 1).map((a: any) => ({
          ...a,
          answer: a.answer.slice(0, 50) + '...'
        }));
        q.hasMoreAnswers = true;
      }
    });
  }

  return res.status(200).json({
    success: true,
    data,
    total: count || 0,
    limited: !isAuthenticated
  });
}

// 取得全部資料（首次載入用）
async function getAll(
  res: VercelResponse,
  communityId: string,
  isAuthenticated: boolean
) {
  // 並行請求
  const [postsResult, reviewsResult, questionsResult, communityResult] = await Promise.all([
    supabase
      .from('community_posts')
      .select('*', { count: 'exact' })
      .eq('community_id', communityId)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(isAuthenticated ? 20 : GUEST_LIMIT),
    
    supabase
      .from('community_reviews')
      .select('*', { count: 'exact' })
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(isAuthenticated ? 20 : GUEST_LIMIT),
    
    supabase
      .from('community_questions')
      .select(`
        *,
        answers:community_answers(id, answer, author_type, is_best)
      `, { count: 'exact' })
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(5),
    
    supabase
      .from('communities')
      .select('id, name, address, two_good, one_fair, story_vibe, completeness_score')
      .eq('id', communityId)
      .single()
  ]);

  return res.status(200).json({
    success: true,
    community: communityResult.data,
    posts: {
      data: postsResult.data || [],
      total: postsResult.count || 0,
      limited: !isAuthenticated
    },
    reviews: {
      data: reviewsResult.data || [],
      total: reviewsResult.count || 0,
      limited: !isAuthenticated,
      hiddenCount: !isAuthenticated && reviewsResult.count 
        ? Math.max(0, reviewsResult.count - GUEST_LIMIT) 
        : 0
    },
    questions: {
      data: questionsResult.data || [],
      total: questionsResult.count || 0
    },
    isAuthenticated
  });
}
