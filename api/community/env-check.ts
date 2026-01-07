/**
 * Vercel API: /api/community/env-check
 *
 * 診斷環境變數設置狀態（只顯示是否存在，不洩露值）
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 檢查必要環境變數是否存在
  const envStatus = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    // 前端用（參考）
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
  };

  const allPresent =
    envStatus.SUPABASE_URL && envStatus.SUPABASE_SERVICE_ROLE_KEY;

  return res.status(200).json({
    success: allPresent,
    message: allPresent
      ? "API 環境變數已設置"
      : "⚠️ 缺少 Supabase 環境變數，需在 Vercel Dashboard → Settings → Environment Variables 設置",
    envStatus,
    hint: !allPresent
      ? {
          required: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
          instructions:
            "前往 Vercel Dashboard > Project > Settings > Environment Variables 添加",
        }
      : null,
  });
}
