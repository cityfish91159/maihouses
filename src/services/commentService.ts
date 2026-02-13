import { z } from 'zod';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { FeedComment } from '../types/comment';
import { transformApiComment } from '../types/comment';

const COMMENT_SELECT_FIELDS = `
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
`;

const CommentAuthorSchema = z
  .object({
    id: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    floor: z.string().nullable().optional(),
  })
  .nullable();

const CommentRowSchema = z.object({
  id: z.string(),
  post_id: z.string(),
  parent_id: z.string().nullable().optional(),
  content: z.string(),
  likes_count: z.number().nullable().optional(),
  liked_by: z.array(z.string()).nullable().optional(),
  replies_count: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
  author: CommentAuthorSchema.optional(),
});

const CommentRowsSchema = z.array(CommentRowSchema);

type CommentRow = z.infer<typeof CommentRowSchema>;

function toFeedComment(row: CommentRow, userId: string | null): FeedComment {
  const author = row.author
    ? {
        id: row.author.id ?? '',
        name: row.author.name ?? '匿名用戶',
        avatar_url: row.author.avatar_url ?? undefined,
        role: row.author.role ?? undefined,
        floor: row.author.floor ?? undefined,
      }
    : null;

  const comment = transformApiComment({
    id: row.id,
    post_id: row.post_id,
    parent_id: row.parent_id ?? null,
    content: row.content,
    likes_count: row.likes_count ?? 0,
    liked_by: row.liked_by ?? [],
    replies_count: row.replies_count ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
    author,
  });

  const likedBy = row.liked_by ?? [];
  comment.isLiked = Boolean(userId && likedBy.includes(userId));
  return comment;
}

function mapRowsToFeedComments(data: unknown, userId: string | null): FeedComment[] {
  const parsed = CommentRowsSchema.safeParse(data ?? []);
  if (!parsed.success) {
    throw new Error('留言資料格式錯誤');
  }
  return parsed.data.map((row) => toFeedComment(row, userId));
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user?.id ?? null;
}

async function getSession(): Promise<Session | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  return session;
}

async function fetchTopLevelComments(postId: string, communityId: string): Promise<FeedComment[]> {
  const { data, error } = await supabase
    .from('community_comments')
    .select(COMMENT_SELECT_FIELDS)
    .eq('post_id', postId)
    .eq('community_id', communityId)
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const userId = await getCurrentUserId();
  return mapRowsToFeedComments(data, userId);
}

async function fetchReplies(parentId: string): Promise<FeedComment[]> {
  const { data, error } = await supabase
    .from('community_comments')
    .select(COMMENT_SELECT_FIELDS)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const userId = await getCurrentUserId();
  return mapRowsToFeedComments(data, userId);
}

export const commentService = {
  getSession,
  fetchTopLevelComments,
  fetchReplies,
};
