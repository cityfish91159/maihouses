/**
 * Feed Mock Data - Factory Functions
 *
 * Factory functions for creating mock data dynamically.
 * Following Community mockData patterns.
 */

import type { FeedComment } from '../../../types/comment';
import type { FeedPost } from '../../../types/feed';
import { generateMockId, MOCK_AUTHORS } from './shared';

// ============ Post Factory ============

export interface CreatePostOptions {
  author?: string;
  floor?: string;
  type?: FeedPost['type'];
  communityId?: string;
  communityName?: string;
  images?: FeedPost['images'];
}

/**
 * Create a mock FeedPost
 */
export const createMockPost = (content: string, options: CreatePostOptions = {}): FeedPost => {
  const {
    author = MOCK_AUTHORS.TEST_USER.name,
    floor,
    type = MOCK_AUTHORS.TEST_USER.type,
    communityId,
    communityName,
    images,
  } = options;

  const base: FeedPost = {
    id: generateMockId(),
    author,
    type,
    time: new Date().toISOString(),
    title: content.length > 20 ? `${content.substring(0, 20)}...` : content,
    content,
    likes: 0,
    comments: 0,
    pinned: false,
    commentList: [],
  };

  // Conditionally add optional properties to avoid undefined values
  if (floor) base.floor = floor;
  if (communityId) base.communityId = communityId;
  if (communityName) base.communityName = communityName;
  if (images) base.images = images;

  return base;
};

// ============ Comment Factory ============

export interface CreateCommentOptions {
  author?: string;
  role?: 'resident' | 'member' | 'agent' | 'official';
}

/**
 * Create a mock FeedComment
 */
export const createMockComment = (
  postId: string | number,
  content: string,
  options: CreateCommentOptions = {}
): FeedComment => {
  const { author = MOCK_AUTHORS.TEST_USER.name, role = 'member' } = options;

  return {
    id: `c-${postId}-${generateMockId()}`,
    postId: String(postId),
    author: {
      id: 'mock-user-id',
      name: author,
      role,
    },
    content,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    isLiked: false,
    repliesCount: 0,
    // 相容舊欄位
    authorName: author,
    time: new Date().toISOString(),
    likes: 0,
  };
};

// ============ Safety Trace Factory ============

import type { SafetyTracePost } from './posts/agent';

/**
 * Create a mock SafetyTracePost
 */
export const createMockSafetyTrace = (
  property: string,
  certificateNo: string
): SafetyTracePost => ({
  id: generateMockId(),
  type: 'safety_trace',
  certificateNo,
  property,
  time: new Date().toISOString(),
  duration: '00:00–00:30',
  photoCount: 0,
  summary: '帶看資料已留存。',
  tags: ['帶看完成'],
});
