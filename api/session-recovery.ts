import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { logger } from "./lib/logger";

// [NASA TypeScript Safety] Request Body Schema
const SessionRecoveryRequestSchema = z.object({
  fingerprint: z.string(),
  agentId: z.string().optional(),
});

// ============================================================================
// Types
// ============================================================================

export interface SessionRecoveryRequest {
  fingerprint: string;
  agentId?: string;
}

export interface SessionRecoveryResponse {
  recovered: boolean;
  session_id?: string;
  grade?: string;
  last_active?: string;
  error?: string;
}

interface SessionData {
  session_id: string;
  last_active: string;
  grade: string;
}

// ============================================================================
// Supabase Client
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Handler
// ============================================================================

/**
 * Session Recovery API
 *
 * 功能：根據設備指紋恢復用戶的 session_id
 * 場景：用戶清除 localStorage 後，避免創建新 session
 * 時間窗口：7 天內活躍的 session 可恢復
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({
      error: "Method not allowed",
      recovered: false,
    });
    return;
  }

  // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as SessionRecoveryRequest
  const parseResult = SessionRecoveryRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Invalid request body",
      recovered: false,
    });
    return;
  }
  const { fingerprint, agentId } = parseResult.data;

  // 驗證必填參數
  if (!fingerprint) {
    res.status(400).json({
      error: "Missing required parameter: fingerprint",
      recovered: false,
    });
    return;
  }

  try {
    // 查詢最近 7 天內相同指紋的活躍 session
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    let query = supabase
      .from("uag_sessions")
      .select("session_id, last_active, grade")
      .eq("fingerprint", fingerprint)
      .gte("last_active", sevenDaysAgo)
      .order("last_active", { ascending: false })
      .limit(1);

    // 如果提供 agentId，優先查找該房仲的 session
    if (agentId && agentId !== "unknown") {
      query = query.eq("agent_id", agentId);
    }

    const { data, error } = await query.single<SessionData>();

    // PGRST116 = "Row not found" - 這是正常情況，不是錯誤
    if (error && error.code !== "PGRST116") {
      logger.error("[session-recovery] Supabase error", error, {
        fingerprint: fingerprint.substring(0, 20) + "...",
        agentId,
      });
      throw error;
    }

    // 成功找到可恢復的 session
    if (data) {
      logger.info("[session-recovery] Session recovered", {
        session_id: data.session_id,
        grade: data.grade,
        last_active: data.last_active,
        agentId,
      });

      res.status(200).json({
        recovered: true,
        session_id: data.session_id,
        grade: data.grade,
        last_active: data.last_active,
      });
      return;
    }

    // 沒有找到可恢復的 session
    logger.info("[session-recovery] No session found for fingerprint", {
      fingerprint: fingerprint.substring(0, 20) + "...",
      agentId,
    });

    res.status(200).json({ recovered: false });
  } catch (err) {
    // [NASA TypeScript Safety] 使用 instanceof 類型守衛取代 as Error
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error("[session-recovery] Unexpected error", error, {
      fingerprint: fingerprint
        ? fingerprint.substring(0, 20) + "..."
        : "undefined",
    });

    // 即使出錯也回傳 recovered: false，不中斷前端追蹤器
    res.status(200).json({
      recovered: false,
      error: "Internal server error",
    });
  }
}
