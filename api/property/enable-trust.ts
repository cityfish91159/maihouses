/**
 * BE-2: 補開安心服務 API
 *
 * POST /api/property/enable-trust
 * Body: { propertyId: string }
 *
 * 商業邏輯：
 * - 只允許 false → true（補開）
 * - 不允許 true → false（防止關閉逃避收費）
 * - 只有物件擁有者（agent）可以操作
 *
 * Skills Applied:
 * - [Backend Safeguard] 權限驗證 + RLS 概念
 * - [NASA TypeScript Safety] Zod 驗證 + 完整類型
 * - [Audit Logging] 審計日誌
 * - [No Lazy Implementation] 完整實作
 * - [Security Audit] 防止越權操作
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import {
  successResponse,
  errorResponse,
  API_ERROR_CODES,
} from "../lib/apiResponse";
import { logger } from "../lib/logger";
import { cors } from "../lib/cors";

// ============================================================================
// Environment & Supabase Client
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error("[property/enable-trust] Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl ?? "", supabaseKey ?? "");

// ============================================================================
// Schemas [NASA TypeScript Safety]
// ============================================================================

/** 請求 Body Schema */
const EnableTrustRequestSchema = z.object({
  propertyId: z.string().uuid("propertyId 必須是有效的 UUID"),
});

/** 物件查詢結果 Schema */
const PropertyRowSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  trust_enabled: z.boolean(),
});

// ============================================================================
// Error Codes [業務邏輯錯誤碼]
// ============================================================================

const BE2_ERROR_CODES = {
  ALREADY_ENABLED: "ALREADY_ENABLED",
  PROPERTY_NOT_FOUND: "PROPERTY_NOT_FOUND",
  NOT_OWNER: "NOT_OWNER",
} as const;

// ============================================================================
// Auth Helper [Backend Safeguard]
// ============================================================================

interface AuthResult {
  success: true;
  agentId: string;
}

interface AuthError {
  success: false;
  status: number;
  code: string;
  message: string;
}

/**
 * 從 Supabase Auth Header 驗證用戶身份
 * 使用 service_role 驗證 JWT，取得 user_id
 */
async function verifyAgentAuth(
  req: VercelRequest
): Promise<AuthResult | AuthError> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      success: false,
      status: 401,
      code: API_ERROR_CODES.UNAUTHORIZED,
      message: "未提供認證 Token",
    };
  }

  const token = authHeader.substring(7);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        success: false,
        status: 401,
        code: API_ERROR_CODES.UNAUTHORIZED,
        message: "Token 無效或已過期",
      };
    }

    // 驗證是否為 agent（檢查 agents 表）
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (agentError || !agent) {
      return {
        success: false,
        status: 403,
        code: API_ERROR_CODES.FORBIDDEN,
        message: "只有房仲可以操作此功能",
      };
    }

    return { success: true, agentId: agent.id };
  } catch {
    return {
      success: false,
      status: 401,
      code: API_ERROR_CODES.UNAUTHORIZED,
      message: "認證驗證失敗",
    };
  }
}

// ============================================================================
// Handler
// ============================================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  cors(req, res);

  // OPTIONS 預檢請求
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // 只允許 POST
  if (req.method !== "POST") {
    res
      .status(405)
      .json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, "只允許 POST 方法"));
    return;
  }

  // Step 1: 驗證身份
  const authResult = await verifyAgentAuth(req);
  if (!authResult.success) {
    res
      .status(authResult.status)
      .json(errorResponse(authResult.code, authResult.message));
    return;
  }

  const { agentId } = authResult;

  // Step 2: 驗證請求 Body
  const bodyResult = EnableTrustRequestSchema.safeParse(req.body);
  if (!bodyResult.success) {
    res
      .status(400)
      .json(
        errorResponse(
          API_ERROR_CODES.INVALID_INPUT,
          "請求參數格式錯誤",
          bodyResult.error.issues
        )
      );
    return;
  }

  const { propertyId } = bodyResult.data;

  try {
    // Step 3: 查詢物件
    const { data: property, error: fetchError } = await supabase
      .from("properties")
      .select("id, agent_id, trust_enabled")
      .eq("id", propertyId)
      .single();

    if (fetchError || !property) {
      logger.warn("[property/enable-trust] Property not found", { propertyId });
      res
        .status(404)
        .json(
          errorResponse(BE2_ERROR_CODES.PROPERTY_NOT_FOUND, "找不到此物件")
        );
      return;
    }

    // Step 4: Zod 驗證查詢結果
    const propertyResult = PropertyRowSchema.safeParse(property);
    if (!propertyResult.success) {
      logger.error("[property/enable-trust] Property data validation failed", {
        propertyId,
        issues: propertyResult.error.issues,
      });
      res
        .status(500)
        .json(
          errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "物件資料格式異常")
        );
      return;
    }

    const validProperty = propertyResult.data;

    // Step 5: 驗證擁有權 [Backend Safeguard - RLS 概念]
    if (validProperty.agent_id !== agentId) {
      logger.warn("[property/enable-trust] Not owner", {
        propertyId,
        agentId,
        ownerId: validProperty.agent_id,
      });
      res
        .status(403)
        .json(errorResponse(BE2_ERROR_CODES.NOT_OWNER, "您不是此物件的擁有者"));
      return;
    }

    // Step 6: 檢查是否已開啟 [商業邏輯：只允許 false → true]
    if (validProperty.trust_enabled) {
      logger.info("[property/enable-trust] Already enabled", { propertyId });
      res
        .status(400)
        .json(
          errorResponse(
            BE2_ERROR_CODES.ALREADY_ENABLED,
            "安心服務已開啟，無法重複操作"
          )
        );
      return;
    }

    // Step 7: 更新為 true（加上 trust_enabled=false 避免併發重複）
    const { data: updatedRows, error: updateError } = await supabase
      .from("properties")
      .update({ trust_enabled: true, updated_at: new Date().toISOString() })
      .eq("id", propertyId)
      .eq("trust_enabled", false)
      .select("id");

    if (updateError) {
      logger.error("[property/enable-trust] Update failed", {
        propertyId,
        error: updateError.message,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "更新失敗"));
      return;
    }

    if (!updatedRows || updatedRows.length === 0) {
      logger.info("[property/enable-trust] Already enabled (race)", {
        propertyId,
      });
      res
        .status(400)
        .json(
          errorResponse(
            BE2_ERROR_CODES.ALREADY_ENABLED,
            "安心服務已開啟，無法重複操作"
          )
        );
      return;
    }

    // Step 8: Audit Log
    logger.info("[property/enable-trust] Success", {
      propertyId,
      agentId,
      action: "ENABLE_TRUST",
    });

    // Step 9: 成功回應
    res.status(200).json(
      successResponse({
        propertyId,
        trustEnabled: true,
        message: "安心服務已成功開啟",
      })
    );
  } catch (e) {
    logger.error("[property/enable-trust] Unexpected error", {
      error: e instanceof Error ? e.message : "Unknown",
      propertyId,
    });
    res
      .status(500)
      .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "伺服器內部錯誤"));
  }
}
