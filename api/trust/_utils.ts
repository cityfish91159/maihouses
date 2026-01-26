/**
 * Trust Flow 共用工具模組
 *
 * 提供 Trust Room API 共用的功能：
 * - Supabase 客戶端
 * - JWT 驗證
 * - 審計日誌
 * - CORS 處理
 * - IP/User-Agent 取得
 */

import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import { z } from "zod";
import { logger } from "../lib/logger";
import { cors as sharedCors } from "../lib/cors";

// Types for Trust Room transactions
export interface TrustStep {
  name: string;
  // 修復 TS 錯誤：擴展狀態類型以符合實際業務流程
  agentStatus: "pending" | "confirmed" | "submitted";
  buyerStatus: "pending" | "confirmed";
  locked: boolean;
  data: Record<string, unknown>;
  // 修復 TS 錯誤：擴展 paymentStatus 以符合完整付款流程
  paymentStatus?: "pending" | "initiated" | "paid" | "completed" | "expired";
  // 修復 TS 錯誤：deadline 可能是 number（timestamp）或 string（ISO）
  paymentDeadline?: number | string | null;
  // 修復 TS 錯誤：checklist item 使用 label 而非 text
  checklist?: Array<{ label: string; checked: boolean }>;
}

export interface TrustState {
  id: string;
  currentStep: number;
  isPaid: boolean;
  steps: Record<number, TrustStep>;
  // 修復 TS 錯誤：supplements 欄位與實際使用一致
  supplements: Array<{
    id?: string;
    role?: string;
    content: string;
    timestamp: string | number;
  }>;
}

export interface JwtUser {
  id: string;
  role: "agent" | "buyer" | "system";
  txId: string;
  iat?: number;
  exp?: number;
}

/** [NASA TypeScript Safety] JWT Payload Zod Schema */
const JwtUserSchema = z.object({
  id: z.string(),
  role: z.enum(["agent", "buyer", "system"]),
  txId: z.string(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

/** [NASA TypeScript Safety] Trust Query Schema - 共用於 6 個舊版 API */
export const TrustQuerySchema = z.object({
  id: z.string().min(1, "Transaction ID is required"),
});

export interface AuditUser extends JwtUser {
  ip: string;
  agent: string;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 修復 #4: 缺憑證時 fail-fast
if (!supabaseUrl || !supabaseKey) {
  const errMsg = "[trust/_utils] Missing Supabase credentials";
  logger.error(errMsg);
  throw new Error(errMsg);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET env var");

export const SYSTEM_API_KEY = process.env.SYSTEM_API_KEY!;
if (!SYSTEM_API_KEY) throw new Error("Missing SYSTEM_API_KEY env var");

export const TIMEOUTS: Record<number, number> = { 5: 12 * 3600 * 1000 }; // 12 hours

export const createInitialState = (id: string): TrustState => ({
  id,
  currentStep: 1,
  isPaid: false,
  steps: {
    1: {
      name: "已電聯",
      agentStatus: "pending" as const,
      buyerStatus: "pending" as const,
      data: {},
      locked: false,
    },
    2: {
      name: "已帶看",
      agentStatus: "pending" as const,
      buyerStatus: "pending" as const,
      locked: false,
      data: {
        risks: { water: false, wall: false, structure: false, other: false },
      },
    },
    3: {
      name: "已出價",
      agentStatus: "pending" as const,
      buyerStatus: "pending" as const,
      data: {},
      locked: false,
    },
    4: {
      name: "已斡旋",
      agentStatus: "pending" as const,
      buyerStatus: "pending" as const,
      data: {},
      locked: false,
    },
    5: {
      name: "已成交",
      agentStatus: "pending" as const,
      buyerStatus: "pending" as const,
      locked: false,
      paymentStatus: "pending" as const,
      paymentDeadline: null,
      data: {},
    },
    6: {
      name: "已交屋",
      agentStatus: "pending" as const,
      buyerStatus: "pending" as const,
      locked: false,
      checklist: [],
      data: {},
    },
  },
  supplements: [],
});

/** TrustState Zod Schema 用於驗證 DB 回傳資料 */
const TrustStateSchema = z.object({
  id: z.string(),
  currentStep: z.number(),
  isPaid: z.boolean(),
  steps: z.record(z.string(), z.object({
    name: z.string(),
    // 修復 TS 錯誤：擴展狀態類型
    agentStatus: z.enum(["pending", "confirmed", "submitted"]),
    buyerStatus: z.enum(["pending", "confirmed"]),
    locked: z.boolean(),
    data: z.record(z.string(), z.unknown()),
    // 修復 TS 錯誤：擴展 paymentStatus
    paymentStatus: z.enum(["pending", "initiated", "paid", "completed", "expired"]).optional(),
    // 修復 TS 錯誤：deadline 可能是 number 或 string
    paymentDeadline: z.union([z.number(), z.string()]).nullable().optional(),
    // 修復 TS 錯誤：checklist 使用 label
    checklist: z.array(z.object({ label: z.string(), checked: z.boolean() })).optional(),
  })),
  // 修復 TS 錯誤：supplements 的 timestamp 可能是 number
  supplements: z.array(z.object({
    id: z.string().optional(),
    role: z.string().optional(),
    content: z.string(),
    timestamp: z.union([z.string(), z.number()]),
  })),
});

// 修復 #5, #6: 區分 "不存在" 和 "真正錯誤"，並驗證 data.state
export async function getTx(id: string): Promise<TrustState> {
  const { data, error } = await supabase
    .from("transactions")
    .select("state")
    .eq("id", id)
    .single();

  // 只有 PGRST116 (not found) 才自動建立
  if (error) {
    if (error.code === "PGRST116") {
      const newState = createInitialState(id);
      await saveTx(id, newState);
      return newState;
    }
    // 真正的 DB 錯誤要拋出
    logger.error("[trust/_utils] getTx DB error", { error: error.message, id });
    throw new Error(`getTx failed: ${error.message}`);
  }

  if (!data) {
    const newState = createInitialState(id);
    await saveTx(id, newState);
    return newState;
  }

  // 驗證 state 結構
  const parseResult = TrustStateSchema.safeParse(data.state);
  if (!parseResult.success) {
    logger.error("[trust/_utils] getTx invalid state schema", {
      id,
      issues: parseResult.error.issues,
    });
    throw new Error("Invalid transaction state schema");
  }

  return parseResult.data;
}

export async function saveTx(id: string, state: TrustState) {
  const { error } = await supabase
    .from("transactions")
    .upsert({ id, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function logAudit(txId: string, action: string, user: AuditUser) {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      transaction_id: txId,
      action,
      role: user.role,
      ip: user.ip || "unknown",
      user_agent: user.agent || "unknown",
    });
    if (error) logger.error("[trust/_utils] Audit log failed", error, { txId, action });
  } catch (e) {
    logger.error("[trust/_utils] Audit log exception", e, { txId, action });
  }
}

/** [NASA TypeScript Safety] 安全取得字串 header */
function getStringHeader(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === "string" ? first : "unknown";
  }
  return "unknown";
}

/** 取得 Client IP（用於稽核紀錄） */
export function getClientIp(req: VercelRequest): string {
  const value = req.headers["x-forwarded-for"];
  if (typeof value === "string") return value.split(",")[0].trim();
  if (Array.isArray(value) && value.length > 0) return value[0] ?? "unknown";
  return "unknown";
}

/** 取得 User-Agent（用於稽核紀錄） */
export function getUserAgent(req: VercelRequest): string {
  return req.headers["user-agent"] ?? "unknown";
}

export function verifyToken(req: VercelRequest): AuditUser {
  let token = "";

  // 1. Try Cookie
  if (req.headers.cookie) {
    const cookies = parse(req.headers.cookie);
    token = cookies.mh_token || "";
  }

  // 2. Try Authorization Header (Fallback)
  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader ? authHeader.split(" ")[1] : "";
  }

  if (!token) throw new Error("Unauthorized");

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as JwtUser
    const parseResult = JwtUserSchema.safeParse(decoded);
    if (!parseResult.success) {
      logger.error("[trust/_utils] JWT payload validation failed", { error: parseResult.error.message });
      throw new Error("Invalid token payload");
    }
    const user = parseResult.data;
    return {
      ...user,
      ip: getStringHeader(req.headers["x-forwarded-for"]),
      agent: req.headers["user-agent"] || "unknown",
    };
  } catch (e) {
    if (e instanceof Error && e.message === "Invalid token payload") throw e;
    throw new Error("Token expired or invalid");
  }
}

/**
 * CORS 設定 - 使用共用模組
 * @deprecated 請直接 import { cors } from "../lib/cors"
 */
export function cors(req: VercelRequest, res: VercelResponse): void {
  sharedCors(req, res);
}
