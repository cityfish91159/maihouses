/**
 * BE-6 | 消費者案件列表 API
 *
 * GET /api/trust/my-cases
 *
 * 支援雙認證模式：
 * 1. JWT 認證（消費者前端）→ 用 buyer_user_id 查詢
 * 2. x-system-key 認證（LINE webhook）→ 用 buyer_line_id 查詢
 *
 * 商業邏輯：
 * - JWT 模式：從 token 取得 userId，查詢 trust_cases.buyer_user_id
 * - system-key 模式：需要 lineUserId 參數，查詢 trust_cases.buyer_line_id
 * - 只回傳 active/dormant 狀態（不回傳已關閉）
 *
 * 架構說明：
 * - 此 Handler 只負責 HTTP 認證與回應格式
 * - 核心查詢邏輯委託給 services/case-query.ts
 *
 * 索引：
 * - idx_trust_cases_buyer_user ON trust_cases(buyer_user_id)
 * - idx_trust_cases_buyer_line ON trust_cases(buyer_line_id)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { SYSTEM_API_KEY } from "./_utils";
import { cors } from "../lib/cors";
import { logger } from "../lib/logger";
import { verifyAuth } from "../lib/auth";
import {
  successResponse,
  errorResponse,
  API_ERROR_CODES,
} from "../lib/apiResponse";
import {
  queryCasesByIdentity,
  getStepName,
  generateTrustRoomUrl,
  type CaseData,
} from "./services/case-query";
import { LineUserIdSchema } from "./constants/validation";
import {
  ERR_METHOD_NOT_ALLOWED,
  ERR_UNAUTHORIZED,
} from "./constants/messages";

// ============================================================================
// Request ID 生成
// ============================================================================

/**
 * 生成請求追蹤 ID
 *
 * 使用 crypto.randomUUID() 生成安全的隨機 ID
 * 用於追蹤單一請求的完整生命週期
 */
function generateRequestId(): string {
  // 使用 crypto.randomUUID() 確保安全隨機性
  // 截取前 8 字元作為簡短 ID，足夠用於日誌追蹤
  return `req-${crypto.randomUUID().slice(0, 8)}`;
}

// ============================================================================
// Zod Schemas
// ============================================================================

/** system-key 模式的查詢參數 */
const SystemKeyQuerySchema = z.object({
  lineUserId: LineUserIdSchema,
});

// ============================================================================
// Response Types（API 回應格式，BE-6 規格）
// ============================================================================

/** API 回應的案件格式 */
type ResponseCase = {
  id: string;
  propertyTitle: string;
  agentName: string;
  currentStep: number;
  stepName: string;
  status: "active" | "dormant";
  trustRoomUrl: string;
  updatedAt: string;
};

/**
 * 將業務邏輯層的 CaseData 轉換為 API 回應格式
 */
function toResponseCase(c: CaseData): ResponseCase {
  return {
    id: c.id,
    propertyTitle: c.propertyTitle,
    agentName: c.agentName,
    currentStep: c.currentStep,
    stepName: getStepName(c.currentStep),
    status: c.status,
    trustRoomUrl: generateTrustRoomUrl(c.id),
    updatedAt: c.updatedAt,
  };
}

// ============================================================================
// Handler
// ============================================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  cors(req, res);

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, ERR_METHOD_NOT_ALLOWED));
    return;
  }

  // 生成請求追蹤 ID（用於追蹤完整請求生命週期）
  const requestId = generateRequestId();

  logger.info("[my-cases] Request received", {
    requestId,
    hasAuth: !!req.headers.authorization,
    hasSystemKey: !!req.headers["x-system-key"],
  });

  // ========================================================================
  // 雙認證模式：JWT 優先，fallback 到 system-key
  // ========================================================================

  // 嘗試 JWT 認證
  const authResult = await verifyAuth(req);

  if (authResult.success) {
    // JWT 認證成功：用 buyer_user_id 查詢
    const userId = authResult.userId;

    logger.info("[my-cases] JWT auth success", {
      requestId,
      userIdMasked: userId.slice(0, 8) + "...",
    });

    const result = await queryCasesByIdentity({ userId });

    if (!result.success) {
      const statusCode = result.code === "INVALID_USER_ID" ? 400 : 500;
      const errorCode = result.code === "INVALID_USER_ID"
        ? API_ERROR_CODES.INVALID_QUERY
        : API_ERROR_CODES.DATA_FETCH_FAILED;
      res.status(statusCode).json(errorResponse(errorCode, result.error));
      return;
    }

    const responseCases = result.data.cases.map(toResponseCase);

    logger.info("[my-cases] JWT response", {
      requestId,
      count: responseCases.length,
    });

    res.status(200).json(successResponse({
      cases: responseCases,
      total: result.data.total,
    }));
    return;
  }

  // JWT 失敗：嘗試 system-key 認證
  const systemKey = req.headers["x-system-key"];

  if (!systemKey || systemKey !== SYSTEM_API_KEY) {
    // 兩種認證都失敗
    res.status(401).json(errorResponse(API_ERROR_CODES.UNAUTHORIZED, ERR_UNAUTHORIZED));
    return;
  }

  // system-key 認證成功：需要 lineUserId 參數
  const queryResult = SystemKeyQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    const firstIssue = queryResult.error.issues[0];
    const message = firstIssue?.path[0] === "lineUserId"
      ? "lineUserId 參數格式錯誤"
      : "查詢參數格式錯誤";
    res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_QUERY, message));
    return;
  }

  const { lineUserId } = queryResult.data;

  logger.info("[my-cases] system-key auth success", {
    requestId,
    lineIdMasked: lineUserId.slice(0, 5) + "...",
  });

  // 用 buyer_line_id 查詢
  const result = await queryCasesByIdentity({ lineUserId });

  if (!result.success) {
    const statusCode = result.code === "INVALID_LINE_ID" ? 400 : 500;
    const errorCode = result.code === "INVALID_LINE_ID"
      ? API_ERROR_CODES.INVALID_QUERY
      : API_ERROR_CODES.DATA_FETCH_FAILED;
    res.status(statusCode).json(errorResponse(errorCode, result.error));
    return;
  }

  const responseCases = result.data.cases.map(toResponseCase);

  logger.info("[my-cases] system-key response", {
    requestId,
    count: responseCases.length,
  });

  res.status(200).json(successResponse({
    cases: responseCases,
    total: result.data.total,
  }));
}
