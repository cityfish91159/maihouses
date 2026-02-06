import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { cors } from '../lib/cors';
import { logger } from '../lib/logger';
import { getSupabaseAdmin } from '../lib/supabase';
import { verifyAuth, sendAuthError } from '../lib/auth';
import { successResponse, errorResponse, API_ERROR_CODES } from '../lib/apiResponse';
import { toNumber, normalizeStringArray, calcServiceYears } from '../lib/helpers';

// ============================================================================
// Schemas
// ============================================================================

const AgentMeRowSchema = z.object({
  id: z.string().uuid(),
  internal_code: z.number().nullable().optional(),
  name: z.string(),
  avatar_url: z.string().nullable(),
  company: z.string().nullable(),
  bio: z.string().nullable().optional(),
  specialties: z.array(z.string()).nullable().optional(),
  certifications: z.array(z.string()).nullable().optional(),
  phone: z.string().nullable().optional(),
  line_id: z.string().nullable().optional(),
  trust_score: z.number().nullable().optional(),
  encouragement_count: z.number().nullable().optional(),
  service_rating: z.union([z.number(), z.string()]).nullable().optional(),
  review_count: z.number().nullable().optional(),
  completed_cases: z.number().nullable().optional(),
  active_listings: z.number().nullable().optional(),
  joined_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  points: z.number().nullable().optional(),
  quota_s: z.number().nullable().optional(),
  quota_a: z.number().nullable().optional(),
  visit_count: z.number().nullable().optional(),
  deal_count: z.number().nullable().optional(),
});

// ============================================================================
// Helpers
// ============================================================================

// ============================================================================
// Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, 'Method not allowed'));
    return;
  }

  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    sendAuthError(res, authResult);
    return;
  }

  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from('agents')
      .select(
        'id, internal_code, name, avatar_url, company, bio, specialties, certifications, phone, line_id, trust_score, encouragement_count, service_rating, review_count, completed_cases, active_listings, joined_at, created_at, points, quota_s, quota_a, visit_count, deal_count'
      )
      .eq('id', authResult.userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json(errorResponse(API_ERROR_CODES.NOT_FOUND, '找不到房仲資料'));
        return;
      }
      logger.error('[agent/me] fetch failed', { error: error.message, id: authResult.userId });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '房仲資料載入失敗'));
      return;
    }

    const parsed = AgentMeRowSchema.safeParse(data);
    if (!parsed.success) {
      logger.error('[agent/me] invalid row schema', {
        id: authResult.userId,
        error: parsed.error.message,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '資料格式驗證失敗'));
      return;
    }

    const row = parsed.data;
    res.status(200).json(
      successResponse({
        id: row.id,
        internal_code: row.internal_code ?? undefined,
        name: row.name,
        avatar_url: row.avatar_url,
        company: row.company ?? '邁房子',
        bio: row.bio ?? null,
        specialties: normalizeStringArray(row.specialties),
        certifications: normalizeStringArray(row.certifications),
        phone: row.phone ?? null,
        line_id: row.line_id ?? null,
        trust_score: toNumber(row.trust_score, 60),
        encouragement_count: toNumber(row.encouragement_count, 0),
        service_rating: toNumber(row.service_rating, 0),
        review_count: toNumber(row.review_count, 0),
        completed_cases: toNumber(row.completed_cases, 0),
        active_listings: toNumber(row.active_listings, 0),
        service_years: calcServiceYears(row.joined_at, row.created_at),
        joined_at: row.joined_at ?? null,
        visit_count: toNumber(row.visit_count, 0),
        deal_count: toNumber(row.deal_count, 0),
        email: authResult.email ?? null,
        points: toNumber(row.points, 0),
        quota_s: toNumber(row.quota_s, 0),
        quota_a: toNumber(row.quota_a, 0),
        created_at: row.created_at ?? null,
      })
    );
  } catch (e) {
    logger.error('[agent/me] GET error', {
      error: e instanceof Error ? e.message : e,
      id: authResult.userId,
    });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '伺服器內部錯誤'));
  }
}
