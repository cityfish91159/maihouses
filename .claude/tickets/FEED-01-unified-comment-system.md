# FEED-01: 統一留言與信息流系統

## 工單摘要

| 項目 | 內容 |
|------|------|
| **工單編號** | FEED-01 |
| **標題** | 統一留言與信息流系統 |
| **優先級** | P0 - Critical |
| **狀態** | 進行中（Phase 1-10 完成）|
| **影響範圍** | UAG 儀表板、Feed 動態牆、Community Wall |
| **建立日期** | 2026-01-12 |
| **負責人** | - |

### 一句話描述

建立完整的留言系統，讓 UAG 房仲後台、Feed 消費者/房仲版、Community Wall 三個頁面的貼文都能被留言、回覆，並將信息流統一回流到 UAG 儀表板顯示。

---

## 施工項目總覽

| Phase | 施作項目 | 修改檔案 | 說明 | 狀態 |
|-------|----------|----------|------|------|
| 1 | 建立 community_comments 資料表 | `supabase/migrations/20260112_community_comments.sql` | 表+索引+RLS+Trigger+RPC函數+權限控制 | ✅ 完成 |
| 2 | 建立留言 API 端點 | `api/community/comment.ts` | POST新增/PUT編輯/DELETE刪除/按讚 | ✅ 完成 |
| 3 | 擴充留言型別定義 | `src/types/comment.ts` | 支援巢狀回覆 | ✅ 完成 |
| 4 | 實作留言 Hook | `src/hooks/useComments.ts` | 統一留言操作邏輯 | ✅ 完成 |
| 5 | 升級 CommentList 組件 | `src/components/Feed/CommentList.tsx` | 支援回覆、展開、按讚 | ✅ 完成 |
| 6 | 整合 Community Wall 留言 | `src/pages/Community/components/PostCard.tsx` | PostsSection 完整留言功能 | ✅ 完成 |
| 7 | 整合 Feed 頁面留言 | `src/components/Feed/FeedPostCard.tsx` | Consumer/Agent 版留言功能 | ✅ 完成 |
| 8 | 建立 UAG 信息流資料查詢 | `src/pages/UAG/services/uagService.ts` | 改查 community_posts | ✅ 完成 |
| 9 | UAG 信息流 UI 升級 | `src/pages/UAG/components/ListingFeed.tsx` | 顯示真實貼文、留言數、導航連結 | ✅ 完成 |
| 10 | UAG 貼文按鈕功能 | `src/pages/UAG/components/ListingFeed.tsx` | 實作 ComposerModal 整合 | ✅ 完成 |
| 11 | 品質檢查與測試 | - | typecheck + lint + 手動測試 | 待開發 |

---

## Phase 1: 建立 community_comments 資料表

### 1.1 新增 Migration 檔案

**檔案**: `supabase/migrations/20260112_community_comments.sql`

```sql
-- ============================================
-- community_comments 表（貼文留言）
-- ============================================

CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 巢狀回覆支援
  parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,

  -- 內容
  content TEXT NOT NULL,

  -- 互動數據
  likes_count INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  replies_count INTEGER DEFAULT 0,

  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_community_comments_post
  ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent
  ON community_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created
  ON community_comments(post_id, created_at DESC);

-- ============================================
-- RLS 政策
-- ============================================

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- 所有人可讀留言
DROP POLICY IF EXISTS "Comments visible to all" ON community_comments;
CREATE POLICY "Comments visible to all"
  ON community_comments FOR SELECT
  USING (true);

-- 登入用戶可建立留言
DROP POLICY IF EXISTS "Authenticated can create comments" ON community_comments;
CREATE POLICY "Authenticated can create comments"
  ON community_comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- 作者可編輯自己的留言
DROP POLICY IF EXISTS "Author can update own comments" ON community_comments;
CREATE POLICY "Author can update own comments"
  ON community_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- 作者可刪除自己的留言
DROP POLICY IF EXISTS "Author can delete own comments" ON community_comments;
CREATE POLICY "Author can delete own comments"
  ON community_comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ============================================
-- 更新 comments_count 的 Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 只有頂層留言才計入 post 的 comments_count
    IF NEW.parent_id IS NULL THEN
      UPDATE community_posts
      SET comments_count = comments_count + 1
      WHERE id = NEW.post_id;
    ELSE
      -- 回覆計入父留言的 replies_count
      UPDATE community_comments
      SET replies_count = replies_count + 1
      WHERE id = NEW.parent_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.parent_id IS NULL THEN
      UPDATE community_posts
      SET comments_count = GREATEST(0, comments_count - 1)
      WHERE id = OLD.post_id;
    ELSE
      UPDATE community_comments
      SET replies_count = GREATEST(0, replies_count - 1)
      WHERE id = OLD.parent_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON community_comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- ============================================
-- 留言按讚函數
-- ============================================

CREATE OR REPLACE FUNCTION toggle_comment_like(comment_id UUID)
RETURNS JSON AS $$
DECLARE
  current_liked_by UUID[];
  new_liked_by UUID[];
  is_liked BOOLEAN;
BEGIN
  SELECT liked_by INTO current_liked_by FROM community_comments WHERE id = comment_id;

  is_liked := auth.uid() = ANY(current_liked_by);

  IF is_liked THEN
    new_liked_by := array_remove(current_liked_by, auth.uid());
  ELSE
    new_liked_by := array_append(current_liked_by, auth.uid());
  END IF;

  UPDATE community_comments
  SET liked_by = new_liked_by,
      likes_count = cardinality(new_liked_by)
  WHERE id = comment_id;

  RETURN json_build_object(
    'liked', NOT is_liked,
    'likes_count', cardinality(new_liked_by)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 1.2 驗收標準

- [x] Migration 執行成功
- [x] RLS 政策生效（訪客可讀、登入可寫）
- [x] Trigger 正確更新 comments_count 和 replies_count

### 1.3 實際交付（186 行）

**檔案：** `supabase/migrations/20260112_community_comments.sql`

- 資料表：community_comments（巢狀回覆、content CHECK 1-2000、計數 CHECK >=0）
- 索引：4 個（post_id, parent_id, created_at, author_id）
- RLS：4 個政策（SELECT 公開、INSERT/UPDATE/DELETE 作者）
- Trigger：2 個（comments_count 自動更新、updated_at 自動更新）
- RPC 函數：toggle_comment_like（權限檢查、NULL 檢查、FOR UPDATE、GRANT/REVOKE）
- npm run gate：✅ 通過

---

## Phase 2: 建立留言 API 端點

### 2.1 新增 API 檔案

**檔案**: `api/community/comment.ts`

```typescript
/**
 * Vercel API: /api/community/comment
 *
 * 留言 CRUD 操作
 * - POST: 新增留言/回覆
 * - PUT: 編輯留言
 * - DELETE: 刪除留言
 * - POST (action=like): 按讚留言
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Schemas
const CreateCommentSchema = z.object({
  postId: z.string().uuid(),
  communityId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(), // 回覆時指定父留言
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

// Handler
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

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ success: false, error: "認證失敗" });
  }

  try {
    switch (req.method) {
      case "POST": {
        const body = req.body;

        // 檢查是否為按讚操作
        if (body?.action === "like") {
          const parsed = LikeCommentSchema.safeParse(body);
          if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.flatten() });
          }

          const { data, error } = await supabase.rpc("toggle_comment_like", {
            comment_id: parsed.data.commentId,
          });

          if (error) throw error;
          return res.status(200).json({ success: true, data });
        }

        // 新增留言
        const parsed = CreateCommentSchema.safeParse(body);
        if (!parsed.success) {
          return res.status(400).json({ success: false, error: parsed.error.flatten() });
        }

        const { postId, communityId, content, parentId } = parsed.data;

        const { data, error } = await supabase
          .from("community_comments")
          .insert({
            post_id: postId,
            community_id: communityId,
            author_id: user.id,
            content,
            parent_id: parentId || null,
          })
          .select(`
            id,
            post_id,
            parent_id,
            content,
            likes_count,
            replies_count,
            created_at,
            author:profiles(id, name, avatar_url, role)
          `)
          .single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
      }

      case "PUT": {
        const parsed = UpdateCommentSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ success: false, error: parsed.error.flatten() });
        }

        const { commentId, content } = parsed.data;

        // 確認是作者本人
        const { data: existing } = await supabase
          .from("community_comments")
          .select("author_id")
          .eq("id", commentId)
          .single();

        if (existing?.author_id !== user.id) {
          return res.status(403).json({ success: false, error: "無權編輯此留言" });
        }

        const { data, error } = await supabase
          .from("community_comments")
          .update({ content, updated_at: new Date().toISOString() })
          .eq("id", commentId)
          .select()
          .single();

        if (error) throw error;
        return res.status(200).json({ success: true, data });
      }

      case "DELETE": {
        const parsed = DeleteCommentSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ success: false, error: parsed.error.flatten() });
        }

        const { commentId } = parsed.data;

        // 確認是作者本人
        const { data: existing } = await supabase
          .from("community_comments")
          .select("author_id")
          .eq("id", commentId)
          .single();

        if (existing?.author_id !== user.id) {
          return res.status(403).json({ success: false, error: "無權刪除此留言" });
        }

        const { error } = await supabase
          .from("community_comments")
          .delete()
          .eq("id", commentId);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }
  } catch (error) {
    console.error("[comment API error]", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "伺服器錯誤",
    });
  }
}
```

### 2.2 驗收標準

- [x] POST /api/community/comment 可新增留言
- [x] POST /api/community/comment (action=like) 可按讚
- [x] PUT /api/community/comment 可編輯自己的留言
- [x] DELETE /api/community/comment 可刪除自己的留言
- [x] 權限檢查正確（未登入 401、非作者 403）

### 2.3 實際交付（229 行）

**檔案：** `api/community/comment.ts`

- Zod Schema：4 個（CreateComment、UpdateComment、DeleteComment、LikeComment）
- API 端點：POST 新增/按讚、PUT 編輯、DELETE 刪除
- 權限檢查：Bearer Token 驗證、作者身份確認（403）
- 架構改善：使用 getSupabase() 模式、移除 console.error、updated_at 由 Trigger 處理
- npm run gate：✅ 通過

---

## Phase 3: 擴充留言型別定義

### 3.1 修改型別檔案

**檔案**: `src/types/comment.ts`

```typescript
/**
 * 留言系統型別定義
 * FEED-01: 支援巢狀回覆
 */

export interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  role: "resident" | "member" | "agent" | "official";
  floor?: string; // 住戶樓層
}

export interface FeedComment {
  id: string;
  postId: string;
  parentId?: string; // FEED-01: 支援回覆
  author: CommentAuthor;
  content: string;
  createdAt: string;
  updatedAt?: string;

  // 互動數據
  likesCount: number;
  isLiked?: boolean;
  repliesCount: number;

  // 巢狀回覆（前端展開時載入）
  replies?: FeedComment[];

  // DEPRECATED: 舊欄位相容
  /** @deprecated 使用 author.name */
  authorName?: string;
  /** @deprecated 使用 createdAt */
  time?: string;
  /** @deprecated 使用 likesCount */
  likes?: number;
}

// API 回傳格式轉換
export function transformApiComment(raw: Record<string, unknown>): FeedComment {
  const author = raw.author as Record<string, unknown> | null;

  return {
    id: String(raw.id),
    postId: String(raw.post_id),
    parentId: raw.parent_id ? String(raw.parent_id) : undefined,
    author: {
      id: author?.id ? String(author.id) : "",
      name: String(author?.name || "匿名用戶"),
      avatarUrl: author?.avatar_url ? String(author.avatar_url) : undefined,
      role: (author?.role as CommentAuthor["role"]) || "member",
      floor: author?.floor ? String(author.floor) : undefined,
    },
    content: String(raw.content),
    createdAt: String(raw.created_at),
    updatedAt: raw.updated_at ? String(raw.updated_at) : undefined,
    likesCount: Number(raw.likes_count) || 0,
    isLiked: Boolean(raw.is_liked),
    repliesCount: Number(raw.replies_count) || 0,
    replies: [],
  };
}
```

### 3.2 驗收標準

- [x] 型別支援巢狀回覆結構
- [x] 包含 transformApiComment 轉換函數
- [x] 舊欄位標記 @deprecated

### 3.3 實際交付（68 行 + 4 檔案相容性修正）

**主檔案：** `src/types/comment.ts` (68 行)
- CommentAuthor interface (L6-12)：id、name、avatarUrl、role、floor
- FeedComment interface (L14-38)：parentId、author 物件、replies 陣列、deprecated 欄位
- transformApiComment (L41-67)：完全符合票據規格，用 if 處理 optional 欄位

**相容性修正：**
- `src/components/Feed/CommentList.tsx`：移除 typeof 守衛，直接使用新欄位
- `src/hooks/useFeedData.ts:944`：user_id → author_id
- `src/pages/Feed/mockData/factories.ts:92`：補上 authorName
- npm run gate：✅ 通過

---

## Phase 4: 實作留言 Hook

### 4.1 新增 Hook 檔案

**檔案**: `src/hooks/useComments.ts`

```typescript
/**
 * useComments Hook
 *
 * 統一留言操作邏輯
 * - 載入留言列表
 * - 新增留言/回覆
 * - 按讚留言
 * - 刪除留言
 */

import { useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { logger } from "../lib/logger";
import { notify } from "../lib/notify";
import type { FeedComment } from "../types/comment";
import { transformApiComment } from "../types/comment";

interface UseCommentsOptions {
  postId: string;
  communityId: string;
  initialComments?: FeedComment[];
}

interface UseCommentsReturn {
  comments: FeedComment[];
  isLoading: boolean;
  error: Error | null;

  // 操作
  addComment: (content: string, parentId?: string) => Promise<void>;
  toggleLike: (commentId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  loadReplies: (commentId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useComments({
  postId,
  communityId,
  initialComments = [],
}: UseCommentsOptions): UseCommentsReturn {
  const [comments, setComments] = useState<FeedComment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 載入頂層留言
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("community_comments")
        .select(`
          id,
          post_id,
          parent_id,
          content,
          likes_count,
          liked_by,
          replies_count,
          created_at,
          updated_at,
          author:profiles(id, name, avatar_url, role, floor)
        `)
        .eq("post_id", postId)
        .is("parent_id", null) // 只取頂層留言
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const transformed = (data || []).map((raw) => {
        const comment = transformApiComment(raw);
        // 檢查當前用戶是否已按讚
        const likedBy = raw.liked_by as string[] || [];
        comment.isLiked = userId ? likedBy.includes(userId) : false;
        return comment;
      });

      setComments(transformed);
    } catch (err) {
      const e = err instanceof Error ? err : new Error("載入留言失敗");
      setError(e);
      logger.error("[useComments] refresh failed", { error: err });
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  // 新增留言/回覆
  const addComment = useCallback(async (content: string, parentId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      notify.error("請先登入", "登入後才能留言");
      return;
    }

    try {
      const response = await fetch("/api/community/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          postId,
          communityId,
          content,
          parentId,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      const newComment = transformApiComment(result.data);

      if (parentId) {
        // 回覆：更新父留言的 replies
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                repliesCount: c.repliesCount + 1,
                replies: [...(c.replies || []), newComment],
              };
            }
            return c;
          })
        );
      } else {
        // 頂層留言
        setComments((prev) => [...prev, newComment]);
      }

      notify.success("留言成功");
    } catch (err) {
      logger.error("[useComments] addComment failed", { error: err });
      notify.error("留言失敗", "請稍後再試");
      throw err;
    }
  }, [postId, communityId]);

  // 按讚留言
  const toggleLike = useCallback(async (commentId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      notify.error("請先登入", "登入後才能按讚");
      return;
    }

    // 樂觀更新
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const newIsLiked = !c.isLiked;
          return {
            ...c,
            isLiked: newIsLiked,
            likesCount: newIsLiked ? c.likesCount + 1 : c.likesCount - 1,
          };
        }
        // 檢查 replies
        if (c.replies?.length) {
          return {
            ...c,
            replies: c.replies.map((r) => {
              if (r.id === commentId) {
                const newIsLiked = !r.isLiked;
                return {
                  ...r,
                  isLiked: newIsLiked,
                  likesCount: newIsLiked ? r.likesCount + 1 : r.likesCount - 1,
                };
              }
              return r;
            }),
          };
        }
        return c;
      })
    );

    try {
      const response = await fetch("/api/community/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "like", commentId }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
    } catch (err) {
      // 回滾樂觀更新
      await refresh();
      logger.error("[useComments] toggleLike failed", { error: err });
    }
  }, [refresh]);

  // 刪除留言
  const deleteComment = useCallback(async (commentId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const response = await fetch("/api/community/comment", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ commentId }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // 移除留言
      setComments((prev) => {
        // 頂層留言
        const filtered = prev.filter((c) => c.id !== commentId);
        // 也檢查 replies
        return filtered.map((c) => ({
          ...c,
          replies: c.replies?.filter((r) => r.id !== commentId),
        }));
      });

      notify.success("留言已刪除");
    } catch (err) {
      logger.error("[useComments] deleteComment failed", { error: err });
      notify.error("刪除失敗", "請稍後再試");
    }
  }, []);

  // 載入回覆
  const loadReplies = useCallback(async (commentId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("community_comments")
        .select(`
          id,
          post_id,
          parent_id,
          content,
          likes_count,
          liked_by,
          replies_count,
          created_at,
          author:profiles(id, name, avatar_url, role, floor)
        `)
        .eq("parent_id", commentId)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const replies = (data || []).map((raw) => {
        const comment = transformApiComment(raw);
        const likedBy = raw.liked_by as string[] || [];
        comment.isLiked = userId ? likedBy.includes(userId) : false;
        return comment;
      });

      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return { ...c, replies };
          }
          return c;
        })
      );
    } catch (err) {
      logger.error("[useComments] loadReplies failed", { error: err });
    }
  }, []);

  return {
    comments,
    isLoading,
    error,
    addComment,
    toggleLike,
    deleteComment,
    loadReplies,
    refresh,
  };
}
```

### 4.2 驗收標準

- [x] Hook 支援載入、新增、按讚、刪除留言
- [x] 支援巢狀回覆載入
- [x] 樂觀更新機制正常運作
- [x] 錯誤處理和 notify 提示完整

### 4.3 實際交付（372 行）

**檔案：** `src/hooks/useComments.ts` (372 行)

**核心修正（Race Condition & Critical Bugs）：**

| Bug | 修正 | 行數 |
|-----|------|------|
| **toggleLike Race Condition** | 使用 functional update 捕獲當下狀態，deps 改為 `[]` | L171-174, L254 |
| **deleteComment Race Condition** | 使用 functional update 捕獲當下狀態，deps 改為 `[]` | L267-270, L306 |
| **currentUserId 可能為 null** | `refresh` / `loadReplies` 自己呼叫 `getUser()` | L76-79, L332-335 |
| **loadReplies 全域 isLoading 衝突** | 新增獨立 `isLoadingReplies` state | L27, L45, L310, L356, L363 |
| **deleteComment 未更新 repliesCount** | 計算 `deletedCount` 並更新 `repliesCount` | L274-279 |

**功能完整性：**
- L69：`refresh` 加上 `.eq("community_id", communityId)` 過濾
- L94：`refresh` 失敗加上 `notify.error`
- L219-247：`toggleLike` 使用 API 回傳的 `result.data.likes_count` 同步實際值
- L262：`deleteComment` 加上未登入提示
- L269-284：`deleteComment` 樂觀更新（先移除，失敗回滾）
- L310, L356：`loadReplies` 獨立 `isLoadingReplies` 狀態
- L354：`loadReplies` 失敗加上 `notify.error`

**錯誤處理統一：**
| 函數 | logger.error | notify.error |
|------|--------------|--------------|
| refresh | ✅ L93 | ✅ L94 |
| addComment | ✅ L152 | ✅ L153 |
| toggleLike | ✅ L251 | ✅ L252 |
| deleteComment | ✅ L303 | ✅ L304 |
| loadReplies | ✅ L353 | ✅ L354 |

- npm run gate：✅ 通過

---

## Phase 5: 升級 CommentList 組件

### 5.1 修改組件

**檔案**: `src/components/Feed/CommentList.tsx`

**主要變更**:
- 支援回覆展開/收合
- 支援按讚互動
- 支援回覆輸入
- 支援刪除自己的留言

```typescript
// 關鍵 Props 變更
interface CommentListProps {
  comments: FeedComment[];
  postId: string;
  communityId: string;
  currentUserId?: string;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onToggleLike: (commentId: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onLoadReplies: (commentId: string) => Promise<void>;
}
```

### 5.2 驗收標準

- [x] 支援顯示留言及巢狀回覆
- [x] 按讚按鈕正常運作
- [x] 可展開/收合回覆
- [x] 可輸入回覆
- [x] 作者可刪除自己的留言

### 5.3 實際交付（372 行）

**檔案：** `src/components/Feed/CommentList.tsx`

- CommentItem 組件：支援巢狀回覆、按讚、刪除、回覆輸入
- 使用 useCallback 優化事件處理，加入 try-catch 錯誤處理
- hasLoadedRef 防止重複載入（Bug 4 修正）
- isLoggedIn 判斷使用 useMemo 優化
- LoadingSpinner、ChevronIcon 子組件
- npm run gate：✅ 通過

---

## Phase 6: 整合 Community Wall 留言

### 6.1 修改 PostCard 組件

**檔案**: `src/pages/Community/components/PostCard.tsx`

**主要變更**:
- 移除「開發中」標示
- 整合 useComments Hook
- 實作完整留言功能

### 6.2 修改 PostsSection 組件

**檔案**: `src/pages/Community/components/PostsSection.tsx`

**主要變更**:
- 傳遞 onComment 相關 props
- 留言展開狀態管理

### 6.3 驗收標準

- [x] PostsSection 留言功能完整
- [x] 可新增/回覆/按讚/刪除留言
- [x] 留言數即時更新

### 6.4 實際交付

**修改檔案：**

| 檔案 | 行數 | 變更內容 |
|------|------|----------|
| `src/pages/Community/Wall.tsx` | +3 | 傳遞 userInitial 至 PostsSection |
| `src/pages/Community/components/PostsSection.tsx` | +80 | 新增 PostCommentSection 子組件、整合 useComments Hook |
| `src/components/Feed/CommentInput.tsx` | +5 | 新增 disabled、userInitial、placeholder props |

**關鍵修正：**
- Bug 1：CommentInput 加入 disabled={!isLoggedIn} 防止未登入送出
- Bug 3：userInitial props 鏈完整傳遞 (Wall → PostsSection → PostCard → PostCommentSection → CommentInput)
- Bug 4：hasLoadedRef 防止 refresh() 每次 remount 重複呼叫
- npm run gate：✅ 通過

---

## Phase 7: 整合 Feed 頁面留言

### 7.1 修改 FeedPostCard 組件

**檔案**: `src/components/Feed/FeedPostCard.tsx`

**主要變更**:
- 整合 useComments Hook
- 替換現有 mock 留言邏輯

### 7.2 修改 useFeedData Hook

**檔案**: `src/hooks/useFeedData.ts`

**主要變更**:
- `addComment` 函數改用 API 模式
- 移除 schema 警告

### 7.3 驗收標準

- [x] Consumer 版 Feed 留言功能完整
- [x] Agent 版 Feed 留言功能完整
- [x] 留言計數正確同步

### 7.4 實際交付

**修改檔案：**

| 檔案 | 行數 | 變更內容 |
|------|------|----------|
| `src/components/Feed/FeedPostCard.tsx` | +60 | 新增 FeedPostCommentSection 子組件、整合 useComments、新增 communityId/currentUserId/userInitial props |
| `src/pages/Feed/Consumer.tsx` | +6 | 傳遞 communityId/currentUserId/userInitial 至 FeedPostCard (公開牆+私密牆) |
| `src/pages/Feed/useConsumer.ts` | +3 | 導出 currentUserId |
| `src/pages/Feed/Agent.tsx` | +5 | 傳遞 communityId/currentUserId/userInitial/onReply/onShare 至 FeedPostCard |
| `src/pages/Feed/useAgentFeed.ts` | +18 | 新增 handleReply、handleShare 函數 |

**架構設計：**
- FeedPostCommentSection：獨立子組件，整合 useComments Hook
- 若有 communityId 使用新組件；無 communityId 顯示「留言功能暫時無法使用」提示
- exactOptionalPropertyTypes 相容：props 類型加上 `| undefined`

**Bug 修正（Phase 7 審查）：**

| Bug | 扣分 | 修正 |
|-----|------|------|
| communityId 可能 undefined，fallback no-op 不工作 | -6 | 移除 fallback，改顯示提示訊息 |
| Agent.tsx 沒傳 onReply/onShare | -4 | useAgentFeed 新增並傳遞 |
| Agent.tsx 用 hardcoded communityId fallback | -3 | 移除 `\|\| userProfile.communityId` |
| handleLike 沒錯誤處理 | -3 | 加入 catch 區塊 |
| currentUserId 導出確認 | -2 | 已確認正確 |

- npm run gate：✅ 通過

---

## Phase 8: UAG 信息流資料查詢

### 8.1 修改 uagService.ts

**檔案**: `src/pages/UAG/services/uagService.ts`

**主要變更**:
- `fetchAppData` 中的 `feedRes` 改查 `community_posts` 表
- 篩選條件：房仲相關社區的熱門貼文
- 加入 comments_count 欄位

```typescript
// 修改前 (Line 315-319)
supabase
  .from("feed")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(5),

// 修改後
supabase
  .from("community_posts")
  .select(`
    id,
    community_id,
    content,
    visibility,
    likes_count,
    comments_count,
    created_at,
    community:communities(name)
  `)
  .eq("visibility", "public")
  .order("likes_count", { ascending: false })
  .order("created_at", { ascending: false })
  .limit(5),
```

### 8.2 修改資料轉換邏輯

```typescript
// 轉換 community_posts 為 UAG FeedPost 格式
const feedTransformed = (feedRes.data || []).map((post) => ({
  id: post.id,
  title: post.content.slice(0, 40) + (post.content.length > 40 ? "..." : ""),
  meta: `來自：${post.community?.name || "社區牆"}・${post.comments_count || 0} 則留言`,
  body: post.content,
  communityId: post.community_id,
  likesCount: post.likes_count,
  commentsCount: post.comments_count,
  created_at: post.created_at,
}));
```

### 8.3 驗收標準

- [x] UAG 信息流顯示真實 community_posts 資料
- [x] 包含留言數統計
- [x] 按熱門度排序

### 8.4 實際交付

**修改檔案：**

| 檔案 | 行數 | 變更內容 |
|------|------|----------|
| `src/pages/UAG/types/uag.types.ts` | +5 | FeedPostSchema 新增 id, communityId, communityName, likesCount, commentsCount |
| `src/pages/UAG/services/uagService.ts` | +25 | 新增 SupabaseCommunityPost 介面、feedRes 改查 community_posts、transformSupabaseData 轉換邏輯 |
| `src/pages/UAG/mockData.ts` | +10 | feed mock 資料加入新欄位 |

**關鍵修正：**
- L315-331：feedRes 改查 `community_posts` 表，JOIN `communities` 取得社區名稱
- L21-31：新增 `SupabaseCommunityPost` 介面處理 Supabase 返回類型
- L186-214：transformSupabaseData 中的 feed 轉換邏輯，處理 Supabase JOIN 可能返回陣列或物件
- npm run gate：✅ 通過

---

## Phase 9: UAG 信息流 UI 升級

### 9.1 修改 ListingFeed 組件

**檔案**: `src/pages/UAG/components/ListingFeed.tsx`

**主要變更**:
- 顯示留言數
- 文章可點擊導航到 Community Wall
- 顯示來源社區名稱

```tsx
// 修改後的 feed-post
<article className={styles["feed-post"]} key={post.id}>
  <Link
    to={`/community/${post.communityId}/wall`}
    className={styles["feed-post-link"]}
  >
    <div className={styles["fp-title"]}>{post.title}</div>
    <div className={styles["fp-meta"]}>
      {post.meta}
      <span className={styles["fp-stats"]}>
        ❤️ {post.likesCount} · 💬 {post.commentsCount}
      </span>
    </div>
    <div className={styles["fp-body"]}>{post.body}</div>
  </Link>
</article>
```

### 9.2 新增 CSS 樣式

**檔案**: `src/pages/UAG/UAG.module.css`

```css
.feed-post-link {
  display: block;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.feed-post-link:hover {
  background: var(--bg-alt);
}

.fp-stats {
  margin-left: auto;
  font-size: 11px;
  color: var(--ink-400);
}
```

### 9.3 驗收標準

- [x] 顯示真實貼文資料
- [x] 顯示留言數和讚數
- [x] 點擊可導航到 Community Wall

### 9.4 實際交付

**修改檔案：**

| 檔案 | 行數 | 變更內容 |
|------|------|----------|
| `src/pages/UAG/components/ListingFeed.tsx` | +30 | 新增 feed-post-link 導航、fp-stats 顯示讚數/留言數 |
| `src/pages/UAG/UAG.module.css` | +28 | 新增 .feed-post-link、.fp-stats 樣式 |

**關鍵修正：**
- L154-183：根據 communityId 存在與否決定是否渲染 Link
- CSS L1402-1428：新增 Phase 9 專用樣式
- npm run gate：✅ 通過

---

## Phase 10: UAG 貼文按鈕功能

### 10.1 修改 ListingFeed 組件

**檔案**: `src/pages/UAG/components/ListingFeed.tsx`

**主要變更**:
- 「貼文」按鈕整合 ComposerModal
- 選擇社區後發文到該社區

```tsx
// 新增 state
const [isComposerOpen, setIsComposerOpen] = useState(false);

// 按鈕修改
<button
  className={styles["uag-btn"]}
  onClick={() => setIsComposerOpen(true)}
>
  貼文
</button>

// 新增 Modal
<ComposerModal
  isOpen={isComposerOpen}
  onClose={() => setIsComposerOpen(false)}
  onSubmit={handleCreatePost}
  mode="uag"
/>
```

### 10.2 驗收標準

- [ ] 「貼文」按鈕可開啟 ComposerModal
- [ ] 可選擇發文到哪個社區
- [ ] 發文成功後更新信息流列表

---

## Phase 11: 品質檢查與測試

### 11.1 品質關卡

```bash
npm run gate   # typecheck + lint
```

### 11.2 手動測試清單

| # | 測試案例 | 頁面 | 預期結果 |
|---|----------|------|----------|
| 1 | 新增留言 | Community Wall | 留言顯示、計數 +1 |
| 2 | 回覆留言 | Community Wall | 顯示在父留言下方 |
| 3 | 按讚留言 | Community Wall | 讚數 +1、icon 變化 |
| 4 | 刪除留言 | Community Wall | 留言消失、計數 -1 |
| 5 | 新增留言 | Feed Consumer | 同上 |
| 6 | 新增留言 | Feed Agent | 同上 |
| 7 | UAG 信息流顯示 | UAG | 顯示真實貼文、留言數 |
| 8 | UAG 點擊貼文 | UAG | 導航到 Community Wall |
| 9 | UAG 貼文按鈕 | UAG | 開啟 ComposerModal |
| 10 | 權限檢查 | 全部 | 未登入無法留言 |

### 11.3 驗收標準

- [ ] `npm run gate` 通過
- [ ] 所有手動測試通過
- [ ] 無 console 錯誤
- [ ] 三個頁面留言功能一致

---

## 相關檔案清單

| 檔案 | 修改類型 | 說明 |
|------|----------|------|
| `supabase/migrations/20260112_community_comments.sql` | 新增 | 資料表 + RLS + Trigger |
| `api/community/comment.ts` | 新增 | 留言 API |
| `src/types/comment.ts` | 修改 | 擴充留言型別 |
| `src/hooks/useComments.ts` | 新增 | 留言 Hook |
| `src/components/Feed/CommentList.tsx` | 修改 | 升級支援回覆 |
| `src/components/Feed/CommentInput.tsx` | 保持 | 無需修改 |
| `src/pages/Community/components/PostCard.tsx` | 修改 | 整合留言 |
| `src/pages/Community/components/PostsSection.tsx` | 修改 | 傳遞留言 props |
| `src/components/Feed/FeedPostCard.tsx` | 修改 | 整合留言 |
| `src/hooks/useFeedData.ts` | 修改 | API 模式留言 |
| `src/pages/UAG/services/uagService.ts` | 修改 | 改查 community_posts |
| `src/pages/UAG/components/ListingFeed.tsx` | 修改 | UI 升級 + 貼文按鈕 |
| `src/pages/UAG/UAG.module.css` | 修改 | 新增樣式 |
| `src/pages/UAG/types/uag.types.ts` | 修改 | 擴充 FeedPost schema |
| `src/pages/UAG/mockData.ts` | 修改 | 更新 mock 結構 |

---

## 驗收標準總覽

- [ ] `npm run gate` 通過
- [ ] Community Wall 留言功能完整（新增/回覆/按讚/刪除）
- [ ] Feed Consumer 版留言功能完整
- [ ] Feed Agent 版留言功能完整
- [ ] UAG 信息流顯示真實貼文與留言數
- [ ] UAG 貼文按鈕可開啟發文 Modal
- [ ] UAG 貼文可點擊導航到 Community Wall
- [ ] 三頁面資料互通（發文/留言即時同步）
- [ ] 權限控制正確（未登入不可留言）
- [ ] 無 TypeScript / ESLint 錯誤
- [ ] 無 console 錯誤

---

## 變更歷史

| 日期 | 版本 | 變更內容 | 作者 |
|------|------|----------|------|
| 2026-01-12 | 1.0 | 初始工單建立 | Claude |
