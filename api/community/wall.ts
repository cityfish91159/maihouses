/**
 * Vercel API: /api/community/wall
 * 
 * 社區牆資料 API - 取得貼文、評價、問答
 * 支援權限控制（訪客/會員/住戶）
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 延遲初始化 Supabase client，避免模組載入時因環境變數缺失而崩潰
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

// 非會員可見數量
const GUEST_LIMIT = 2;

const REVIEW_SELECT_FIELDS = `
  id,
  community_id,
  property_id,
  source,
  advantage_1,
  advantage_2,
  disadvantage,
  created_at,
  property:properties!community_reviews_property_id_fkey (
    title,
    agent:agents!properties_agent_id_fkey (
      id,
      name,
      company,
      visit_count,
      deal_count
    )
  )
`;

type ReviewAgentRow = {
  id?: string | null;
  name?: string | null;
  company?: string | null;
  visit_count?: number | null;
  deal_count?: number | null;
};

type ReviewPropertyRow = {
  title?: string | null;
  agent?: ReviewAgentRow | null;
};

type ReviewRecord = {
  id: string;
  community_id: string;
  property_id: string | null;
  source: string | null;
  advantage_1: string | null;
  advantage_2: string | null;
  disadvantage: string | null;
  created_at: string;
  property?: ReviewPropertyRow | null;
};

interface ReviewResponseItem {
  id: string;
  community_id: string;
  property_id: string | null;
  author_id: string | null;
  source: string;
  content: {
    pros: string[];
    cons: string;
    property_title: string | null;
  };
  created_at: string;
  agent?: {
    name: string;
    company?: string;
    stats?: {
      visits: number;
      deals: number;
    };
  };
}

const cleanText = (value: string | null | undefined): string => (value ?? '').trim();

const normalizeCount = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  return value < 0 ? 0 : value;
};

const buildAgentPayload = (agentRow?: ReviewAgentRow | null) => {
  if (!agentRow) {
    return undefined;
  }

  return {
    name: agentRow.name || '認證房仲',
    company: agentRow.company || '',
    stats: {
      visits: normalizeCount(agentRow.visit_count),
      deals: normalizeCount(agentRow.deal_count),
    },
  };
};

const transformReviewRecord = (record: ReviewRecord): ReviewResponseItem => {
  const pros = [record.advantage_1, record.advantage_2]
    .map(value => cleanText(value))
    .filter(value => Boolean(value));

  const cons = cleanText(record.disadvantage);
  const propertyTitle = record.property?.title ?? null;
  const source = record.source || 'agent';
  const agentPayload = buildAgentPayload(record.property?.agent);
  const fallbackAgent = agentPayload ?? (source === 'resident'
    ? { name: '住戶', company: '' }
    : undefined);

  return {
    id: record.id,
    community_id: record.community_id,
    property_id: record.property_id,
    author_id: record.property?.agent?.id ?? null,
    source,
    content: {
      pros,
      cons,
      property_title: propertyTitle,
    },
    created_at: record.created_at,
    agent: fallbackAgent,
  };
};

async function fetchReviewsWithAgents(
  communityId: string,
  limit?: number
): Promise<{ items: ReviewResponseItem[]; total: number }> {
  let query = getSupabase()
    .from('community_reviews')
    .select(REVIEW_SELECT_FIELDS, { count: 'exact' })
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (typeof limit === 'number') {
    query = query.limit(limit);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  const items = (data as ReviewRecord[] | null)?.map(transformReviewRecord) ?? [];
  return {
    items,
    total: typeof count === 'number' ? count : items.length,
  };
}

type ViewerRole = 'guest' | 'member' | 'resident' | 'agent';

interface ViewerContext {
  role: ViewerRole;
  canAccessPrivate: boolean;
}

const PRIVATE_ACCESS_ROLES: ViewerRole[] = ['resident', 'agent'];

async function resolveViewerContext(communityId: string, userId: string | null): Promise<ViewerContext> {
  if (!userId) {
    return { role: 'guest', canAccessPrivate: false };
  }

  const { data, error } = await getSupabase()
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  const membershipRole = (data?.role ?? '').toLowerCase();
  let viewerRole: ViewerRole;

  switch (membershipRole) {
    case 'resident':
      viewerRole = 'resident';
      break;
    case 'agent':
      viewerRole = 'agent';
      break;
    case 'moderator':
      // 尚未在前端公開 moderator 角色，暫時視同 resident 權限
      viewerRole = 'resident';
      break;
    default:
      viewerRole = 'member';
      break;
  }

  return {
    role: viewerRole,
    canAccessPrivate: PRIVATE_ACCESS_ROLES.includes(viewerRole),
  };
}

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
  const communityIdStr = communityId as string;

  // 檢查登入狀態
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { data: { user } } = await getSupabase().auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    } catch (e) {
      console.warn('Token 驗證失敗');
    }
  }

  const { role: viewerRole, canAccessPrivate } = await resolveViewerContext(communityIdStr, userId);
  const isAuthenticated = viewerRole !== 'guest';

  try {
    switch (type) {
      case 'posts':
        return await getPosts(res, communityIdStr, visibility as string, viewerRole, canAccessPrivate);
      case 'reviews':
        return await getReviews(res, communityIdStr, isAuthenticated);
      case 'questions':
        return await getQuestions(res, communityIdStr, isAuthenticated);
      case 'all':
      default:
        return await getAll(res, communityIdStr, viewerRole, wantsPrivate, canAccessPrivate);
    }
  } catch (error: any) {
    console.error('API Error:', error);
    // 返回更詳細的錯誤訊息用於除錯
    return res.status(500).json({ 
      error: error.message,
      hint: error.hint || null,
      details: error.details || null,
      code: error.code || null
    });
  }
}

// 取得貼文
async function getPosts(
  res: VercelResponse,
  communityId: string,
  visibility: string = 'public',
  viewerRole: ViewerRole,
  canAccessPrivate: boolean
) {
  const isAuthenticated = viewerRole !== 'guest';
  let query = getSupabase()
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
    if (!canAccessPrivate) {
      return res.status(403).json({
        success: false,
        error: '無權限檢視私密貼文',
        code: 'FORBIDDEN_PRIVATE_POSTS'
      });
    }
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
  const limit = isAuthenticated ? undefined : GUEST_LIMIT;
  const [reviewResult, communityResult] = await Promise.all([
    fetchReviewsWithAgents(communityId, limit),
    getSupabase()
      .from('communities')
      .select('two_good, one_fair, story_vibe')
      .eq('id', communityId)
      .single()
  ]);

  const hiddenCount = !isAuthenticated ? Math.max(0, reviewResult.total - reviewResult.items.length) : 0;

  return res.status(200).json({
    success: true,
    data: reviewResult.items,
    summary: communityResult.data || null,
    total: reviewResult.total,
    limited: !isAuthenticated,
    hiddenCount,
  });
}

// 取得問答
async function getQuestions(
  res: VercelResponse,
  communityId: string,
  isAuthenticated: boolean
) {
  const { data, error, count } = await getSupabase()
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
  viewerRole: ViewerRole,
  includePrivate: boolean = false,
  canAccessPrivate: boolean
) {
  const isAuthenticated = viewerRole !== 'guest';
  // 只有已登入且具有社區身分並且有參數要求才回傳私密貼文
  const allowPrivate = includePrivate && canAccessPrivate;

  // 公開貼文查詢
  const publicPostsQuery = getSupabase()
    .from('community_posts')
    .select('*', { count: 'exact' })
    .eq('community_id', communityId)
    .eq('visibility', 'public')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(isAuthenticated ? 20 : GUEST_LIMIT);

  // 私密貼文查詢（僅登入且要求時）
  const privatePostsQuery = allowPrivate
    ? getSupabase()
        .from('community_posts')
        .select('*', { count: 'exact' })
        .eq('community_id', communityId)
        .eq('visibility', 'private')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)
    : Promise.resolve({ data: [], count: 0, error: null });

  // 並行請求
  const reviewLimit = isAuthenticated ? 20 : GUEST_LIMIT;

  const [publicPostsResult, privatePostsResult, reviewsResult, questionsResult, communityResult] = await Promise.all([
    publicPostsQuery,
    privatePostsQuery,
    
    // Reviews: 取得帶房仲統計資訊的評價
    fetchReviewsWithAgents(communityId, reviewLimit),
    
    // Questions: 取得問答與回覆
    getSupabase()
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
    
    getSupabase()
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
      items: reviewsResult.items,
      total: reviewsResult.total,
    },
    questions: {
      items: transformedQuestions,
      total: questionsResult.count || 0,
    },
    isAuthenticated,
    viewerRole
  });
}
