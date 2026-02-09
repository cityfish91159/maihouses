import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { verifyAuth } from '../lib/auth';
import { cors } from '../lib/cors';
import { logger } from '../lib/logger';
import { getSupabaseAdmin } from '../lib/supabase';
import { API_ERROR_CODES, errorResponse } from '../lib/apiResponse';
import {
  ToggleReviewLikePayloadSchema,
  ReviewLikeResponseSchema,
  ReviewLikeQuerySchema,
} from '../../src/types/community-review-like';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PropertyForLikeSchema = z.object({
  id: z.string().uuid(),
  public_id: z.string().min(1),
  advantage_1: z.string().nullable().optional(),
  advantage_2: z.string().nullable().optional(),
  disadvantage: z.string().nullable().optional(),
});

type PropertyForLike = z.infer<typeof PropertyForLikeSchema>;

function normalizeText(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function hasReviewSummary(property: PropertyForLike): boolean {
  return (
    normalizeText(property.advantage_1).length > 0 &&
    normalizeText(property.advantage_2).length > 0 &&
    normalizeText(property.disadvantage).length > 0
  );
}

async function resolveProperty(rawPropertyId: string): Promise<PropertyForLike | null> {
  const supabase = getSupabaseAdmin();
  const trimmed = rawPropertyId.trim();
  const propertyQuery = supabase
    .from('properties')
    .select('id, public_id, advantage_1, advantage_2, disadvantage')
    .limit(1);

  const propertyResult = UUID_REGEX.test(trimmed)
    ? await propertyQuery.eq('id', trimmed).maybeSingle()
    : await propertyQuery.eq('public_id', trimmed).maybeSingle();

  if (propertyResult.error) {
    throw propertyResult.error;
  }

  if (!propertyResult.data) {
    return null;
  }

  const parsed = PropertyForLikeSchema.safeParse(propertyResult.data);
  if (!parsed.success) {
    logger.error('[community/review-like] invalid property payload', parsed.error, {
      propertyId: trimmed,
    });
    throw new Error('Invalid property payload');
  }

  return parsed.data;
}

async function countLikes(propertyId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('community_review_likes')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function isLikedByUser(propertyId: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('community_review_likes')
    .select('id')
    .eq('property_id', propertyId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function toggleLike(propertyId: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data: existingLike, error: findError } = await supabase
    .from('community_review_likes')
    .select('id')
    .eq('property_id', propertyId)
    .eq('user_id', userId)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existingLike?.id) {
    const { error: deleteError } = await supabase
      .from('community_review_likes')
      .delete()
      .eq('id', existingLike.id)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    return false;
  }

  const { error: insertError } = await supabase.from('community_review_likes').insert({
    property_id: propertyId,
    user_id: userId,
  });

  if (insertError) {
    // idempotent result when concurrent request hits unique index
    if (insertError.code === '23505') {
      return true;
    }
    throw insertError;
  }

  return true;
}

function toResponse(liked: boolean, totalLikes: number) {
  const parsed = ReviewLikeResponseSchema.safeParse({
    success: true,
    liked,
    totalLikes,
  });

  if (!parsed.success) {
    throw new Error('Invalid review-like response payload');
  }

  return parsed.data;
}

async function handleGet(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  const parsedQuery = ReviewLikeQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res
      .status(400)
      .json(errorResponse(API_ERROR_CODES.INVALID_QUERY, 'Invalid query: propertyId is required'));
  }

  const property = await resolveProperty(parsedQuery.data.propertyId);
  if (!property) {
    return res.status(404).json(errorResponse(API_ERROR_CODES.NOT_FOUND, 'Property not found'));
  }

  const totalLikes = await countLikes(property.id);

  let liked = false;
  const authResult = await verifyAuth(req);
  if (authResult.success) {
    liked = await isLikedByUser(property.id, authResult.userId);
  }

  return res.status(200).json(toResponse(liked, totalLikes));
}

async function handlePost(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    return res
      .status(authResult.statusCode)
      .json(errorResponse(API_ERROR_CODES.UNAUTHORIZED, authResult.error));
  }

  const parsedBody = ToggleReviewLikePayloadSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res
      .status(400)
      .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid payload: propertyId is required'));
  }

  const property = await resolveProperty(parsedBody.data.propertyId);
  if (!property) {
    return res.status(404).json(errorResponse(API_ERROR_CODES.NOT_FOUND, 'Property not found'));
  }

  if (!hasReviewSummary(property)) {
    return res
      .status(422)
      .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, 'Property review summary is incomplete'));
  }

  const liked = await toggleLike(property.id, authResult.userId);
  const totalLikes = await countLikes(property.id);

  return res.status(200).json(toResponse(liked, totalLikes));
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  cors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return await handleGet(req, res);
    }

    if (req.method === 'POST') {
      return await handlePost(req, res);
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res
      .status(405)
      .json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, `Method ${req.method} Not Allowed`));
  } catch (error) {
    logger.error('[community/review-like] unexpected error', error, {
      method: req.method,
      query: req.query,
      hasBody: Boolean(req.body),
    });
    return res
      .status(500)
      .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Failed to process review-like request'));
  }
}
