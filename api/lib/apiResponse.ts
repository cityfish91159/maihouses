/**
 * API 統一回應格式
 *
 * 確保所有 API 端點返回一致的格式，方便前端處理
 *
 * 特性：
 * - 統一的 success 標記
 * - 結構化的錯誤訊息（code + message）
 * - 支援 warnings（部分失敗情境）
 * - 不洩露實現細節
 *
 * 使用範例：
 * ```typescript
 * import { successResponse, errorResponse } from "../lib/apiResponse";
 *
 * // 成功回應
 * return res.status(200).json(successResponse({ items: [] }));
 *
 * // 成功但有警告
 * return res.status(200).json(
 *   successResponse({ items: [] }, [
 *     { code: "PARTIAL_FAILURE", message: "部分資料載入失敗" }
 *   ])
 * );
 *
 * // 錯誤回應
 * return res.status(400).json(
 *   errorResponse("INVALID_INPUT", "查詢參數格式錯誤")
 * );
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * API 統一回應格式
 *
 * @template T - 成功時的資料類型
 */
export interface ApiResponse<T = unknown> {
  /** 請求是否成功 */
  success: boolean;

  /** 成功時的資料 */
  data?: T;

  /** 失敗時的錯誤資訊 */
  error?: {
    /** 錯誤碼（語意化，前端可依此做錯誤處理） */
    code: string;

    /** 使用者友善的錯誤訊息 */
    message: string;

    /** 額外細節（僅用於調試，不洩露實現細節） */
    details?: unknown;
  };

  /** 警告訊息（部分成功情境） */
  warnings?: Array<{
    /** 警告碼 */
    code: string;

    /** 警告訊息 */
    message: string;
  }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 檢查警告陣列是否有效且非空
 * @internal
 */
function hasValidWarnings(
  warnings?: Array<{ code: string; message: string }>,
): boolean {
  return Boolean(warnings && warnings.length > 0);
}

/**
 * 檢查 details 是否應該包含在回應中
 * @internal
 */
function shouldIncludeDetails(details: unknown): boolean {
  return details !== undefined;
}

/**
 * 建立成功回應
 *
 * @template T - 資料類型
 * @param data - 回應資料
 * @param warnings - 可選的警告訊息（用於部分失敗情境）
 * @returns 統一格式的成功回應
 *
 * @example
 * ```typescript
 * // 純成功
 * successResponse({ items: [], total: 0 })
 *
 * // 成功但有警告
 * successResponse({ items: [] }, [
 *   { code: "REVIEWS_FETCH_FAILED", message: "評價載入失敗" }
 * ])
 * ```
 */
export function successResponse<T>(
  data: T,
  warnings?: ApiResponse<T>["warnings"],
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(hasValidWarnings(warnings) ? { warnings } : {}),
  };
}

/**
 * 建立錯誤回應
 *
 * @param code - 錯誤碼（優先使用 API_ERROR_CODES 常數，也可自訂）
 * @param message - 使用者友善的錯誤訊息
 * @param details - 可選的額外細節（僅用於調試）
 * @returns 統一格式的錯誤回應
 *
 * @example
 * ```typescript
 * // 使用常數錯誤碼（推薦）
 * errorResponse(API_ERROR_CODES.NOT_FOUND, "找不到對應的社區")
 *
 * // 自訂錯誤碼（向後兼容）
 * errorResponse("CUSTOM_ERROR", "自訂錯誤")
 *
 * // 帶調試資訊（開發環境）
 * errorResponse(API_ERROR_CODES.INVALID_INPUT, "輸入格式錯誤", {
 *   fields: ["email", "phone"]
 * })
 * ```
 */
export function errorResponse(
  code: ApiErrorCode | (string & {}),
  message: string,
  details?: unknown,
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      ...(shouldIncludeDetails(details) ? { details } : {}),
    },
  };
}

// ============================================================================
// Common Error Codes (語意化錯誤碼)
// ============================================================================

/**
 * 常用錯誤碼定義
 *
 * 使用這些常數確保錯誤碼一致性
 */
export const API_ERROR_CODES = {
  // 客戶端錯誤 (4xx)
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_QUERY: "INVALID_QUERY",
  NOT_FOUND: "NOT_FOUND",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",

  // 伺服器錯誤 (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATA_FETCH_FAILED: "DATA_FETCH_FAILED",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // 業務邏輯錯誤
  COMMUNITY_NOT_FOUND: "COMMUNITY_NOT_FOUND",
  FORBIDDEN_PRIVATE_POSTS: "FORBIDDEN_PRIVATE_POSTS",
  REVIEW_FETCH_FAILED: "REVIEW_FETCH_FAILED",
  PROPERTY_FETCH_FAILED: "PROPERTY_FETCH_FAILED",
  AGENT_FETCH_FAILED: "AGENT_FETCH_FAILED",
} as const;

/**
 * 常用警告碼定義
 */
export const API_WARNING_CODES = {
  PARTIAL_FAILURE: "PARTIAL_FAILURE",
  REVIEWS_FETCH_FAILED: "REVIEWS_FETCH_FAILED",
  AGENT_DATA_UNAVAILABLE: "AGENT_DATA_UNAVAILABLE",
  COMMUNITY_DATA_INCOMPLETE: "COMMUNITY_DATA_INCOMPLETE",
} as const;

// ============================================================================
// Type Exports
// ============================================================================

/**
 * API 錯誤碼型別
 *
 * 從 API_ERROR_CODES 常數推導而來，提供 TypeScript 自動完成提示
 */
export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/**
 * API 警告碼型別
 *
 * 從 API_WARNING_CODES 常數推導而來，提供 TypeScript 自動完成提示
 */
export type ApiWarningCode =
  (typeof API_WARNING_CODES)[keyof typeof API_WARNING_CODES];

// ============================================================================
// Export
// ============================================================================

export default {
  successResponse,
  errorResponse,
  API_ERROR_CODES,
  API_WARNING_CODES,
};
