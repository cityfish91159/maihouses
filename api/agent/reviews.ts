import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { cors } from '../lib/cors';
import { logger } from '../lib/logger';
import { getSupabaseAdmin } from '../lib/supabase';
import { verifyAuth, sendAuthError } from '../lib/auth';
import { successResponse, errorResponse, API_ERROR_CODES } from '../lib/apiResponse';
import { CreateReviewPayloadSchema } from '../../src/types/agent-review';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const ReviewQuerySchema = z.object({
  agentId: z.preprocess(
    (value) => {
      const first = Array.isArray(value) ? value[0] : value;
      return typeof first === 'string' ? first.trim() : first;
    },
    z.string().uuid()
  ),
  page: z.preprocess(
    (value) => {
      const first = Array.isArray(value) ? value[0] : value;
      if (first === undefined) return DEFAULT_PAGE;
      const num = Number(first);
      return Number.isFinite(num) ? num : first;
    },
    z.number().int().min(1).default(DEFAULT_PAGE)
  ),
  limit: z.preprocess(
    (value) => {
      const first = Array.isArray(value) ? value[0] : value;
      if (first === undefined) return DEFAULT_LIMIT;
      const num = Number(first);
      return Number.isFinite(num) ? num : first;
    },
    z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT)
  ),
});

const ReviewListRowSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  created_at: z.string(),
  reviewer_id: z.string().uuid().nullable(),
});

const RatingRowSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

const InsertedReviewSchema = z.object({
  id: z.string().uuid(),
});

function maskReviewerName(rawName: string | null | undefined): string {
  const normalized = rawName?.trim() ?? '';
  if (!normalized) return 'User***';
  const [firstChar = 'U'] = Array.from(normalized);
  return `${firstChar}***`;
}

function extractDisplayName(user: { email?: string | null; user_metadata?: unknown } | null): string {
  if (!user) return 'User';

  const metadata = user.user_metadata;
  if (metadata && typeof metadata === 'object') {
    const maybeName = (metadata as { name?: unknown }).name;
    if (typeof maybeName === 'string' && maybeName.trim()) {
      return maybeName.trim();
    }
  }

  if (typeof user.email === 'string' && user.email.trim()) {
    const [localPart] = user.email.split('@');
    if (localPart?.trim()) return localPart.trim();
  }

  return 'User';
}

function calcSummary(ratings: number[]) {
  const distribution: Record<'1' | '2' | '3' | '4' | '5', number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  };

  for (const rating of ratings) {
    const key = String(rating) as keyof typeof distribution;
    if (distribution[key] !== undefined) {
      distribution[key] += 1;
    }
  }

  const total = ratings.length;
  const avgRating = total > 0 ? Math.round((ratings.reduce((acc, cur) => acc + cur, 0) / total) * 10) / 10 : 0;

  return { total, avgRating, distribution };
}

async function buildReviewerNameMap(
  reviewerIds: string[]
): Promise<Map<string, string>> {
  const supabase = getSupabaseAdmin();
  const nameMap = new Map<string, string>();

  await Promise.all(
    reviewerIds.map(async (reviewerId) => {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(reviewerId);
        if (error) {
          nameMap.set(reviewerId, 'User***');
          return;
        }
        nameMap.set(reviewerId, maskReviewerName(extractDisplayName(data.user)));
      } catch {
        nameMap.set(reviewerId, 'User***');
      }
    })
  );

  return nameMap;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  switch (req.method) {
    case 'GET':
      await handleGet(req, res);
      return;
    case 'POST':
      await handlePost(req, res);
      return;
    default:
      res.status(405).json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, 'Method not allowed'));
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse): Promise<void> {
  const queryResult = ReviewQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    res
      .status(400)
      .json(errorResponse(API_ERROR_CODES.INVALID_QUERY, 'Invalid review query'));
    return;
  }

  const { agentId, page, limit } = queryResult.data;
  const offset = (page - 1) * limit;
  const supabase = getSupabaseAdmin();

  try {
    const { data: ratingRowsRaw, error: ratingError } = await supabase
      .from('agent_reviews')
      .select('rating')
      .eq('agent_id', agentId)
      .eq('is_public', true);

    if (ratingError) {
      logger.error('[agent/reviews] summary query failed', {
        agentId,
        error: ratingError.message,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, 'Failed to load review summary'));
      return;
    }

    const ratingRows = z.array(RatingRowSchema).safeParse(ratingRowsRaw ?? []);
    if (!ratingRows.success) {
      logger.error('[agent/reviews] invalid summary payload', {
        agentId,
        error: ratingRows.error.message,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Invalid review summary payload'));
      return;
    }

    const summary = calcSummary(ratingRows.data.map((row) => row.rating));

    const { data: pageRowsRaw, error: pageError } = await supabase
      .from('agent_reviews')
      .select('id, rating, comment, created_at, reviewer_id')
      .eq('agent_id', agentId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (pageError) {
      logger.error('[agent/reviews] list query failed', {
        agentId,
        page,
        limit,
        error: pageError.message,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, 'Failed to load review list'));
      return;
    }

    const pageRows = z.array(ReviewListRowSchema).safeParse(pageRowsRaw ?? []);
    if (!pageRows.success) {
      logger.error('[agent/reviews] invalid review list payload', {
        agentId,
        error: pageRows.error.message,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Invalid review list payload'));
      return;
    }

    const reviewerIds = Array.from(
      new Set(
        pageRows.data
          .map((row) => row.reviewer_id)
          .filter((id): id is string => typeof id === 'string')
      )
    );
    const reviewerNameMap = await buildReviewerNameMap(reviewerIds);

    res.status(200).json(
      successResponse({
        reviews: pageRows.data.map((row) => ({
          id: row.id,
          rating: row.rating,
          comment: row.comment,
          createdAt: row.created_at,
          reviewerName: row.reviewer_id ? (reviewerNameMap.get(row.reviewer_id) ?? 'User***') : 'User***',
        })),
        total: summary.total,
        avgRating: summary.avgRating,
        distribution: summary.distribution,
      })
    );
  } catch (error) {
    logger.error('[agent/reviews] GET unexpected error', {
      agentId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Internal server error'));
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse): Promise<void> {
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    sendAuthError(res, authResult);
    return;
  }

  const bodyResult = CreateReviewPayloadSchema.safeParse(req.body);
  if (!bodyResult.success) {
    res
      .status(400)
      .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid review payload', bodyResult.error.issues));
    return;
  }

  const payload = bodyResult.data;
  const supabase = getSupabaseAdmin();

  try {
    if (payload.trustCaseId) {
      const { data: existingRows, error: existingError } = await supabase
        .from('agent_reviews')
        .select('id')
        .eq('agent_id', payload.agentId)
        .eq('reviewer_id', authResult.userId)
        .eq('trust_case_id', payload.trustCaseId)
        .limit(1);

      if (existingError) {
        logger.error('[agent/reviews] duplicate-check failed', {
          agentId: payload.agentId,
          reviewerId: authResult.userId,
          trustCaseId: payload.trustCaseId,
          error: existingError.message,
        });
        res
          .status(500)
          .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, 'Failed to validate duplicate review'));
        return;
      }

      if ((existingRows ?? []).length > 0) {
        res.status(409).json(errorResponse(API_ERROR_CODES.CONFLICT, 'Review already exists for this case'));
        return;
      }
    }

    const { data, error } = await supabase
      .from('agent_reviews')
      .insert({
        agent_id: payload.agentId,
        reviewer_id: authResult.userId,
        trust_case_id: payload.trustCaseId ?? null,
        property_id: payload.propertyId ?? null,
        rating: payload.rating,
        comment: payload.comment?.trim() ? payload.comment.trim() : null,
        step_completed: 2,
        is_public: true,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json(errorResponse(API_ERROR_CODES.CONFLICT, 'Duplicate review detected'));
        return;
      }

      logger.error('[agent/reviews] insert failed', {
        agentId: payload.agentId,
        reviewerId: authResult.userId,
        error: error.message,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, 'Failed to create review'));
      return;
    }

    const parsedInserted = InsertedReviewSchema.safeParse(data);
    if (!parsedInserted.success) {
      logger.error('[agent/reviews] invalid insert response', {
        agentId: payload.agentId,
        reviewerId: authResult.userId,
        error: parsedInserted.error.message,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Invalid create review response'));
      return;
    }

    res.status(200).json(
      successResponse({
        reviewId: parsedInserted.data.id,
      })
    );
  } catch (error) {
    logger.error('[agent/reviews] POST unexpected error', {
      agentId: payload.agentId,
      reviewerId: authResult.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Internal server error'));
  }
}
