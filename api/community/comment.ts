/**
 * Vercel API: /api/community/comment
 *
 * 留言 CRUD 操作
 * - POST: 新增留言/回覆
 * - PUT: 編輯留言
 * - DELETE: 刪除留言
 * - POST (action=like): 按讚留言
 *
 * FEED-01 Phase 2
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

// Zod Schemas
const CreateCommentSchema = z.object({
  postId: z.string().uuid(),
  communityId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});

const UpdateCommentSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

const DeleteCommentSchema = z.object({
  commentId: z.string().uuid(),
});

const LikeCommentSchema = z.object({
  action: z.literal("like"),
  commentId: z.string().uuid(),
});

// Supabase client 延遲初始化
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
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Auth check
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "未登入" });
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
    error: authError,
  } = await getSupabase().auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ success: false, error: "認證失敗" });
  }

  try {
    switch (req.method) {
      case "POST": {
        const body = req.body as unknown;

        // 檢查是否為按讚操作
        if (
          typeof body === "object" &&
          body !== null &&
          "action" in body &&
          body.action === "like"
        ) {
          const parsed = LikeCommentSchema.safeParse(body);
          if (!parsed.success) {
            return res
              .status(400)
              .json({ success: false, error: parsed.error.flatten() });
          }

          // 用 ANON_KEY + user token 建立 client，確保 RPC 內 auth.uid() 正確
          const url = process.env.SUPABASE_URL;
          const anonKey = process.env.SUPABASE_ANON_KEY;
          if (!url || !anonKey) {
            throw new Error("缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY 環境變數");
          }
          const userClient = createClient(url, anonKey, {
            global: {
              headers: {
                Authorization: req.headers.authorization || "",
              },
            },
          });

          const { data, error } = await userClient.rpc("toggle_comment_like", {
            comment_id: parsed.data.commentId,
          });

          if (error) throw error;
          return res.status(200).json({ success: true, data });
        }

        // 新增留言
        const parsed = CreateCommentSchema.safeParse(body);
        if (!parsed.success) {
          return res
            .status(400)
            .json({ success: false, error: parsed.error.flatten() });
        }

        const { postId, communityId, content, parentId } = parsed.data;

        // 並行驗證 postId/communityId 一致性 + parentId 所屬（減少 DB 往返）
        const validationPromises: Promise<{ type: string; valid: boolean; error?: string }>[] = [
          // 驗證 postId 與 communityId 一致性
          getSupabase()
            .from("community_posts")
            .select("community_id")
            .eq("id", postId)
            .single()
            .then(({ data: post, error: postError }) => {
              if (postError || !post) return { type: "post", valid: false, error: "貼文不存在" };
              if (post.community_id !== communityId) return { type: "post", valid: false, error: "communityId 與貼文所屬社區不符" };
              return { type: "post", valid: true };
            }),
        ];

        // 有 parentId 時才驗證
        if (parentId) {
          validationPromises.push(
            getSupabase()
              .from("community_comments")
              .select("post_id")
              .eq("id", parentId)
              .single()
              .then(({ data: parentComment, error: parentError }) => {
                if (parentError || !parentComment) return { type: "parent", valid: false, error: "父留言不存在" };
                if (parentComment.post_id !== postId) return { type: "parent", valid: false, error: "parentId 與 postId 不符" };
                return { type: "parent", valid: true };
              }),
          );
        }

        const validationResults = await Promise.all(validationPromises);
        const failedValidation = validationResults.find((r) => !r.valid);
        if (failedValidation) {
          const status = failedValidation.error?.includes("不存在") ? 404 : 400;
          return res.status(status).json({ success: false, error: failedValidation.error });
        }

        const { data, error } = await getSupabase()
          .from("community_comments")
          .insert({
            post_id: postId,
            community_id: communityId,
            author_id: user.id,
            content,
            parent_id: parentId || null,
          })
          .select(
            `
            id,
            post_id,
            parent_id,
            content,
            likes_count,
            liked_by,
            replies_count,
            created_at,
            author:profiles(id, name, avatar_url, role)
          `,
          )
          .single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
      }

      case "PUT": {
        const parsed = UpdateCommentSchema.safeParse(req.body);
        if (!parsed.success) {
          return res
            .status(400)
            .json({ success: false, error: parsed.error.flatten() });
        }

        const { commentId, content } = parsed.data;

        // 直接用 author_id 過濾，避免 TOCTOU 競爭條件
        // updated_at 由 Trigger 自動更新
        const { data, error } = await getSupabase()
          .from("community_comments")
          .update({ content })
          .eq("id", commentId)
          .eq("author_id", user.id) // 原子操作：只有作者才能更新
          .select()
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            // No rows returned
            return res
              .status(403)
              .json({ success: false, error: "無權編輯此留言或留言不存在" });
          }
          throw error;
        }
        return res.status(200).json({ success: true, data });
      }

      case "DELETE": {
        const parsed = DeleteCommentSchema.safeParse(req.body);
        if (!parsed.success) {
          return res
            .status(400)
            .json({ success: false, error: parsed.error.flatten() });
        }

        const { commentId } = parsed.data;

        // 直接用 author_id 過濾，避免 TOCTOU 競爭條件
        const { error, count } = await getSupabase()
          .from("community_comments")
          .delete({ count: "exact" })
          .eq("id", commentId)
          .eq("author_id", user.id); // 原子操作：只有作者才能刪除

        if (error) throw error;
        if (count === 0) {
          return res
            .status(403)
            .json({ success: false, error: "無權刪除此留言或留言不存在" });
        }
        return res.status(200).json({ success: true });
      }

      default:
        return res
          .status(405)
          .json({ success: false, error: "Method not allowed" });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "伺服器錯誤";
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
}
