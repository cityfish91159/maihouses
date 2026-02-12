/**
 * Feed Mock Data - Agent Posts & Data
 *
 * Mock data for Agent feed view.
 * Includes: UAG Summary, Performance Stats, Todo List, Safety Trace Posts
 */

import type { FeedPost } from '../../../../types/feed';
import {
  mockTimestampHoursAgo,
  mockTimestampDaysAgo,
  MOCK_COMMUNITIES,
  MOCK_AUTHORS,
} from '../shared';
import {
  MOCK_UAG_SUMMARY as SHARED_UAG_SUMMARY,
  MOCK_PERFORMANCE_STATS as SHARED_PERFORMANCE_STATS,
  MOCK_TODO_LIST as SHARED_TODO_LIST,
} from '../../../../constants/mockData';

// ============ Agent UAG Data ============

export const AGENT_UAG_SUMMARY = SHARED_UAG_SUMMARY;
export const AGENT_PERFORMANCE_STATS = SHARED_PERFORMANCE_STATS;
export const AGENT_TODO_LIST = SHARED_TODO_LIST;

// ============ Safety Trace Post Type ============

export interface SafetyTracePost {
  id: number;
  type: 'safety_trace';
  certificateNo: string;
  property: string;
  time: string;
  duration: string;
  photoCount: number;
  summary: string;
  tags: string[];
}

export const AGENT_SAFETY_TRACE_POSTS: SafetyTracePost[] = [
  {
    id: 2001,
    type: 'safety_trace',
    certificateNo: 'MJ-2025-11-10-0007',
    property: '惠宇上晴 12F A2',
    time: '剛剛',
    duration: '11:30–12:05',
    photoCount: 3,
    summary: '簽到、位置軌跡、現場照片與對話摘要已留存。',
    tags: ['帶看完成', '留痕憑證', '僅雙方可見'],
  },
];

// ============ Agent Feed Posts ============

/**
 * Agent-specific mock posts
 * Content focuses on:
 * - Property listings with professional tone
 * - Market insights and analysis
 * - Community updates relevant to agents
 */
export const AGENT_MOCK_POSTS: FeedPost[] = [
  {
    id: 2101,
    author: MOCK_AUTHORS.YOU_AGENT.name,
    type: MOCK_AUTHORS.YOU_AGENT.type,
    time: mockTimestampHoursAgo(1),
    title: '🏡 惠宇上晴 12F｜雙陽台視野戶',
    content:
      '客廳光線很好，上週屋主剛降價 50 萬，有興趣可私訊。AI 體檢：屋況良好｜低公設比 31%｜社區評分 4.6★',
    views: 89,
    likes: 5,
    comments: 2,
    communityId: MOCK_COMMUNITIES.HUIYU.id,
    communityName: MOCK_COMMUNITIES.HUIYU.name,
    commentList: [],
  },
  {
    id: 2102,
    author: MOCK_AUTHORS.LIN_AGENT.name,
    type: MOCK_AUTHORS.LIN_AGENT.type,
    time: mockTimestampDaysAgo(2),
    title: '🏡 惠宇上晴 8F｜三房車位',
    content: '屋況極新，前屋主自住保養好。適合首購族或小家庭。',
    views: 156,
    likes: 3,
    comments: 1,
    communityId: MOCK_COMMUNITIES.HUIYU.id,
    communityName: MOCK_COMMUNITIES.HUIYU.name,
    commentList: [],
  },
  {
    id: 2103,
    author: MOCK_AUTHORS.CHEN_MS.name,
    floor: MOCK_AUTHORS.CHEN_MS.floor,
    type: MOCK_AUTHORS.CHEN_MS.type,
    time: mockTimestampDaysAgo(3),
    title: '有人要團購掃地機嗎？🤖',
    content: '這款 iRobot 打折，滿 5 台有團購價～',
    likes: 31,
    comments: 14,
    communityId: MOCK_COMMUNITIES.HUIYU.id,
    communityName: MOCK_COMMUNITIES.HUIYU.name,
    commentList: [],
  },
];
