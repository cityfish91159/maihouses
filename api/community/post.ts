/**
 * Vercel API: /api/community/post
 *
 * 社區牆發文 API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '../lib/logger';

// ============================================
// Types
// ============================================

/** [NASA TypeScript Safety] 社區成員角色 Schema */
const CommunityRoleSchema = z.enum(['resident', 'agent', 'moderator', 'member', 'visitor']);
type CommunityRole = z.infer<typeof CommunityRoleSchema>;

/** 所有有效的社區角色（用於運行時驗證） */
const VALID_COMMUNITY_ROLES: readonly CommunityRole[] = CommunityRoleSchema.options;

/** 社區成員驗證結果 */
interface MembershipVerifyResult {
  isMember: boolean;
  role: CommunityRole | null;
  error: PostgrestError | null;
}

/** 允許發私密牆的角色 */
const PRIVATE_POST_ALLOWED_ROLES: CommunityRole[] = ['resident', 'agent', 'moderator'];

// ============================================
// Zod Schemas (P3: Request Body Validation)
// ============================================

/** 發文請求 Schema */
const PostRequestSchema = z.object({
  communityId: z.string().min(1, '社區 ID 不能為空'),
  content: z.string().min(1, '內容不能為空').max(10000, '內容過長'),
  visibility: z.enum(['public', 'private']).default('public'),
  postType: z.string().default('general'),
  images: z.array(z.string()).default([]),
});

/** 發文請求類型 */
type PostRequest = z.infer<typeof PostRequestSchema>;

// ============================================
// Supabase Client
// ============================================

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

// ============================================
// 社區成員驗證函式（可重用）
// ============================================

/**
 * 驗證用戶是否為社區成員
 *
 * @param communityId 社區 ID
 * @param userId 用戶 ID
 * @returns 驗證結果：isMember、role、error
 */
async function verifyCommunityMember(
  communityId: string,
  userId: string
): Promise<MembershipVerifyResult> {
  const { data: membership, error: memberError } = await getSupabase()
    .from('community_members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();

  // PGRST116 = 查無資料，不算錯誤
  if (memberError && memberError.code !== 'PGRST116') {
    return { isMember: false, role: null, error: memberError };
  }

  if (!membership) {
    return { isMember: false, role: null, error: null };
  }

  // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as CommunityRole
  const roleResult = CommunityRoleSchema.safeParse(membership.role);
  const role: CommunityRole | null = roleResult.success ? roleResult.data : null;

  return {
    isMember: true,
    role,
    error: null,
  };
}

/**
 * 檢查角色是否允許發私密牆
 */
function canPostToPrivateWall(role: CommunityRole | null): boolean {
  if (!role) return false;
  return PRIVATE_POST_ALLOWED_ROLES.includes(role);
}

/**
 * 審計日誌：記錄未授權的發文嘗試
 */
function logUnauthorizedPostAttempt(
  userId: string,
  communityId: string,
  role: CommunityRole | null,
  reason: string
): void {
  // 在生產環境中，這裡可以整合 Sentry 或其他日誌服務
  const timestamp = new Date().toISOString();
  const logEntry = {
    event: 'UNAUTHORIZED_PRIVATE_POST_ATTEMPT',
    timestamp,
    userId,
    communityId,
    role,
    reason,
  };

  // 使用 process.env.NODE_ENV 判斷，避免生產環境輸出
  if (process.env.NODE_ENV !== 'production') {
    // 開發環境：輸出到 stderr 以便調試
    process.stderr.write(`[AUDIT] ${JSON.stringify(logEntry)}\n`);
  }
  // 生產環境：可整合 Sentry.captureMessage() 或 logger 服務
}

// ============================================
// 導出測試輔助函式
// ============================================

export const __postTestHelpers = {
  verifyCommunityMember,
  canPostToPrivateWall,
  PRIVATE_POST_ALLOWED_ROLES,
  PostRequestSchema,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // P2: CORS 安全 - 限制允許的 Origin
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') ?? [
    'http://localhost:5173',
    'https://pchome-online.github.io',
  ];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 驗證登入
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '請先登入' });
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
    error: authError,
  } = await getSupabase().auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: '登入已過期，請重新登入' });
  }

  try {
    // P3: 使用 Zod Schema 驗證 Request Body
    const parseResult = PostRequestSchema.safeParse(req.body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: firstError?.message ?? '請求格式錯誤',
      });
    }

    const { communityId, content, visibility, postType, images } = parseResult.data;

    // 私密牆需要驗證是否為社區成員
    if (visibility === 'private') {
      // 使用抽象的 verifyCommunityMember 函式
      const {
        isMember,
        role,
        error: memberError,
      } = await verifyCommunityMember(communityId, user.id);

      // 資料庫錯誤
      if (memberError) {
        return res.status(500).json({
          success: false,
          error: '驗證社區成員失敗',
        });
      }

      // 非社區成員
      if (!isMember) {
        logUnauthorizedPostAttempt(user.id, communityId, role, 'NOT_MEMBER');
        return res.status(403).json({
          success: false,
          error: '只有社區成員可以發文到私密牆',
        });
      }

      // 使用 canPostToPrivateWall 檢查角色權限
      if (!canPostToPrivateWall(role)) {
        logUnauthorizedPostAttempt(user.id, communityId, role, 'INSUFFICIENT_ROLE');
        return res.status(403).json({
          success: false,
          error: '權限不足，無法發文到私密牆',
        });
      }
    }

    const { data, error } = await getSupabase()
      .from('community_posts')
      .insert({
        community_id: communityId,
        author_id: user.id,
        content,
        visibility,
        post_type: postType,
        images,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      message: visibility === 'private' ? '已發布到私密牆' : '已發布到公開牆',
    });
  } catch (error: unknown) {
    logger.error('[community/post] API error', error, {
      userId: user.id,
      communityId: req.body?.communityId,
    });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
