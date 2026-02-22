import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { cors, isAllowedOrigin } from '../lib/cors';
import { logger } from '../lib/logger';
import { getSupabaseAdmin } from '../lib/supabase';
import { API_ERROR_CODES, errorResponse, successResponse } from '../lib/apiResponse';

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CACHE_CONTROL_HEADER = 's-maxage=60, stale-while-revalidate=300';

const QuerySchema = z.object({
  offset: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.coerce.number().int().min(0).default(DEFAULT_OFFSET)
  ),
  limit: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT)
  ),
});

const CommunityRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  review_count: z.number().int().nonnegative().nullable().optional(),
});

const PublicPostRowSchema = z.object({
  community_id: z.string().uuid(),
});

const CommunityListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().nullable(),
  image: z.string().nullable(),
  post_count: z.number().int().nonnegative(),
  review_count: z.number().int().nonnegative(),
});

type CommunityListItem = z.infer<typeof CommunityListItemSchema>;
type CommunityRow = z.infer<typeof CommunityRowSchema>;
type PublicPostRow = z.infer<typeof PublicPostRowSchema>;

function buildPostCountMap(rows: PublicPostRow[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const row of rows) {
    const current = map.get(row.community_id) ?? 0;
    map.set(row.community_id, current + 1);
  }

  return map;
}

function buildCommunityListItems(
  communities: CommunityRow[],
  postCountMap: Map<string, number>
): CommunityListItem[] {
  return communities.map((community) => ({
    id: community.id,
    name: community.name,
    address: community.address ?? null,
    image: community.cover_image ?? null,
    post_count: postCountMap.get(community.id) ?? 0,
    review_count: community.review_count ?? 0,
  }));
}

function enforceListCors(req: VercelRequest, res: VercelResponse): boolean {
  cors(req, res);

  const rawOrigin = req?.headers?.origin;
  const origin = typeof rawOrigin === 'string' ? rawOrigin : undefined;

  if (origin && !isAllowedOrigin(origin)) {
    res
      .status(403)
      .json(errorResponse(API_ERROR_CODES.FORBIDDEN, '來源網域未被允許'));
    return false;
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  return true;
}

async function fetchCommunityBatch(
  start: number,
  batchSize: number
): Promise<{ rows: CommunityRow[]; reachedEnd: boolean }> {
  const supabase = getSupabaseAdmin();
  const { data: communityBatchData, error: communityError } = await supabase
    .from('communities')
    .select('id, name, address, cover_image, review_count')
    .order('created_at', { ascending: false })
    .range(start, start + batchSize - 1);

  if (communityError) {
    logger.error('[community/list] failed to fetch communities', communityError, { start, batchSize });
    throw new Error('COMMUNITY_FETCH_FAILED');
  }

  const parsed = CommunityRowSchema.array().safeParse(communityBatchData ?? []);
  if (!parsed.success) {
    logger.error('[community/list] communities schema validation failed', parsed.error, {
      start,
      batchSize,
    });
    throw new Error('COMMUNITY_SCHEMA_INVALID');
  }

  return {
    rows: parsed.data,
    reachedEnd: parsed.data.length < batchSize,
  };
}

async function fetchPostCountMap(communities: CommunityRow[]): Promise<Map<string, number>> {
  const needsPostCountIds = communities.map((community) => community.id);

  if (needsPostCountIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = getSupabaseAdmin();
  const { data: publicPostData, error: publicPostError } = await supabase
    .from('community_posts')
    .select('community_id')
    .eq('visibility', 'public')
    .in('community_id', needsPostCountIds);

  if (publicPostError) {
    logger.error('[community/list] failed to fetch public post counts', publicPostError, {
      communityCount: needsPostCountIds.length,
    });
    throw new Error('POST_COUNT_FETCH_FAILED');
  }

  const parsedPublicPosts = PublicPostRowSchema.array().safeParse(publicPostData ?? []);
  if (!parsedPublicPosts.success) {
    logger.error('[community/list] post-count schema validation failed', parsedPublicPosts.error, {
      communityCount: needsPostCountIds.length,
    });
    throw new Error('POST_COUNT_SCHEMA_INVALID');
  }

  return buildPostCountMap(parsedPublicPosts.data);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!enforceListCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res
      .status(405)
      .json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, '僅支援 GET 請求'));
    return;
  }

  const queryResult = QuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    res
      .status(400)
      .json(
        errorResponse(API_ERROR_CODES.INVALID_QUERY, '查詢參數格式錯誤', queryResult.error.issues)
      );
    return;
  }

  const { offset, limit } = queryResult.data;

  try {
    const { rows } = await fetchCommunityBatch(offset, limit);
    const postCountMap = await fetchPostCountMap(rows);
    const pagedItems = buildCommunityListItems(rows, postCountMap);

    // #8c: 僅回傳有公開內容的社區
    const visibleItems = pagedItems.filter(
      (item) => item.post_count > 0 || item.review_count > 0
    );

    const responseValidation = CommunityListItemSchema.array().safeParse(visibleItems);
    if (!responseValidation.success) {
      logger.error('[community/list] response schema validation failed', responseValidation.error);
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '社區清單回應格式錯誤'));
      return;
    }

    res.setHeader('Cache-Control', CACHE_CONTROL_HEADER);
    res.status(200).json(successResponse(responseValidation.data));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';

    if (errorMessage === 'COMMUNITY_FETCH_FAILED') {
      res.status(500).json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '社區清單載入失敗'));
      return;
    }
    if (errorMessage === 'POST_COUNT_FETCH_FAILED') {
      res.status(500).json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '社區貼文統計載入失敗'));
      return;
    }
    if (errorMessage === 'COMMUNITY_SCHEMA_INVALID') {
      res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '社區資料格式錯誤'));
      return;
    }
    if (errorMessage === 'POST_COUNT_SCHEMA_INVALID') {
      res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '社區貼文統計格式錯誤'));
      return;
    }

    logger.error('[community/list] unexpected error', error, {
      method: req.method,
      query: req.query,
    });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '伺服器暫時無法處理請求'));
  }
}
