import type {
  CommunityPost,
  CommunityReview,
  CommunityQuestion,
  CommunityWallData,
} from '../services/communityService';
import type { Post, Review, Question, CommunityInfo, UnifiedWallData } from '../types/community';

export type { UnifiedWallData };

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
  const company = agent?.company?.trim();
  const normalizedCompany = company && company !== '房仲公司' ? company : '';

  return {
    id: review.id,
    author: agent?.name || '匿名房仲',
    company: normalizedCompany,
    visits: agent?.stats?.visits ?? 0,
    deals: agent?.stats?.deals ?? 0,
    pros: review.content.pros || [],
    cons: review.content.cons || '',
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
  const convertedPrivate = (apiData.posts?.private ?? []).map(convertApiPost);
  const sortedPrivate = [...convertedPrivate].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
  );

  const communityInfo: CommunityInfo = apiData.communityInfo
    ? {
        name: apiData.communityInfo.name,
        year: apiData.communityInfo.year,
        units: apiData.communityInfo.units,
        managementFee: apiData.communityInfo.managementFee,
        builder: apiData.communityInfo.builder,
        members: apiData.communityInfo.members ?? mockFallback.members ?? 0,
        avgRating: apiData.communityInfo.avgRating ?? mockFallback.avgRating ?? 0,
        monthlyInteractions:
          apiData.communityInfo.monthlyInteractions ??
          mockFallback.monthlyInteractions ?? 0,
        forSale: apiData.communityInfo.forSale ?? mockFallback.forSale ?? 0,
      }
    : mockFallback;

  return {
    communityInfo,
    posts: {
      public: (apiData.posts?.public ?? []).map(convertApiPost),
      private: sortedPrivate,
      publicTotal: apiData.posts?.publicTotal ?? 0,
      privateTotal: apiData.posts?.privateTotal ?? 0,
    },
    reviews: {
      items: (apiData.reviews?.items ?? []).map(convertApiReview),
      total: apiData.reviews?.total ?? 0,
    },
    questions: {
      items: (apiData.questions?.items ?? []).map(convertApiQuestion),
      total: apiData.questions?.total ?? 0,
    },
  };
}
