/**
 * useComments Hook
 *
 * 統一留言操作邏輯
 * - 載入留言列表
 * - 新增留言/回覆
 * - 按讚留言
 * - 刪除留言
 */

import { useState, useCallback, useRef } from 'react';
import { z } from 'zod';
import { getErrorMessage } from '../lib/error';
import { logger } from '../lib/logger';
import { notify } from '../lib/notify';
import { commentService } from '../services/commentService';
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
  addComment: (content: string, parentId?: string) => Promise<void>;
  toggleLike: (commentId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  loadReplies: (commentId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.unknown(),
});

const CommentApiPayloadSchema = z.record(z.string(), z.unknown());

const AddCommentResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: CommentApiPayloadSchema,
  }),
  ApiErrorResponseSchema,
]);

const ToggleLikeResultSchema = z.object({
  likes_count: z.coerce.number(),
  liked: z.boolean(),
});

const ToggleLikeResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: ToggleLikeResultSchema.optional(),
  }),
  ApiErrorResponseSchema,
]);

const DeleteCommentResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
  }),
  ApiErrorResponseSchema,
]);

function toError(error: unknown, fallbackMessage: string): Error {
  const message = getErrorMessage(error);
  if (!message || message === 'Unknown error') {
    return new Error(fallbackMessage);
  }
  return new Error(message);
}

async function parseCommentApiResponse<T extends { success: boolean }>(
  response: Response,
  schema: z.ZodType<T>,
  invalidPayloadMessage: string
): Promise<T> {
  const payload: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = ApiErrorResponseSchema.safeParse(payload);
    if (errorPayload.success) {
      throw new Error(getErrorMessage(errorPayload.data.error));
    }
    throw new Error(`HTTP ${response.status}`);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(invalidPayloadMessage);
  }
  return parsed.data;
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
  const inFlightLikeIdsRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextComments = await commentService.fetchTopLevelComments(postId, communityId);
      setComments(nextComments);
    } catch (err) {
      const e = toError(err, '載入留言失敗');
      setError(e);
      logger.error('[useComments] refresh failed', { error: err });
      notify.error('載入留言失敗', '請稍後再試');
    } finally {
      setIsLoading(false);
    }
  }, [postId, communityId]);

  const addComment = useCallback(
    async (content: string, parentId?: string) => {
      const session = await commentService.getSession();
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

        const result = await parseCommentApiResponse(
          response,
          AddCommentResponseSchema,
          '留言 API 回傳格式錯誤'
        );
        if (!result.success) {
          throw new Error(getErrorMessage(result.error));
        }

        const newComment = transformApiComment(result.data);

        if (parentId) {
          let parentFound = false;
          setComments((prev) => {
            const parentExists = prev.some((comment) => comment.id === parentId);
            if (!parentExists) {
              return prev;
            }
            parentFound = true;
            return prev.map((comment) => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  repliesCount: comment.repliesCount + 1,
                  replies: [...(comment.replies || []), newComment],
                };
              }
              return comment;
            });
          });
          if (!parentFound) {
            await refresh();
          }
        } else {
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

  const toggleLike = useCallback(async (commentId: string) => {
    if (inFlightLikeIdsRef.current.has(commentId)) {
      return;
    }

    const session = await commentService.getSession();
    if (!session) {
      notify.error('請先登入', '登入後才能按讚');
      return;
    }

    inFlightLikeIdsRef.current.add(commentId);

    const applyLikeToggle = (current: FeedComment[]): FeedComment[] => {
      return current.map((comment) => {
        if (comment.id === commentId) {
          const nextLiked = !comment.isLiked;
          return {
            ...comment,
            isLiked: nextLiked,
            likesCount: nextLiked ? comment.likesCount + 1 : Math.max(0, comment.likesCount - 1),
          };
        }
        if (comment.replies?.length) {
          return {
            ...comment,
            replies: comment.replies.map((reply) => {
              if (reply.id === commentId) {
                const nextLiked = !reply.isLiked;
                return {
                  ...reply,
                  isLiked: nextLiked,
                  likesCount: nextLiked ? reply.likesCount + 1 : Math.max(0, reply.likesCount - 1),
                };
              }
              return reply;
            }),
          };
        }
        return comment;
      });
    };

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

      const result = await parseCommentApiResponse(
        response,
        ToggleLikeResponseSchema,
        '按讚 API 回傳格式錯誤'
      );
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }

      const likeResult = result.data;
      if (likeResult) {
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likesCount: likeResult.likes_count,
                isLiked: likeResult.liked,
              };
            }
            if (comment.replies?.length) {
              return {
                ...comment,
                replies: comment.replies.map((reply) => {
                  if (reply.id === commentId) {
                    return {
                      ...reply,
                      likesCount: likeResult.likes_count,
                      isLiked: likeResult.liked,
                    };
                  }
                  return reply;
                }),
              };
            }
            return comment;
          })
        );
      }
    } catch (err) {
      setComments(applyLikeToggle);
      logger.warn('[useComments] toggleLike rollback', {
        commentId,
        error: getErrorMessage(err),
        reason: 'API_FAILURE',
      });
      notify.error('按讚失敗', '請稍後再試');
    } finally {
      inFlightLikeIdsRef.current.delete(commentId);
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    const session = await commentService.getSession();
    if (!session) {
      notify.error('請先登入', '登入後才能刪除');
      return;
    }

    let deletedComment: FeedComment | null = null;
    let deletedFromParentId: string | null = null;
    let deletedIndex = -1;

    setComments((prev) => {
      const topLevelIndex = prev.findIndex((comment) => comment.id === commentId);
      if (topLevelIndex !== -1) {
        deletedComment = prev[topLevelIndex] ?? null;
        deletedIndex = topLevelIndex;
      } else {
        for (const comment of prev) {
          if (!comment.replies) continue;
          const replyIndex = comment.replies.findIndex((reply) => reply.id === commentId);
          if (replyIndex !== -1) {
            deletedComment = comment.replies[replyIndex] ?? null;
            deletedFromParentId = comment.id;
            deletedIndex = replyIndex;
            break;
          }
        }
      }

      const filtered = prev.filter((comment) => comment.id !== commentId);
      return filtered.map((comment) => {
        if (!comment.replies) return comment;
        const filteredReplies = comment.replies.filter((reply) => reply.id !== commentId);
        const deletedCount = comment.replies.length - filteredReplies.length;
        return {
          ...comment,
          replies: filteredReplies,
          repliesCount: Math.max(0, comment.repliesCount - deletedCount),
        };
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

      const result = await parseCommentApiResponse(
        response,
        DeleteCommentResponseSchema,
        '刪除留言 API 回傳格式錯誤'
      );
      if (!result.success) {
        throw new Error(getErrorMessage(result.error));
      }

      notify.success('留言已刪除');
    } catch (err) {
      const rollbackComment = deletedComment;
      if (rollbackComment) {
        setComments((prev) => {
          if (deletedFromParentId) {
            return prev.map((comment) => {
              if (comment.id !== deletedFromParentId) {
                return comment;
              }
              const newReplies = [...(comment.replies || [])];
              if (deletedIndex >= 0 && deletedIndex <= newReplies.length) {
                newReplies.splice(deletedIndex, 0, rollbackComment);
              } else {
                newReplies.push(rollbackComment);
              }
              return {
                ...comment,
                replies: newReplies,
                repliesCount: comment.repliesCount + 1,
              };
            });
          }

          const newComments = [...prev];
          if (deletedIndex >= 0 && deletedIndex <= newComments.length) {
            newComments.splice(deletedIndex, 0, rollbackComment);
          } else {
            newComments.push(rollbackComment);
          }
          return newComments;
        });
      }

      logger.warn('[useComments] deleteComment rollback', {
        commentId,
        error: getErrorMessage(err),
        reason: 'API_FAILURE',
      });
      notify.error('刪除失敗', '請稍後再試');
    }
  }, []);

  const loadReplies = useCallback(async (commentId: string) => {
    setIsLoadingReplies(true);

    try {
      const replies = await commentService.fetchReplies(commentId);

      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id !== commentId) {
            return comment;
          }
          const serverIds = new Set(replies.map((reply) => reply.id));
          const localOnlyReplies = (comment.replies || []).filter(
            (reply) => !serverIds.has(reply.id)
          );
          return {
            ...comment,
            replies: [...replies, ...localOnlyReplies],
          };
        })
      );
    } catch (err) {
      const e = toError(err, '載入回覆失敗');
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
