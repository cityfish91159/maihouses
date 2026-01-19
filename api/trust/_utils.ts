import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import { z } from "zod";
import { logger } from "../lib/logger";

// Types for Trust Room transactions
export interface TrustStep {
  name: string;
  agentStatus: "pending" | "confirmed";
  buyerStatus: "pending" | "confirmed";
  locked: boolean;
  data: Record<string, unknown>;
  paymentStatus?: "pending" | "paid";
  paymentDeadline?: string | null;
  checklist?: Array<{ id: string; text: string; checked: boolean }>;
}

export interface TrustState {
  id: string;
  currentStep: number;
  isPaid: boolean;
  steps: Record<number, TrustStep>;
  supplements: Array<{ id: string; content: string; timestamp: string }>;
}

export interface JwtUser {
  id: string;
  role: "agent" | "buyer";
  txId: string;
  iat?: number;
  exp?: number;
}

/** [NASA TypeScript Safety] JWT Payload Zod Schema */
const JwtUserSchema = z.object({
  id: z.string(),
  role: z.enum(["agent", "buyer"]),
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

if (!supabaseUrl || !supabaseKey) {
  logger.error("[trust/_utils] Missing Supabase credentials");
}

export const supabase = createClient(supabaseUrl!, supabaseKey!);

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

export async function getTx(id: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("state")
    .eq("id", id)
    .single();

  if (error || !data) {
    const newState = createInitialState(id);
    await saveTx(id, newState);
    return newState;
  }
  return data.state;
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

export function cors(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = [
    "https://maihouses.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
  // [NASA TypeScript Safety] 使用類型守衛取代 as string
  const rawOrigin = req?.headers?.origin;
  const origin = typeof rawOrigin === "string" ? rawOrigin : undefined;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "https://maihouses.com");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-system-key",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
}
