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
  license_number: z.string().nullable().optional(),
  is_verified: z.boolean().nullable().optional(),
  verified_at: z.string().nullable().optional(),
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

const DEFAULT_TRUST_SCORE = 60; // 新房仲起始信任分
const DEFAULT_METRIC = 0;

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
        'id, internal_code, name, avatar_url, company, bio, specialties, certifications, phone, line_id, license_number, is_verified, verified_at, trust_score, encouragement_count, service_rating, review_count, completed_cases, active_listings, joined_at, created_at, points, quota_s, quota_a, visit_count, deal_count'
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
        company: row.company ?? null,
        bio: row.bio ?? null,
        specialties: normalizeStringArray(row.specialties),
        certifications: normalizeStringArray(row.certifications),
        phone: row.phone ?? null,
        line_id: row.line_id ?? null,
        license_number: row.license_number ?? null,
        is_verified: row.is_verified ?? false,
        verified_at: row.verified_at ?? null,
        trust_score: toNumber(row.trust_score, DEFAULT_TRUST_SCORE),
        encouragement_count: toNumber(row.encouragement_count, DEFAULT_METRIC),
        service_rating: toNumber(row.service_rating, DEFAULT_METRIC),
        review_count: toNumber(row.review_count, DEFAULT_METRIC),
        completed_cases: toNumber(row.completed_cases, DEFAULT_METRIC),
        active_listings: toNumber(row.active_listings, DEFAULT_METRIC),
        service_years: calcServiceYears(row.joined_at, row.created_at),
        joined_at: row.joined_at ?? null,
        visit_count: toNumber(row.visit_count, DEFAULT_METRIC),
        deal_count: toNumber(row.deal_count, DEFAULT_METRIC),
        email: authResult.email ?? null,
        points: toNumber(row.points, DEFAULT_METRIC),
        quota_s: toNumber(row.quota_s, DEFAULT_METRIC),
        quota_a: toNumber(row.quota_a, DEFAULT_METRIC),
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
