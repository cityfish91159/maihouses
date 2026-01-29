import type {
  CommunityPost,
  CommunityReview,
  CommunityQuestion,
  CommunityWallData,
} from '../services/communityService';
import type { Post, Review, Question, CommunityInfo, UnifiedWallData } from '../types/community';

export type { UnifiedWallData };

/**
 * 過濾 DB 預設的 placeholder 值，避免 UI 顯示無意義文字
 * 這些值是資料庫預設或人為輸入的無效公司名稱
 */
const PLACEHOLDER_COMPANY_NAMES = ['房仲公司', '未知公司', 'N/A', '無', '-'];

type ResolvedAuthorRole = 'resident' | 'member' | 'agent' | 'official';

const ROLE_LABELS: Record<ResolvedAuthorRole, string> = {
  resident: '用戶',
  member: '會員',
  agent: '房仲',
  official: '官方',
};

function normalizeAuthorRole(role?: string | null): ResolvedAuthorRole {
  if (role === 'agent') return 'agent';
  if (role === 'official') return 'official';
  if (role === 'member') return 'member';
  return 'resident';
}

function safeAuthorIdSuffix(authorId?: string | null): string {
  if (!authorId) return '';
  return authorId.length >= 6 ? authorId.slice(0, 6) : authorId;
}

function buildFallbackAuthor(role: ResolvedAuthorRole, authorId?: string | null): string {
  const label = ROLE_LABELS[role];
  const suffix = safeAuthorIdSuffix(authorId);
  return suffix ? `${label}-${suffix}` : label;
}

export function resolveAuthorDisplay(
  authorId?: string | null,
  author?: {
    name?: string | null;
    role?: string | null;
    floor?: string | null;
  }
) {
  const role = normalizeAuthorRole(author?.role);
  const fallback = buildFallbackAuthor(role, authorId);
  const name = author?.name?.trim() || fallback;
  const floor = author?.floor?.trim();

  return {
    name,
    role,
    ...(floor ? { floor } : {}),
  } as { name: string; role: ResolvedAuthorRole; floor?: string };
}

/**
 * 統一排序邏輯：pinned 優先，同 pinned 狀態則保持原始順序（穩定排序）
 * 使用 index 作為次要排序鍵確保穩定性
 */
export function sortPostsWithPinned(posts: Post[]): Post[] {
  return posts
    .map((post, index) => ({ post, index }))
    .sort((a, b) => {
      // 主排序：pinned 優先
      const pinnedDiff = (b.post.pinned ? 1 : 0) - (a.post.pinned ? 1 : 0);
      if (pinnedDiff !== 0) return pinnedDiff;
      // 次排序：保持原始順序（API 已按時間排序）
      return a.index - b.index;
    })
    .map(({ post }) => post);
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '剛剛';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMs < 0) {
    return date.toLocaleDateString('zh-TW');
  }
  if (diffMins < 1) return '剛剛';
  if (diffMins < 60) return `${diffMins}分鐘前`;
  if (diffHours < 24) return `${diffHours}小時前`;
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffWeeks < 4) return `${diffWeeks}週前`;
  return date.toLocaleDateString('zh-TW');
}

export function convertApiPost(post: CommunityPost): Post {
  const authorInfo = resolveAuthorDisplay(post.author_id, post.author);

  return {
    id: post.id,
    author: authorInfo.name,
    ...(authorInfo.floor ? { floor: authorInfo.floor } : {}),
    type: authorInfo.role,
    time: formatTimeAgo(post.created_at),
    title: post.content.substring(0, 20) + (post.content.length > 20 ? '...' : ''),
    content: post.content,
    likes: post.likes_count,
    comments: post.comments_count ?? 0,
    pinned: post.is_pinned ?? false,
    private: post.visibility === 'private',
    liked_by: post.liked_by,
  };
}

export function convertApiReview(review: CommunityReview): Review {
  const agent = review.agent;
  const company = agent?.company?.trim() ?? '';
  const authorInfo = resolveAuthorDisplay(review.author_id, {
    name: agent?.name ?? null,
    role: 'agent',
  });
  // 過濾 placeholder 公司名稱
  const normalizedCompany = PLACEHOLDER_COMPANY_NAMES.includes(company) ? '' : company;

  return {
    id: review.id,
    author: authorInfo.name,
    company: normalizedCompany,
    visits: agent?.stats?.visits ?? 0,
    deals: agent?.stats?.deals ?? 0,
    pros: review.content?.pros ?? [],
    cons: review.content?.cons ?? '',
  };
}

export function convertApiQuestion(question: CommunityQuestion): Question {
  const answers = question.answers ?? [];
  return {
    id: question.id,
    question: question.question,
    time: formatTimeAgo(question.created_at),
    answersCount: answers.length,
    answers: answers.map((answer) => {
      const authorInfo = resolveAuthorDisplay(answer.author_id, answer.author);

      return {
        author: authorInfo.name,
        type: authorInfo.role,
        content: answer.content,
        expert: answer.is_expert,
      };
    }),
    // 非會員限流相關欄位
    hasMoreAnswers: question.hasMoreAnswers ?? false,
    totalAnswers: question.totalAnswers ?? question.answers_count ?? answers.length,
  };
}

export function convertApiData(apiData: CommunityWallData): UnifiedWallData {
  // 防禦性處理：確保 posts/reviews/questions 不為 null
  const publicPosts = apiData.posts?.public ?? [];
  const privatePosts = apiData.posts?.private ?? [];
  const reviewItems = apiData.reviews?.items ?? [];
  const questionItems = apiData.questions?.items ?? [];

  const convertedPublic = publicPosts.map(convertApiPost);
  const convertedPrivate = privatePosts.map(convertApiPost);

  const sortedPublic = sortPostsWithPinned(convertedPublic);
  const sortedPrivate = sortPostsWithPinned(convertedPrivate);

  const communityInfo: CommunityInfo = apiData.communityInfo
    ? {
        name: apiData.communityInfo.name ?? '未知社區',
        year: apiData.communityInfo.year ?? null, // null 則前端顯示「未知」
        units: apiData.communityInfo.units ?? null,
        managementFee: apiData.communityInfo.managementFee ?? null,
        builder: apiData.communityInfo.builder ?? null,
        members: apiData.communityInfo.members ?? null,
        avgRating: apiData.communityInfo.avgRating ?? null,
        monthlyInteractions: apiData.communityInfo.monthlyInteractions ?? null,
        forSale: apiData.communityInfo.forSale ?? null,
      }
    : {
        name: '未知社區',
        year: null,
        units: null,
        managementFee: null,
        builder: null,
        members: null,
        avgRating: null,
        monthlyInteractions: null,
        forSale: null,
      };

  return {
    communityInfo,
    posts: {
      public: sortedPublic,
      private: sortedPrivate,
      publicTotal: apiData.posts?.publicTotal ?? 0,
      privateTotal: apiData.posts?.privateTotal ?? 0,
    },
    reviews: {
      items: reviewItems.map(convertApiReview),
      total: apiData.reviews?.total ?? 0,
    },
    questions: {
      items: questionItems.map(convertApiQuestion),
      total: apiData.questions?.total ?? 0,
    },
  };
}
