import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { cors, isAllowedOrigin } from '../lib/cors';
import { logger } from '../lib/logger';
import { getSupabaseAdmin } from '../lib/supabase';
import { verifyAuth } from '../lib/auth';
import { API_ERROR_CODES, errorResponse, successResponse } from '../lib/apiResponse';

const CACHE_CONTROL_HEADER = 'private, max-age=60';

const CommunityMembershipRowSchema = z.object({
  community_id: z.string().uuid(),
});

function enforceMyCors(req: VercelRequest, res: VercelResponse): boolean {
  cors(req, res);

  const rawOrigin = req?.headers?.origin;
  const origin = typeof rawOrigin === 'string' ? rawOrigin : undefined;

  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json(errorResponse(API_ERROR_CODES.FORBIDDEN, '來源網域未被允許'));
    return false;
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  return true;
}

async function fetchLatestActiveMembership(userId: string) {
  return getSupabaseAdmin()
    .from('community_members')
    .select('community_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!enforceMyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res
      .status(405)
      .json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, '僅支援 GET 請求'));
    return;
  }

  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    if (authResult.statusCode === 401) {
      res
        .status(401)
        .json(errorResponse(API_ERROR_CODES.UNAUTHORIZED, '登入已過期，請重新登入'));
      return;
    }

    logger.error('[community/my] verifyAuth failed', null, {
      statusCode: authResult.statusCode,
      error: authResult.error,
    });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '認證服務暫時不可用'));
    return;
  }

  try {
    const membershipResult = await fetchLatestActiveMembership(authResult.userId);

    if (membershipResult.error && membershipResult.error.code !== 'PGRST116') {
      logger.error('[community/my] failed to fetch membership', null, {
        userId: authResult.userId,
        code: membershipResult.error.code,
        message: membershipResult.error.message,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '社區歸屬資料載入失敗'));
      return;
    }

    if (!membershipResult.data) {
      res.setHeader('Cache-Control', CACHE_CONTROL_HEADER);
      res.status(200).json(successResponse(null));
      return;
    }

    const parsedMembership = CommunityMembershipRowSchema.safeParse(membershipResult.data);
    if (!parsedMembership.success) {
      logger.error('[community/my] membership schema validation failed', parsedMembership.error, {
        userId: authResult.userId,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '社區歸屬資料格式錯誤'));
      return;
    }

    res.setHeader('Cache-Control', CACHE_CONTROL_HEADER);
    res
      .status(200)
      .json(successResponse({ communityId: parsedMembership.data.community_id }));
  } catch (error) {
    logger.error('[community/my] unexpected error', error, {
      method: req.method,
    });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '伺服器暫時無法處理請求'));
  }
}
