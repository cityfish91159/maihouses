/**
 * UAG 事件追蹤 API
 *
 * 追蹤用戶在物件頁面的行為，計算意向分數
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { withSentryHandler, captureError, addBreadcrumb } from "../lib/sentry";

// ============================================================================
// Types
// ============================================================================

interface TrackEvent {
  property_id: string;
  duration?: number;
  scroll_depth?: number;
  clicked_contact?: boolean;
  clicked_share?: boolean;
  clicked_favorite?: boolean;
}

interface TrackRequest {
  session_id: string;
  agent_id?: string;
  fingerprint?: string;
  event: TrackEvent;
}

interface TrackResult {
  grade: string;
  score: number;
  reason?: string;
}

// ============================================================================
// Configuration
// ============================================================================

// RPC 版本選擇 (可透過環境變數切換)
const UAG_RPC_VERSION = process.env.UAG_RPC_VERSION || "v8_2";

// ============================================================================
// Handler
// ============================================================================

async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 驗證環境變數
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 解析請求體
    let data: TrackRequest = req.body;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return res.status(400).json({ error: "Invalid JSON" });
      }
    }

    const { session_id, agent_id, event, fingerprint } = data;

    if (!session_id || !event) {
      return res
        .status(400)
        .json({ error: "Missing required fields: session_id or event" });
    }

    // Basic Event Validation - 放寬驗證，duration 可以是 0 (page_view)
    if (typeof event !== "object" || !event.property_id) {
      return res.status(400).json({ error: "Invalid event structure" });
    }

    // 添加追蹤
    addBreadcrumb("UAG track event", "uag", {
      session_id,
      property_id: event.property_id,
    });

    // 選擇 RPC 版本
    const rpcName =
      UAG_RPC_VERSION === "v8_2"
        ? "track_uag_event_v8_2"
        : "track_uag_event_v8";

    // Call RPC for atomic incremental update
    const { data: result, error } = await supabase.rpc(rpcName, {
      p_session_id: session_id,
      p_agent_id: agent_id || "unknown",
      p_fingerprint: fingerprint || null,
      p_event_data: event,
    });

    if (error) {
      console.error("Supabase RPC Error:", error);

      // Fallback 到舊版 RPC
      if (UAG_RPC_VERSION === "v8_2") {
        const { data: fallbackResult, error: fallbackError } =
          await supabase.rpc("track_uag_event_v8", {
            p_session_id: session_id,
            p_agent_id: agent_id || "unknown",
            p_fingerprint: fingerprint || null,
            p_event_data: event,
          });

        if (!fallbackError) {
          return res.status(200).json(fallbackResult);
        }
      }

      captureError(error, { rpcName, session_id });
      return res.status(500).json({ error: error.message });
    }

    const trackResult = result as TrackResult;

    // Realtime Trigger - S-Grade Alert
    if (trackResult && trackResult.grade === "S") {
      console.log(
        `[UAG] 🎯 S-Grade Lead! Session: ${session_id}, Score: ${trackResult.score}, Reason: ${trackResult.reason}`,
      );
      addBreadcrumb("S-Grade lead detected", "uag", {
        session_id,
        score: trackResult.score,
      });
    }

    return res.status(200).json(trackResult);
  } catch (err) {
    console.error("UAG Track Error:", err);
    captureError(err, { handler: "uag/track" });
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// 使用 Sentry wrapper 導出
export default withSentryHandler(handler, "uag/track");
