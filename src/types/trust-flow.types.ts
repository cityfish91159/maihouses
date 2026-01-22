/**
 * Trust Flow 類型定義
 *
 * 統一前後端的安心交易案件類型定義
 *
 * Skills Applied:
 * - [Agentic Architecture] 分離關注點，統一類型
 * - [NASA TypeScript Safety] 完整類型定義
 */

import { z } from "zod";

// ============================================================================
// Constants
// ============================================================================

/** 步驟名稱（6 階段） */
export const TRUST_STEP_NAMES: Record<number, string> = {
  1: "M1 接洽",
  2: "M2 帶看",
  3: "M3 出價",
  4: "M4 斡旋",
  5: "M5 成交",
  6: "M6 交屋",
};

/** 步驟中文名稱 */
export const TRUST_STEP_LABELS: Record<number, string> = {
  1: "已電聯",
  2: "已帶看",
  3: "已出價",
  4: "已斡旋",
  5: "已成交",
  6: "已交屋",
};

/** 步驟描述 */
export const TRUST_STEP_DESCRIPTIONS: Record<number, string> = {
  1: "房仲已與買方電話聯繫",
  2: "房仲已帶買方實地看屋",
  3: "買方已向屋主提出價格",
  4: "正在進行價格協商",
  5: "恭喜！交易已成交",
  6: "完成交屋手續",
};

/** 步驟圖示 */
export const TRUST_STEP_ICONS: Record<number, string> = {
  1: "📞",
  2: "🏠",
  3: "💰",
  4: "📝",
  5: "🤝",
  6: "🔑",
};

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * 案件狀態 Schema
 *
 * [DB-2] 擴展狀態定義，支援案件生命週期管理
 *
 * 狀態說明:
 * - active: 進行中（預設）
 * - dormant: 休眠（30 天無互動）
 * - completed: 成交（M5 完成）
 * - closed_sold_to_other: 他人成交（同物件其他案件 M5）
 * - closed_property_unlisted: 物件下架（房仲下架物件）
 * - closed_inactive: 過期關閉（休眠超過 60 天）
 * - pending: 待處理（向後相容）
 * - cancelled: 已取消（向後相容）
 * - expired: 已過期（向後相容）
 */
export const CaseStatusSchema = z.enum([
  "active",
  "dormant",
  "completed",
  "closed_sold_to_other",
  "closed_property_unlisted",
  "closed_inactive",
  "pending",
  "cancelled",
  "expired",
]);
export type CaseStatus = z.infer<typeof CaseStatusSchema>;

/** 執行者類型 Schema */
export const ActorTypeSchema = z.enum(["agent", "buyer", "system"]);
export type ActorType = z.infer<typeof ActorTypeSchema>;

/** 案件事件 Schema */
export const TrustCaseEventSchema = z.object({
  id: z.string().uuid(),
  step: z.number().int().min(1).max(6),
  step_name: z.string(),
  action: z.string(),
  actor: ActorTypeSchema,
  event_hash: z.string().nullable(),
  detail: z.string().nullable(),
  created_at: z.string(),
});
export type TrustCaseEvent = z.infer<typeof TrustCaseEventSchema>;

/**
 * 案件 Schema
 *
 * [DB-2] 新增 dormant_at, closed_at, closed_reason 欄位
 * [DB-3] 新增 token, token_expires_at 欄位
 */
export const TrustCaseSchema = z.object({
  id: z.string().uuid(),
  buyer_session_id: z.string().nullable(),
  buyer_name: z.string(),
  buyer_contact: z.string().nullable().optional(),
  property_id: z.string().nullable(),
  property_title: z.string(),
  transaction_id: z.string().nullable(),
  current_step: z.number().int().min(1).max(6),
  status: CaseStatusSchema,
  offer_price: z.number().nullable(),
  // [DB-2] 生命週期欄位
  dormant_at: z.string().nullable().optional(),
  closed_at: z.string().nullable().optional(),
  closed_reason: z.string().nullable().optional(),
  // [DB-3] Token 欄位（消費者用 Token 連結進入 Trust Room）
  token: z.string().uuid(),
  token_expires_at: z.string(),
  token_revoked_at: z.string().nullable().optional(),
  // [DB-4] Buyer 欄位（通知用）
  buyer_user_id: z.string().uuid().nullable().optional(),
  buyer_line_id: z.string().nullable().optional(),
  // 時間戳
  created_at: z.string(),
  updated_at: z.string(),
  events_count: z.number().optional(),
  latest_event_at: z.string().nullable().optional(),
});
export type TrustCase = z.infer<typeof TrustCaseSchema>;

/** 案件詳情 Schema（含事件列表） */
export const TrustCaseDetailSchema = TrustCaseSchema.extend({
  events: z.array(TrustCaseEventSchema),
});
export type TrustCaseDetail = z.infer<typeof TrustCaseDetailSchema>;

/** 建立案件請求 Schema */
export const CreateCaseRequestSchema = z.object({
  buyer_name: z.string().min(1, "買方名稱不可為空").max(100),
  property_title: z.string().min(1, "物件標題不可為空").max(200),
  buyer_session_id: z.string().optional(),
  buyer_contact: z.string().max(50).optional(),
  property_id: z.string().optional(),
});
export type CreateCaseRequest = z.infer<typeof CreateCaseRequestSchema>;

/** 建立案件回應 Schema */
export const CreateCaseResponseSchema = z.object({
  success: z.boolean(),
  case_id: z.string().uuid().optional(),
  event_hash: z.string().optional(),
  error: z.string().optional(),
});
export type CreateCaseResponse = z.infer<typeof CreateCaseResponseSchema>;

/** 更新步驟請求 Schema */
export const UpdateStepRequestSchema = z.object({
  new_step: z.number().int().min(1).max(6),
  action: z.string().min(1).max(200),
  actor: ActorTypeSchema.default("agent"),
  detail: z.string().max(500).optional(),
  offer_price: z.number().int().positive().optional(),
});
export type UpdateStepRequest = z.infer<typeof UpdateStepRequestSchema>;

/** 更新步驟回應 Schema */
export const UpdateStepResponseSchema = z.object({
  success: z.boolean(),
  case_id: z.string().uuid().optional(),
  new_step: z.number().int().optional(),
  event_hash: z.string().optional(),
  error: z.string().optional(),
});
export type UpdateStepResponse = z.infer<typeof UpdateStepResponseSchema>;

/** API 回應 Schema */
export const TrustCasesApiResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      cases: z.array(TrustCaseSchema),
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
    })
    .optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    })
    .optional(),
});
export type TrustCasesApiResponse = z.infer<typeof TrustCasesApiResponseSchema>;

// ============================================================================
// Legacy Compatibility Types (與 TrustFlow.tsx 現有格式相容)
// ============================================================================

/**
 * TrustFlow.tsx 使用的舊格式事件
 * 用於轉換層
 */
export interface LegacyTrustEvent {
  id: string;
  step: number;
  stepName: string;
  action: string;
  actor: "agent" | "buyer" | "system";
  timestamp: number;
  hash?: string;
  detail?: string;
}

/**
 * TrustFlow.tsx 使用的舊格式案件
 * 用於轉換層
 *
 * [DB-2] 新增 dormant 和 closed 狀態支援
 * [DB-3] 新增 token 和 tokenExpiresAt 欄位
 */
export interface LegacyTrustCase {
  id: string;
  buyerId: string;
  buyerName: string;
  propertyTitle: string;
  currentStep: number;
  status: "active" | "dormant" | "completed" | "closed" | "pending" | "expired";
  lastUpdate: number;
  offerPrice?: number;
  events: LegacyTrustEvent[];
  // [DB-2] 生命週期欄位
  dormantAt?: number;
  closedAt?: number;
  closedReason?: string;
  // [DB-3] Token 欄位
  token: string;
  tokenExpiresAt: number;
  tokenRevokedAt?: number;
  // [DB-4] Buyer 欄位
  buyerUserId?: string;
  buyerLineId?: string;
}

// ============================================================================
// Transform Functions
// ============================================================================

/** Legacy 狀態 Schema - 用於安全轉換 [DB-2] 新增 dormant, closed */
const LegacyStatusSchema = z.enum([
  "active",
  "dormant",
  "completed",
  "closed",
  "pending",
  "expired",
]);

/**
 * 安全轉換狀態 [NASA TypeScript Safety]
 * 將新狀態映射到 Legacy 格式
 *
 * [DB-2] closed_* 系列統一映射為 "closed"
 */
function toSafeLegacyStatus(status: CaseStatus): LegacyTrustCase["status"] {
  // 先檢查 closed_* 系列，統一映射為 "closed"
  if (status.startsWith("closed_")) {
    return "closed";
  }
  const result = LegacyStatusSchema.safeParse(status);
  if (result.success) return result.data;
  // cancelled 轉為 expired（最接近的語意）
  return "expired";
}

/**
 * 將 API 回應轉換為 TrustFlow.tsx 使用的格式
 *
 * @param apiCase - API 返回的案件資料
 * @param events - API 返回的事件列表
 * @returns LegacyTrustCase 格式
 *
 * [DB-2] 新增 dormantAt, closedAt, closedReason 欄位轉換
 */
export function transformToLegacyCase(
  apiCase: TrustCase,
  events: TrustCaseEvent[] = [],
): LegacyTrustCase {
  // [NASA TypeScript Safety] 使用 Zod safeParse 取代 type assertion
  const result: LegacyTrustCase = {
    id: apiCase.id,
    buyerId: apiCase.buyer_session_id ?? apiCase.id.slice(0, 4).toUpperCase(),
    buyerName: apiCase.buyer_name,
    propertyTitle: apiCase.property_title,
    currentStep: apiCase.current_step,
    status: toSafeLegacyStatus(apiCase.status),
    lastUpdate: new Date(apiCase.updated_at).getTime(),
    // [DB-3] Token 欄位
    token: apiCase.token,
    tokenExpiresAt: new Date(apiCase.token_expires_at).getTime(),
    events: events.map((e) => {
      const event: LegacyTrustEvent = {
        id: e.id,
        step: e.step,
        stepName: e.step_name,
        action: e.action,
        actor: e.actor,
        timestamp: new Date(e.created_at).getTime(),
      };
      // 只有非 null 時才設定可選屬性
      if (e.event_hash !== null) {
        event.hash = e.event_hash;
      }
      if (e.detail !== null) {
        event.detail = e.detail;
      }
      return event;
    }),
  };

  // 只有非 null 時才設定 offerPrice
  if (apiCase.offer_price !== null) {
    result.offerPrice = apiCase.offer_price;
  }

  // [DB-2] 生命週期欄位轉換
  if (apiCase.dormant_at) {
    result.dormantAt = new Date(apiCase.dormant_at).getTime();
  }
  if (apiCase.closed_at) {
    result.closedAt = new Date(apiCase.closed_at).getTime();
  }
  if (apiCase.closed_reason) {
    result.closedReason = apiCase.closed_reason;
  }

  // [DB-3] Token 撤銷欄位轉換
  if (apiCase.token_revoked_at) {
    result.tokenRevokedAt = new Date(apiCase.token_revoked_at).getTime();
  }

  // [DB-4] Buyer 欄位轉換
  if (apiCase.buyer_user_id) {
    result.buyerUserId = apiCase.buyer_user_id;
  }
  if (apiCase.buyer_line_id) {
    result.buyerLineId = apiCase.buyer_line_id;
  }

  return result;
}

/**
 * 將 LegacyTrustCase 轉換為 API 請求格式
 *
 * @param legacyCase - 舊格式案件
 * @returns CreateCaseRequest 格式
 */
export function transformToCreateRequest(
  legacyCase: Partial<LegacyTrustCase>,
): CreateCaseRequest {
  return {
    buyer_name: legacyCase.buyerName ?? "",
    property_title: legacyCase.propertyTitle ?? "",
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 取得步驟名稱
 */
export function getStepName(step: number): string {
  return TRUST_STEP_NAMES[step] ?? `步驟 ${step}`;
}

/**
 * 取得步驟標籤
 */
export function getStepLabel(step: number): string {
  return TRUST_STEP_LABELS[step] ?? `步驟 ${step}`;
}

/**
 * 取得步驟描述
 */
export function getStepDescription(step: number): string {
  return TRUST_STEP_DESCRIPTIONS[step] ?? "";
}

/**
 * 取得步驟圖示
 */
export function getStepIcon(step: number): string {
  return TRUST_STEP_ICONS[step] ?? "📋";
}

/**
 * 檢查步驟是否有效
 */
export function isValidStep(step: number): boolean {
  return step >= 1 && step <= 6;
}

/**
 * 格式化案件狀態
 *
 * [DB-2] 新增 dormant 和 closed_* 狀態的格式化
 */
export function formatCaseStatus(status: CaseStatus): {
  text: string;
  bg: string;
  color: string;
} {
  switch (status) {
    case "active":
      return { text: "進行中", bg: "#dcfce7", color: "#16a34a" };
    case "dormant":
      return { text: "休眠中", bg: "#fef3c7", color: "#d97706" };
    case "completed":
      return { text: "已成交", bg: "#dbeafe", color: "#2563eb" };
    case "closed_sold_to_other":
      return { text: "他人成交", bg: "#f3f4f6", color: "#6b7280" };
    case "closed_property_unlisted":
      return { text: "物件下架", bg: "#f3f4f6", color: "#6b7280" };
    case "closed_inactive":
      return { text: "已過期關閉", bg: "#f3f4f6", color: "#6b7280" };
    case "pending":
      return { text: "待處理", bg: "#fef3c7", color: "#d97706" };
    case "cancelled":
      return { text: "已取消", bg: "#fee2e2", color: "#dc2626" };
    case "expired":
      return { text: "已過期", bg: "#f3f4f6", color: "#6b7280" };
    default:
      return { text: "未知", bg: "#f3f4f6", color: "#6b7280" };
  }
}
