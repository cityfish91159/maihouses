/**
 * Vercel API: /api/community/wall
 * 
 * 社區牆資料 API - 取得貼文、評價、問答
 * 支援權限控制（訪客/會員/住戶）
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient, type PostgrestError } from '@supabase/supabase-js';
import { z } from 'zod';

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

const WALL_QUERY_TYPES = ['posts', 'reviews', 'questions', 'all'] as const;
type WallQueryType = (typeof WALL_QUERY_TYPES)[number];

const VISIBILITY_FILTERS = ['public', 'private'] as const;
type VisibilityFilter = (typeof VISIBILITY_FILTERS)[number];

// UUID v4 正則（第 13 位 = 4，第 17 位 = 8/9/a/b）
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CommunityWallQuerySchema = z.object({
  communityId: z.string().min(1).refine(
    (val) => UUID_V4_REGEX.test(val),
    { message: 'communityId 必須是有效的 UUID 格式' }
  ),
  type: z.enum(WALL_QUERY_TYPES).optional().default('all'),
  visibility: z.enum(VISIBILITY_FILTERS).optional().default('public'),
  includePrivate: z.preprocess(
    value => {
      if (typeof value === 'string') {
        return value === '1' || value.toLowerCase() === 'true';
      }
      if (Array.isArray(value)) {
        return value[0] === '1' || value[0]?.toLowerCase() === 'true';
      }
      return Boolean(value);
    },
    z.boolean().optional().default(false)
  ),
});

const REVIEW_SELECT_FIELDS = buildReviewSelectFields();

class ReviewFetchError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: PostgrestError | Error
  ) {
    super(message);
    this.name = 'ReviewFetchError';
  }
}

function coerceQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function normalizeQueryParams(query: VercelRequest['query']) {
  return {
    communityId: coerceQueryValue(query.communityId),
    type: coerceQueryValue(query.type),
    visibility: coerceQueryValue(query.visibility),
    includePrivate: coerceQueryValue(query.includePrivate),
  };
}

function resolveSupabaseErrorDetails(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as PostgrestError;
    return {
      code: supabaseError.code ?? null,
      details: supabaseError.details ?? null,
      hint: supabaseError.hint ?? null,
      message: supabaseError.message ?? null,
    };
  }

  if (error instanceof Error) {
    return {
      code: null,
      details: error.message,
      hint: null,
      message: error.message,
    };
  }

  return {
    code: null,
    details: null,
    hint: null,
    message: null,
  };
}

function buildReviewSelectFields(): string {
  return [
    'id',
    'community_id',
    'property_id',
    'source',
    'advantage_1',
    'advantage_2',
    'disadvantage',
    'created_at',
  ].join(', ');
}

const ReviewRowSchema = z.object({
  id: z.string().uuid(),
  community_id: z.string().uuid(),
  property_id: z.string().uuid().nullable(),
  source: z.string().nullable(),
  advantage_1: z.string().nullable(),
  advantage_2: z.string().nullable(),
  disadvantage: z.string().nullable(),
  created_at: z.string(),
});
export type ReviewRow = z.infer<typeof ReviewRowSchema>;

const PropertyRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  agent_id: z.string().uuid().nullable(),
});
export type PropertyRow = z.infer<typeof PropertyRowSchema>;

const AgentRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  company: z.string().nullable(),
  visit_count: z.number().nullable().optional(),
  deal_count: z.number().nullable().optional(),
});
export type AgentRow = z.infer<typeof AgentRowSchema>;

export interface ReviewResponseItem {
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
    stats: {
      visits: number;
      deals: number;
    };
  };
}

/**
 * 移除前後空白並確保回傳字串永遠存在，避免前端渲染 undefined。
 */
const cleanText = (value: string | null | undefined): string => (value ?? '').trim();

/**
 * 正規化房仲統計數字，遇到 null / NaN / 負值時回傳 0，避免 UI 出現異常數據。
 */
const normalizeCount = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return 0;
  }
  return value;
};

/**
 * 建立前端使用的房仲資訊 payload，確保缺漏欄位也能顯示友善文字。
 * @param agentRow Supabase agents 資料列
 * @returns 房仲資訊（含 stats）或 undefined
 */
const buildAgentPayload = (agentRow?: AgentRow | null) => {
  if (!agentRow) {
    return undefined;
  }

  return {
    name: agentRow.name || '認證房仲',
    company: agentRow.company || '',
    stats: {
      visits: normalizeCount(agentRow.visit_count ?? undefined),
      deals: normalizeCount(agentRow.deal_count ?? undefined),
    },
  };
};

/**
 * 將單筆 review row 合併 property / agent map，輸出給前端的結構。
 * @param record 原始評價資料列
 * @param propertyMap 查詢後的房源快取
 * @param agentMap 查詢後的房仲快取
 */
const transformReviewRecord = (
  record: ReviewRow,
  propertyMap: Map<string, PropertyRow>,
  agentMap: Map<string, AgentRow>
): ReviewResponseItem => {
  const pros = [record.advantage_1, record.advantage_2]
    .map(value => cleanText(value))
    .filter(Boolean);

  const cons = cleanText(record.disadvantage);
  const property = record.property_id ? propertyMap.get(record.property_id) : undefined;
  const agent = property?.agent_id ? agentMap.get(property.agent_id) : undefined;
  const source = record.source || 'agent';
  const agentPayload = buildAgentPayload(agent);
  const fallbackAgent = agentPayload ?? (source === 'resident'
    ? {
        name: '住戶',
        company: '',
        stats: {
          visits: 0,
          deals: 0,
        },
      }
    : undefined);

  return {
    id: record.id,
    community_id: record.community_id,
    property_id: record.property_id,
    author_id: property?.agent_id ?? null,
    source,
    content: {
      pros,
      cons,
      property_title: property?.title ?? null,
    },
    created_at: record.created_at,
    agent: fallbackAgent,
  };
};

/**
 * 以多階段查詢取得評價與對應房仲資訊，確保未建好關聯時也能回傳資料。
 * @throws ReviewFetchError 當任一步驟查詢失敗時拋出
 */
async function fetchReviewsWithAgents(
  communityId: string,
  limit?: number
): Promise<{ items: ReviewResponseItem[]; total: number }> {
  const { rows, total } = await fetchReviewRows(communityId, limit);
  if (!rows.length) {
    return { items: [], total };
  }

  const propertyMap = await fetchPropertyMap(rows);
  const agentMap = await fetchAgentMap(propertyMap);
  const items = rows.map(row => transformReviewRecord(row, propertyMap, agentMap));
  return { items, total };
}

/**
 * 取得原始評價列表，並以 Zod 驗證資料。
 * 單筆驗證失敗不影響其他資料，僅記錄警告。
 */
async function fetchReviewRows(communityId: string, limit?: number) {
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
    throw new ReviewFetchError('REVIEW_FETCH_FAILED', '無法載入社區評價資料', error);
  }

  // 單筆驗證：失敗的資料跳過，不影響其他資料
  const rawData = (data ?? []) as unknown[];
  const validRows: ReviewRow[] = [];
  const invalidCount = { total: 0, ids: [] as string[] };

  for (const item of rawData) {
    const result = ReviewRowSchema.safeParse(item);
    if (result.success) {
      validRows.push(result.data);
    } else {
      invalidCount.total++;
      if (item && typeof item === 'object' && 'id' in item) {
        invalidCount.ids.push(String((item as Record<string, unknown>).id));
      }
      // 只在開發時記錄詳細錯誤
      if (process.env.NODE_ENV !== 'production') {
        console.warn('ReviewRow validation failed:', item, result.error.flatten());
      }
    }
  }

  if (invalidCount.total > 0) {
    console.warn(`fetchReviewRows: ${invalidCount.total} rows failed validation, skipped. IDs: ${invalidCount.ids.slice(0, 5).join(', ')}${invalidCount.ids.length > 5 ? '...' : ''}`);
  }

  return {
    rows: validRows,
    total: typeof count === 'number' ? count : validRows.length,
  };
}

/**
 * 查詢與評價相關的房源，並建成快取 map。
 */
async function fetchPropertyMap(rows: ReviewRow[]): Promise<Map<string, PropertyRow>> {
  const propertyIds = Array.from(
    new Set(rows.map(row => row.property_id).filter((id): id is string => Boolean(id)))
  );

  if (!propertyIds.length) {
    return new Map();
  }

  const { data, error } = await getSupabase()
    .from('properties')
    .select('id, title, agent_id')
    .in('id', propertyIds);

  if (error) {
    throw new ReviewFetchError('PROPERTY_FETCH_FAILED', '無法載入房源資料', error);
  }

  const parsed = PropertyRowSchema.array().parse(data ?? []);
  return new Map(parsed.map(property => [property.id, property]));
}

/**
 * 查詢房仲資訊並處理欄位尚未建立時的降級情境。
 */
async function fetchAgentMap(propertyMap: Map<string, PropertyRow>): Promise<Map<string, AgentRow>> {
  const agentIds = Array.from(
    new Set(
      Array.from(propertyMap.values())
        .map(property => property.agent_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (!agentIds.length) {
    return new Map();
  }

  const selectAgents = (fields: string) =>
    getSupabase()
      .from('agents')
      .select(fields)
      .in('id', agentIds);

  let { data, error } = await selectAgents('id, name, company, visit_count, deal_count');

  if (error?.code === '42703') {
    // DB 尚未加入 visit/deal 欄位時的容錯：降級為不含統計的查詢
    ({ data, error } = await selectAgents('id, name, company'));
  }

  if (error) {
    throw new ReviewFetchError('AGENT_FETCH_FAILED', '無法載入房仲資料', error);
  }

  const parsed = AgentRowSchema.array().parse(data ?? []);
  return new Map(parsed.map(agent => [agent.id, agent]));
}

export const __reviewTestHelpers = {
  cleanText,
  normalizeCount,
  buildAgentPayload,
  transformReviewRecord,
};

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

  try {
    const { data, error } = await getSupabase()
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .maybeSingle();

    // PGRST116 = 查無資料，42P01 = 表不存在
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      console.warn('resolveViewerContext error:', error.code, error.message);
      // 不 throw，降級為 member 權限
      return { role: 'member', canAccessPrivate: false };
    }

    // 若表不存在或查無資料，給予 member 權限（已登入但未加入社區）
    if (error?.code === '42P01' || !data) {
      return { role: 'member', canAccessPrivate: false };
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
  } catch (err) {
    // 任何未預期的錯誤都降級為 member
    console.warn('resolveViewerContext unexpected error:', err);
    return { role: 'member', canAccessPrivate: false };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const queryParseResult = CommunityWallQuerySchema.safeParse(normalizeQueryParams(req.query));

  if (!queryParseResult.success) {
    return res.status(400).json({
      success: false,
      error: '查詢參數格式錯誤',
      code: 'INVALID_QUERY',
      details: queryParseResult.error.flatten(),
    });
  }

  const { communityId: communityIdStr, includePrivate: wantsPrivate } = queryParseResult.data;
  const requestType: WallQueryType = queryParseResult.data.type;
  const visibilityFilter: VisibilityFilter = queryParseResult.data.visibility;

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
    switch (requestType) {
      case 'posts':
        return await getPosts(res, communityIdStr, visibilityFilter, viewerRole, canAccessPrivate);
      case 'reviews':
        return await getReviews(res, communityIdStr, isAuthenticated);
      case 'questions':
        return await getQuestions(res, communityIdStr, isAuthenticated);
      case 'all':
      default:
        return await getAll(res, communityIdStr, viewerRole, wantsPrivate, canAccessPrivate);
    }
  } catch (error: unknown) {
    if (error instanceof ReviewFetchError) {
      const formatted = resolveSupabaseErrorDetails(error.originalError);
      return res.status(502).json({
        success: false,
        error: error.message,
        code: error.code,
        hint: formatted.hint,
        details: formatted.details,
        cause: formatted.message,
      });
    }

    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
    });
  }
}

// 取得貼文
async function getPosts(
  res: VercelResponse,
  communityId: string,
  visibility: VisibilityFilter,
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
  includePrivate: boolean,
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
  // 非會員：每個問題只顯示前 2 則回答
  const GUEST_ANSWERS_LIMIT = 2;
  const transformedQuestions = (questionsResult.data || []).map((q: any) => {
    const allAnswers = q.answers || [];
    const limitedAnswers = !isAuthenticated && allAnswers.length > GUEST_ANSWERS_LIMIT
      ? allAnswers.slice(0, GUEST_ANSWERS_LIMIT)
      : allAnswers;
    const hasMoreAnswers = !isAuthenticated && allAnswers.length > GUEST_ANSWERS_LIMIT;
    
    return {
      ...q,
      answers: limitedAnswers.map((a: any) => ({
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
      hasMoreAnswers,
      totalAnswers: allAnswers.length,
    };
  });

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
// Deploy trigger: Fri Dec  5 15:10:16 CST 2025
// Deploy trigger: Fri Dec  5 15:55:41 CST 2025
