/**
 * API 認證中間件
 * 使用 Supabase Auth 驗證 JWT Token
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// 認證結果類型
interface AuthResult {
  success: true;
  userId: string;
  email?: string;
}

interface AuthError {
  success: false;
  error: string;
  statusCode: number;
}

export type AuthVerificationResult = AuthResult | AuthError;

/**
 * 從 Authorization header 取得 Bearer token
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1] ?? null;
}

/**
 * 驗證 Supabase JWT Token 並返回用戶資訊
 *
 * @param req - Vercel Request 物件
 * @returns 驗證結果，包含 userId 或錯誤訊息
 */
export async function verifyAuth(
  req: VercelRequest,
): Promise<AuthVerificationResult> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      success: false,
      error: "Server configuration error: Missing Supabase credentials",
      statusCode: 500,
    };
  }

  // 取得 Authorization header
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return {
      success: false,
      error: "Missing or invalid Authorization header",
      statusCode: 401,
    };
  }

  // 使用 Supabase Client 驗證 token
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      success: false,
      error: error?.message ?? "Invalid or expired token",
      statusCode: 401,
    };
  }

  return {
    success: true,
    userId: user.id,
    email: user.email,
  };
}

/**
 * 驗證請求者身份是否與 agentId 匹配
 *
 * @param req - Vercel Request 物件
 * @param agentId - 請求中的 agentId
 * @returns 驗證結果
 */
export async function verifyAgentAuth(
  req: VercelRequest,
  agentId: string,
): Promise<AuthVerificationResult> {
  const authResult = await verifyAuth(req);

  if (!authResult.success) {
    return authResult;
  }

  // 比對 userId 與 agentId
  if (authResult.userId !== agentId) {
    return {
      success: false,
      error: "Unauthorized: Agent ID does not match authenticated user",
      statusCode: 403,
    };
  }

  return authResult;
}

/**
 * 認證錯誤回應的輔助函數
 */
export function sendAuthError(
  res: VercelResponse,
  authResult: AuthError,
): VercelResponse {
  return res.status(authResult.statusCode).json({
    success: false,
    error: authResult.error,
  });
}

// isDevEnvironment 已在 env.ts 中定義，使用 re-export
export { isDevEnvironment } from "./env";
