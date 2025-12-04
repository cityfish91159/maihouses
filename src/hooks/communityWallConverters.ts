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
  const floor = post.author?.floor?.trim();

  return {
    id: post.id,
    author: post.author?.name || '匿名',
    ...(floor ? { floor } : {}),
    type: (post.author?.role as 'resident' | 'agent' | 'official') || 'resident',
    time: formatTimeAgo(post.created_at),
    title:
      post.content.substring(0, 20) + (post.content.length > 20 ? '...' : ''),
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
  // 過濾 placeholder 公司名稱
  const normalizedCompany = PLACEHOLDER_COMPANY_NAMES.includes(company) ? '' : company;

  return {
    id: review.id,
    author: agent?.name || '匿名房仲',
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
    answers: answers.map(answer => ({
      author: answer.author?.name || '匿名',
      type: (answer.author?.role as 'resident' | 'agent' | 'official') || 'resident',
      content: answer.content,
      expert: answer.is_expert,
    })),
  };
}

export function convertApiData(
  apiData: CommunityWallData,
  mockFallback: CommunityInfo
): UnifiedWallData {
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
        year: apiData.communityInfo.year ?? null,  // null 則前端顯示「未知」
        units: apiData.communityInfo.units ?? null,
        managementFee: apiData.communityInfo.managementFee ?? null,
        builder: apiData.communityInfo.builder ?? null,
        // 真實統計資料，若 API 回傳 undefined/null 則顯示 null（前端會顯示「-」）
        members: apiData.communityInfo.members ?? null,
        avgRating: apiData.communityInfo.avgRating ?? null,
        monthlyInteractions: apiData.communityInfo.monthlyInteractions ?? null,
        forSale: apiData.communityInfo.forSale ?? null,
      }
    : mockFallback;

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
