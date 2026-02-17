import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { enforceCors } from '../lib/cors';
import { logger } from '../lib/logger';
import { getSupabaseAdmin } from '../lib/supabase';
import { API_ERROR_CODES, errorResponse, successResponse } from '../lib/apiResponse';

const QuerySchema = z.object({
  offset: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.coerce.number().int().min(0).default(0)
  ),
  limit: z.preprocess(
    (value) => (Array.isArray(value) ? value[0] : value),
    z.coerce.number().int().min(1).max(100).default(20)
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

function buildPostCountMap(rows: z.infer<typeof PublicPostRowSchema>[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const row of rows) {
    const current = map.get(row.community_id) ?? 0;
    map.set(row.community_id, current + 1);
  }

  return map;
}

function buildCommunityListItems(
  communities: z.infer<typeof CommunityRowSchema>[],
  postCountMap: Map<string, number>
): CommunityListItem[] {
  const mapped = communities.map((community) => {
    const postCount = postCountMap.get(community.id) ?? 0;
    const reviewCount = community.review_count ?? 0;

    return {
      id: community.id,
      name: community.name,
      address: community.address ?? null,
      image: community.cover_image ?? null,
      post_count: postCount,
      review_count: reviewCount,
    };
  });

  return mapped.filter((item) => item.post_count > 0 || item.review_count > 0);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!enforceCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res
      .status(405)
      .json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, `Method ${req.method} Not Allowed`));
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
    const supabase = getSupabaseAdmin();
    const { data: communityData, error: communityError } = await supabase
      .from('communities')
      .select('id, name, address, cover_image, review_count')
      .order('created_at', { ascending: false });

    if (communityError) {
      logger.error('[community/list] failed to fetch communities', communityError);
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '社區清單載入失敗'));
      return;
    }

    const parsedCommunities = CommunityRowSchema.array().safeParse(communityData ?? []);
    if (!parsedCommunities.success) {
      logger.error('[community/list] communities schema validation failed', parsedCommunities.error);
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '社區資料格式錯誤'));
      return;
    }

    if (parsedCommunities.data.length === 0) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
      res.status(200).json(successResponse<CommunityListItem[]>([]));
      return;
    }

    const communityIds = parsedCommunities.data.map((community) => community.id);
    const { data: publicPostData, error: publicPostError } = await supabase
      .from('community_posts')
      .select('community_id')
      .eq('visibility', 'public')
      .in('community_id', communityIds);

    if (publicPostError) {
      logger.error('[community/list] failed to fetch public post counts', publicPostError);
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '社區貼文統計載入失敗'));
      return;
    }

    const parsedPublicPosts = PublicPostRowSchema.array().safeParse(publicPostData ?? []);
    if (!parsedPublicPosts.success) {
      logger.error('[community/list] post-count schema validation failed', parsedPublicPosts.error);
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '社區貼文統計格式錯誤'));
      return;
    }

    const postCountMap = buildPostCountMap(parsedPublicPosts.data);
    const allItems = buildCommunityListItems(parsedCommunities.data, postCountMap);
    const pagedItems = allItems.slice(offset, offset + limit);

    const responseValidation = CommunityListItemSchema.array().safeParse(pagedItems);
    if (!responseValidation.success) {
      logger.error('[community/list] response schema validation failed', responseValidation.error);
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '社區清單回應格式錯誤'));
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json(successResponse(responseValidation.data));
  } catch (error) {
    logger.error('[community/list] unexpected error', error, {
      method: req.method,
      query: req.query,
    });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '伺服器暫時無法處理請求'));
  }
}
