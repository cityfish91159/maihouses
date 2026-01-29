/**
 * useComments Hook
 *
 * 統一留言操作邏輯
 * - 載入留言列表
 * - 新增留言/回覆
 * - 按讚留言
 * - 刪除留言
 */

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { notify } from '../lib/notify';
import type { FeedComment } from '../types/comment';
import { transformApiComment } from '../types/comment';

interface UseCommentsOptions {
  postId: string;
  communityId: string;
  initialComments?: FeedComment[];
}

interface UseCommentsReturn {
  comments: FeedComment[];
  isLoading: boolean;
  isLoadingReplies: boolean;
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
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 載入頂層留言
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('community_comments')
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
          updated_at,
          author:profiles(id, name, avatar_url, role, floor)
        `
        )
        .eq('post_id', postId)
        .eq('community_id', communityId)
        .is('parent_id', null) // 只取頂層留言
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // 每次 refresh 都重新取得 userId，確保最新狀態
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      const transformed = (data || []).map((raw) => {
        const comment = transformApiComment(raw);
        // 檢查當前用戶是否已按讚
        const likedBy = (raw.liked_by as string[]) || [];
        comment.isLiked = userId ? likedBy.includes(userId) : false;
        return comment;
      });

      setComments(transformed);
    } catch (err) {
      const e = err instanceof Error ? err : new Error('載入留言失敗');
      setError(e);
      logger.error('[useComments] refresh failed', { error: err });
      notify.error('載入留言失敗', '請稍後再試');
    } finally {
      setIsLoading(false);
    }
  }, [postId, communityId]);

  // 新增留言/回覆
  const addComment = useCallback(
    async (content: string, parentId?: string) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        notify.error('請先登入', '登入後才能留言');
        return;
      }

      try {
        const response = await fetch('/api/community/comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
          // 回覆：使用 functional update 檢查父留言是否存在（避免閉包陷阱）
          let parentFound = false;
          setComments((prev) => {
            const parentExists = prev.some((c) => c.id === parentId);
            if (!parentExists) {
              return prev; // 不變更，稍後 refresh
            }
            parentFound = true;
            return prev.map((c) => {
              if (c.id === parentId) {
                return {
                  ...c,
                  repliesCount: c.repliesCount + 1,
                  replies: [...(c.replies || []), newComment],
                };
              }
              return c;
            });
          });
          // 如果找不到父留言，重新載入整個列表
          if (!parentFound) {
            await refresh();
          }
        } else {
          // 頂層留言
          setComments((prev) => [...prev, newComment]);
        }

        notify.success('留言成功');
      } catch (err) {
        logger.error('[useComments] addComment failed', { error: err });
        notify.error('留言失敗', '請稍後再試');
        throw err;
      }
    },
    [postId, communityId, refresh]
  );

  /**
   * 按讚留言
   *
   * AUDIT-01 Phase 6: 競態條件修復
   * - 使用「反向操作」回滾，而非「捕獲舊狀態」
   * - 避免快速連擊時丟失中間操作
   */
  const toggleLike = useCallback(async (commentId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      notify.error('請先登入', '登入後才能按讚');
      return;
    }

    /**
     * 輔助函數：套用按讚切換（可用於樂觀更新和回滾）
     * 反向操作 = 再次調用同一函數
     */
    const applyLikeToggle = (comments: FeedComment[]): FeedComment[] => {
      return comments.map((c) => {
        if (c.id === commentId) {
          const newIsLiked = !c.isLiked;
          return {
            ...c,
            isLiked: newIsLiked,
            likesCount: newIsLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
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
                  likesCount: newIsLiked ? r.likesCount + 1 : Math.max(0, r.likesCount - 1),
                };
              }
              return r;
            }),
          };
        }
        return c;
      });
    };

    // 1. 樂觀更新
    setComments(applyLikeToggle);

    try {
      const response = await fetch('/api/community/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'like', commentId }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      // 2. 使用伺服器回傳的實際值同步（確保數據一致性）
      if (result.data?.likes_count !== undefined) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                likesCount: result.data.likes_count,
                isLiked: result.data.liked,
              };
            }
            if (c.replies?.length) {
              return {
                ...c,
                replies: c.replies.map((r) => {
                  if (r.id === commentId) {
                    return {
                      ...r,
                      likesCount: result.data.likes_count,
                      isLiked: result.data.liked,
                    };
                  }
                  return r;
                }),
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      // 3. 回滾：使用反向操作（再次 toggle = 還原）
      // 這種方式不依賴閉包捕獲的舊狀態，避免競態條件
      setComments(applyLikeToggle);
      logger.warn('[useComments] toggleLike rollback', {
        commentId,
        error: err instanceof Error ? err.message : String(err),
        reason: 'API_FAILURE',
      });
      notify.error('按讚失敗', '請稍後再試');
    }
  }, []); // 空依賴：不依賴任何外部狀態，完全使用 functional update

  /**
   * 刪除留言
   *
   * AUDIT-01 Phase 6: 競態條件修復
   * - 刪除操作無法用「反向操作」回滾（已刪除的資料無法復原）
   * - 改用 useRef 捕獲刪除前的完整留言資料
   * - 回滾時將該留言重新插入原位置
   */
  const deleteComment = useCallback(async (commentId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      notify.error('請先登入', '登入後才能刪除');
      return;
    }

    // 捕獲要刪除的留言資料（用於回滾）
    // 注意：這裡用閉包變數在 functional update 內賦值
    let deletedComment: FeedComment | null = null;
    let deletedFromParentId: string | null = null;
    let deletedIndex = -1;

    setComments((prev) => {
      // 先找出要刪除的留言
      const topLevelIndex = prev.findIndex((c) => c.id === commentId);
      if (topLevelIndex !== -1) {
        deletedComment = prev[topLevelIndex] ?? null;
        deletedIndex = topLevelIndex;
      } else {
        // 在 replies 中尋找
        for (const c of prev) {
          if (c.replies) {
            const replyIndex = c.replies.findIndex((r) => r.id === commentId);
            if (replyIndex !== -1) {
              deletedComment = c.replies[replyIndex] ?? null;
              deletedFromParentId = c.id;
              deletedIndex = replyIndex;
              break;
            }
          }
        }
      }

      // 執行刪除
      const filtered = prev.filter((c) => c.id !== commentId);
      return filtered.map((c) => {
        if (c.replies) {
          const filteredReplies = c.replies.filter((r) => r.id !== commentId);
          const deletedCount = c.replies.length - filteredReplies.length;
          return {
            ...c,
            replies: filteredReplies,
            repliesCount: Math.max(0, c.repliesCount - deletedCount),
          };
        }
        return c;
      });
    });

    try {
      const response = await fetch('/api/community/comment', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ commentId }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      notify.success('留言已刪除');
    } catch (err) {
      // 回滾：將刪除的留言重新插入
      if (deletedComment) {
        setComments((prev) => {
          if (deletedFromParentId) {
            // 回滾到 replies
            return prev.map((c) => {
              if (c.id === deletedFromParentId) {
                const newReplies = [...(c.replies || [])];
                // 嘗試插入原位置，若超出範圍則 push 到末尾
                if (deletedIndex >= 0 && deletedIndex <= newReplies.length) {
                  newReplies.splice(deletedIndex, 0, deletedComment!);
                } else {
                  newReplies.push(deletedComment!);
                }
                return {
                  ...c,
                  replies: newReplies,
                  repliesCount: c.repliesCount + 1,
                };
              }
              return c;
            });
          } else {
            // 回滾到頂層
            const newComments = [...prev];
            if (deletedIndex >= 0 && deletedIndex <= newComments.length) {
              newComments.splice(deletedIndex, 0, deletedComment!);
            } else {
              newComments.push(deletedComment!);
            }
            return newComments;
          }
        });
      }
      logger.warn('[useComments] deleteComment rollback', {
        commentId,
        error: err instanceof Error ? err.message : String(err),
        reason: 'API_FAILURE',
      });
      notify.error('刪除失敗', '請稍後再試');
    }
  }, []); // 空依賴：完全使用 functional update

  // 載入回覆
  const loadReplies = useCallback(async (commentId: string) => {
    setIsLoadingReplies(true); // 使用獨立的 loading 狀態

    try {
      const { data, error: fetchError } = await supabase
        .from('community_comments')
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
          author:profiles(id, name, avatar_url, role, floor)
        `
        )
        .eq('parent_id', commentId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // 每次 loadReplies 都重新取得 userId，確保最新狀態
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id;

      const replies = (data || []).map((raw) => {
        const comment = transformApiComment(raw);
        const likedBy = (raw.liked_by as string[]) || [];
        comment.isLiked = userId ? likedBy.includes(userId) : false;
        return comment;
      });

      // 合併策略：保留本地新增的回覆（避免覆蓋樂觀更新）
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            const serverIds = new Set(replies.map((r) => r.id));
            // 保留本地有但伺服器沒有的回覆（可能是剛新增的樂觀更新）
            const localOnlyReplies = (c.replies || []).filter((r) => !serverIds.has(r.id));
            return {
              ...c,
              replies: [...replies, ...localOnlyReplies],
            };
          }
          return c;
        })
      );
    } catch (err) {
      const e = err instanceof Error ? err : new Error('載入回覆失敗');
      setError(e);
      logger.error('[useComments] loadReplies failed', { error: err });
      notify.error('載入回覆失敗', '請稍後再試');
    } finally {
      setIsLoadingReplies(false);
    }
  }, []);

  return {
    comments,
    isLoading,
    isLoadingReplies,
    error,
    addComment,
    toggleLike,
    deleteComment,
    loadReplies,
    refresh,
  };
}
