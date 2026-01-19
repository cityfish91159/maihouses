/**
 * 留言系統型別定義
 * FEED-01: 支援巢狀回覆
 */

// [NASA TypeScript Safety] 導出 role 類型供外部使用
export type FeedCommentAuthorRole = "resident" | "member" | "agent" | "official";

export interface CommentAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  role: FeedCommentAuthorRole;
  floor?: string;
}

export interface FeedComment {
  id: string;
  postId: string;
  parentId?: string;
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

// 有效角色列表
const VALID_ROLES: CommentAuthor["role"][] = [
  "resident",
  "member",
  "agent",
  "official",
];

function isValidRole(role: unknown): role is CommentAuthor["role"] {
  return (
    typeof role === "string" &&
    VALID_ROLES.includes(role as CommentAuthor["role"])
  );
}

// API 回傳格式轉換
export function transformApiComment(raw: Record<string, unknown>): FeedComment {
  const author = raw.author as Record<string, unknown> | null;

  const result: FeedComment = {
    id: String(raw.id),
    postId: String(raw.post_id),
    author: {
      id: author?.id ? String(author.id) : "",
      name: String(author?.name || "匿名用戶"),
      role: isValidRole(author?.role) ? author.role : "member",
    },
    content: String(raw.content),
    createdAt: String(raw.created_at),
    likesCount: Number(raw.likes_count) || 0,
    isLiked: Boolean(raw.is_liked),
    repliesCount: Number(raw.replies_count) || 0,
    // replies: undefined 表示未載入，[] 表示已載入但無回覆
  };

  // Optional fields for exactOptionalPropertyTypes compatibility
  if (raw.parent_id) result.parentId = String(raw.parent_id);
  if (raw.updated_at) result.updatedAt = String(raw.updated_at);
  if (author?.avatar_url) result.author.avatarUrl = String(author.avatar_url);
  if (author?.floor) result.author.floor = String(author.floor);

  return result;
}
