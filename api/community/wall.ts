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

  const { communityId, type, visibility, includePrivate } = req.query;
  const wantsPrivate = includePrivate === '1' || includePrivate === 'true';

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
        return await getAll(res, communityId as string, isAuthenticated, wantsPrivate);
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

  // 快取 60 秒，300 秒內可返回舊資料同時重新驗證
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

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
  isAuthenticated: boolean,
  includePrivate: boolean = false
) {
  // 只有已登入且明確要求才能取得私密貼文
  const canAccessPrivate = isAuthenticated && includePrivate;

  // 公開貼文查詢
  const publicPostsQuery = supabase
    .from('community_posts')
    .select('*', { count: 'exact' })
    .eq('community_id', communityId)
    .eq('visibility', 'public')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(isAuthenticated ? 20 : GUEST_LIMIT);

  // 私密貼文查詢（僅登入且要求時）
  const privatePostsQuery = canAccessPrivate
    ? supabase
        .from('community_posts')
        .select('*', { count: 'exact' })
        .eq('community_id', communityId)
        .eq('visibility', 'private')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)
    : Promise.resolve({ data: [], count: 0, error: null });

  // 並行請求
  const [publicPostsResult, privatePostsResult, reviewsResult, questionsResult, communityResult] = await Promise.all([
    publicPostsQuery,
    privatePostsQuery,
    
    // Reviews: 從 community_reviews 取得 advantage_1/advantage_2/disadvantage
    supabase
      .from('community_reviews')
      .select(`
        id,
        community_id,
        property_id,
        source,
        advantage_1,
        advantage_2,
        disadvantage,
        created_at
      `, { count: 'exact' })
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(isAuthenticated ? 20 : GUEST_LIMIT),
    
    // Questions: 取得問答與回覆
    supabase
      .from('community_questions')
      .select(`
        id,
        community_id,
        author_id,
        question,
        is_anonymous,
        status,
        answers_count,
        views_count,
        created_at,
        answers:community_answers(
          id,
          author_id,
          answer,
          author_type,
          is_best,
          likes_count,
          created_at
        )
      `, { count: 'exact' })
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(5),
    
    supabase
      .from('communities')
      .select('id, name, address, two_good, one_fair, story_vibe, completeness_score, year_built, total_units, management_fee, builder')
      .eq('id', communityId)
      .single()
  ]);

  // 組裝 communityInfo（對齊前端 CommunityInfo 型別）
  // 若 DB 欄位不存在，回傳 null 讓前端處理顯示邏輯
  const rawCommunity = communityResult.data;
  const communityInfo = rawCommunity ? {
    name: rawCommunity.name || '未知社區',
    year: rawCommunity.year_built ?? null,           // null = 前端顯示「未知」
    units: rawCommunity.total_units ?? null,         // null = 前端顯示「-」
    managementFee: rawCommunity.management_fee ?? null,
    builder: rawCommunity.builder || null,           // null = 前端顯示「未知建商」
    members: null,          // 尚未實作統計，誠實回傳 null
    avgRating: null,        // 尚未實作統計，誠實回傳 null
    monthlyInteractions: null,
    forSale: null,
  } : null;

  // 轉換 reviews 格式：DB 的 advantage_1/advantage_2/disadvantage → 前端的 pros/cons
  // 暫時不關聯 agent 資訊（DB schema 需要調整後再支援）
  const transformedReviews = (reviewsResult.data || []).map((review: any) => {
    const pros: string[] = [];
    if (review.advantage_1?.trim()) pros.push(review.advantage_1.trim());
    if (review.advantage_2?.trim()) pros.push(review.advantage_2.trim());
    
    return {
      id: review.id,
      community_id: review.community_id,
      author_id: null,
      content: {
        pros,
        cons: review.disadvantage?.trim() || '',
      },
      created_at: review.created_at,
      // MVP: agent 資訊暫時用 source 欄位判斷
      agent: {
        name: review.source === 'agent' ? '認證房仲' : '住戶',
        company: '',
        stats: {
          visits: 0,
          deals: 0,
        },
      },
    };
  });

  // 轉換 questions 格式：確保 answers 的 content 欄位正確
  const transformedQuestions = (questionsResult.data || []).map((q: any) => ({
    ...q,
    answers: (q.answers || []).map((a: any) => ({
      id: a.id,
      author_id: a.author_id,
      content: a.answer, // DB 欄位是 answer，前端期望 content
      author_type: a.author_type,
      is_best: a.is_best,
      is_expert: a.author_type === 'agent', // 房仲回答標記為專家
      likes_count: a.likes_count,
      created_at: a.created_at,
      author: {
        name: a.author_type === 'agent' ? '認證房仲' : '住戶',
        role: a.author_type,
      },
    })),
  }));

  return res.status(200).json({
    success: true,
    communityInfo,
    posts: {
      public: publicPostsResult.data || [],
      private: privatePostsResult.data || [],
      publicTotal: publicPostsResult.count || 0,
      privateTotal: privatePostsResult.count || 0,
    },
    reviews: {
      items: transformedReviews,
      total: reviewsResult.count || 0,
    },
    questions: {
      items: transformedQuestions,
      total: questionsResult.count || 0,
    },
    isAuthenticated
  });
}
