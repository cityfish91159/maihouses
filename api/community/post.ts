/**
 * Vercel API: /api/community/post
 *
 * 社區牆發文 API
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 延遲初始化 Supabase client
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數");
  }

  supabase = createClient(url, key);
  return supabase;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 驗證登入
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "請先登入" });
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
    error: authError,
  } = await getSupabase().auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: "登入已過期，請重新登入" });
  }

  try {
    const {
      communityId,
      content,
      visibility = "public",
      postType = "general",
      images = [],
    } = req.body;

    if (!communityId || !content) {
      return res.status(400).json({ error: "缺少必要欄位" });
    }

    // 驗證 visibility
    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ error: "無效的可見性設定" });
    }

    // 私密牆需要驗證是否為社區成員（這裡先簡化，之後可加驗證邏輯）
    if (visibility === "private") {
      // TODO: 驗證用戶是否為該社區住戶
      // 暫時跳過，實際上線需要加驗證
    }

    const { data, error } = await getSupabase()
      .from("community_posts")
      .insert({
        community_id: communityId,
        author_id: user.id,
        content,
        visibility,
        post_type: postType,
        images,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      message: visibility === "private" ? "已發布到私密牆" : "已發布到公開牆",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
