/**
 * Feed Mock Data - Main Entry
 *
 * Centralized mock data exports with deep copy to prevent state mutation.
 * Following UAG/Community mockData patterns.
 */

// Re-export shared utilities
export * from './shared';

// Re-export factories
export * from './factories';

// Re-export raw data (for reference only, prefer using getters below)
export { CONSUMER_MOCK_POSTS } from './posts/consumer';
export {
  AGENT_MOCK_POSTS,
  AGENT_UAG_SUMMARY,
  AGENT_PERFORMANCE_STATS,
  AGENT_TODO_LIST,
  AGENT_SAFETY_TRACE_POSTS,
  type SafetyTracePost,
} from './posts/agent';

// ============ Deep Copy Getters ============

import { CONSUMER_MOCK_POSTS } from './posts/consumer';
import {
  AGENT_MOCK_POSTS,
  AGENT_UAG_SUMMARY,
  AGENT_PERFORMANCE_STATS,
  AGENT_TODO_LIST,
  AGENT_SAFETY_TRACE_POSTS,
} from './posts/agent';
import type { FeedPost } from '../../../types/feed';
import type { UagSummary, PerformanceStats, TodoItem } from '../../../types/agent';
import type { SafetyTracePost } from './posts/agent';

/**
 * Deep clone utility using structuredClone
 * Falls back to JSON parse/stringify for older environments
 */
const deepClone = <T>(obj: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
};

// ============ Consumer Data Getters ============

/**
 * Get a fresh copy of Consumer mock posts
 * Always returns a new array to prevent state mutation
 */
export const getConsumerMockPosts = (): FeedPost[] => deepClone(CONSUMER_MOCK_POSTS);

// ============ Agent Data Getters ============

/**
 * Get a fresh copy of Agent mock posts
 */
export const getAgentMockPosts = (): FeedPost[] => deepClone(AGENT_MOCK_POSTS);

/**
 * Get a fresh copy of Agent UAG summary
 */
export const getAgentUagSummary = (): UagSummary => deepClone(AGENT_UAG_SUMMARY);

/**
 * Get a fresh copy of Agent performance stats
 */
export const getAgentPerformanceStats = (): PerformanceStats => deepClone(AGENT_PERFORMANCE_STATS);

/**
 * Get a fresh copy of Agent todo list
 */
export const getAgentTodoList = (): TodoItem[] => deepClone(AGENT_TODO_LIST);

/**
 * Get a fresh copy of Agent safety trace posts
 */
export const getAgentSafetyTracePosts = (): SafetyTracePost[] => deepClone(AGENT_SAFETY_TRACE_POSTS);

// ============ Combined Data for useFeedData ============

import type { UnifiedFeedData, SidebarData } from '../../../types/feed';
import { MOCK_SALE_ITEMS } from '../../../services/mock/feed';

/**
 * Derive sidebar data from posts
 */
const deriveSidebarData = (posts: FeedPost[]): SidebarData => {
  const HOT_POSTS_LIMIT = 3;
  const hotPosts = [...posts]
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, HOT_POSTS_LIMIT)
    .map(p => ({
      id: p.id,
      title: p.title,
      communityName: p.communityName || '未知社區',
      likes: p.likes || 0,
    }));

  return {
    hotPosts,
    saleItems: MOCK_SALE_ITEMS,
  };
};

/**
 * Get Consumer unified feed data (for useFeedData)
 */
export const getConsumerFeedData = (): UnifiedFeedData => {
  const posts = getConsumerMockPosts();
  return {
    posts,
    totalPosts: posts.length,
    sidebarData: deriveSidebarData(posts),
  };
};

/**
 * Get Agent unified feed data (for useFeedData)
 */
export const getAgentFeedData = (): UnifiedFeedData => {
  const posts = getAgentMockPosts();
  return {
    posts,
    totalPosts: posts.length,
    sidebarData: deriveSidebarData(posts),
  };
};
