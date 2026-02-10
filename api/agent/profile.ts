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

const AgentIdSchema = z.preprocess(
  (value) => (Array.isArray(value) ? value[0] : value),
  z.string().uuid()
);

const ProfileQuerySchema = z.object({
  id: AgentIdSchema,
});

const PhoneSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') return value;
    return value.trim().replace(/[\s-]/g, '');
  },
  z.union([z.string().regex(/^09\d{8}$/), z.null()])
);

const UpdateProfileSchema = z
  .object({
    // 顯示於房源頁標題，避免過長造成卡片與行動版折行破版。
    name: z.string().trim().min(1).max(50).optional(),
    // 公司名稱允許 null，支援使用者主動清空欄位。
    company: z.union([z.string().trim().min(1).max(100), z.null()]).optional(),
    // 自介文案上限 500 字，控制詳情頁資訊密度。
    bio: z.union([z.string().trim().max(500), z.null()]).optional(),
    // 專長/證照上限 10 項，避免標籤區域過度擁擠。
    specialties: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
    certifications: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
    // 台灣手機格式，允許前端輸入連字號，後端統一正規化為 0912345678。
    phone: PhoneSchema.optional(),
    // LINE ID 允許清空，並限制最大長度避免資料汙染。
    line_id: z.union([z.string().trim().min(1).max(50), z.null()]).optional(),
    // 證照格式差異大，以長度範圍防止異常輸入。
    license_number: z.union([z.string().trim().min(5).max(100), z.null()]).optional(),
    // 使用 ISO datetime，方便與資料庫 timestamp 欄位直接對接。
    joined_at: z.string().datetime().optional(),
  })
  .strict();

const AgentRowSchema = z.object({
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
});

// ============================================================================
// Helpers
// ============================================================================

const DEFAULT_TRUST_SCORE = 60; // 新房仲起始信任分
const DEFAULT_METRIC = 0;

function buildProfilePayload(row: z.infer<typeof AgentRowSchema>) {
  return {
    id: row.id,
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
    internal_code: row.internal_code ?? undefined,
  };
}

// ============================================================================
// Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  switch (req.method) {
    case 'GET':
      return handleGetProfile(req, res);
    case 'PUT':
      return handleUpdateProfile(req, res);
    default:
      res.status(405).json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, 'Method not allowed'));
  }
}

// ============================================================================
// GET /api/agent/profile?id=...
// ============================================================================

async function handleGetProfile(req: VercelRequest, res: VercelResponse): Promise<void> {
  const queryResult = ProfileQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    res
      .status(400)
      .json(errorResponse(API_ERROR_CODES.INVALID_QUERY, '查詢參數格式錯誤'));
    return;
  }

  const { id } = queryResult.data;
  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from('agents')
      .select(
        'id, internal_code, name, avatar_url, company, bio, specialties, certifications, phone, line_id, license_number, is_verified, verified_at, trust_score, encouragement_count, service_rating, review_count, completed_cases, active_listings, joined_at, created_at'
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json(errorResponse(API_ERROR_CODES.NOT_FOUND, '找不到房仲資料'));
        return;
      }
      logger.error('[agent/profile] fetch failed', { error: error.message, id });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '房仲資料載入失敗'));
      return;
    }

    const parsed = AgentRowSchema.safeParse(data);
    if (!parsed.success) {
      logger.error('[agent/profile] invalid row schema', { id, error: parsed.error.message });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '資料格式驗證失敗'));
      return;
    }

    res.status(200).json(successResponse(buildProfilePayload(parsed.data)));
  } catch (e) {
    logger.error('[agent/profile] GET error', { error: e instanceof Error ? e.message : e, id });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '伺服器內部錯誤'));
  }
}

// ============================================================================
// PUT /api/agent/profile
// ============================================================================

async function handleUpdateProfile(req: VercelRequest, res: VercelResponse): Promise<void> {
  const authResult = await verifyAuth(req);
  if (!authResult.success) {
    sendAuthError(res, authResult);
    return;
  }

  const bodyResult = UpdateProfileSchema.safeParse(req.body);
  if (!bodyResult.success) {
    res
      .status(400)
      .json(
        errorResponse(API_ERROR_CODES.INVALID_INPUT, '請求參數格式錯誤', bodyResult.error.issues)
      );
    return;
  }

  const payload = bodyResult.data;
  const updateData = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(updateData).length === 0) {
    res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '沒有可更新的欄位'));
    return;
  }

  const supabase = getSupabaseAdmin();

  try {
    const { data, error } = await supabase
      .from('agents')
      .update(updateData)
      .eq('id', authResult.userId)
      .select('id')
      .single();

    if (error) {
      logger.error('[agent/profile] update failed', {
        error: error.message,
        id: authResult.userId,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '更新失敗，請稍後再試'));
      return;
    }

    if (!data) {
      res.status(404).json(errorResponse(API_ERROR_CODES.NOT_FOUND, '找不到房仲資料'));
      return;
    }

    res.status(200).json(
      successResponse({
        updated_at: new Date().toISOString(),
      })
    );
  } catch (e) {
    logger.error('[agent/profile] PUT error', {
      error: e instanceof Error ? e.message : e,
      id: authResult.userId,
    });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '伺服器內部錯誤'));
  }
}
