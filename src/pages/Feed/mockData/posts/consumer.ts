/**
 * Feed Mock Data - Consumer Posts
 *
 * Mock posts for Consumer feed view.
 * Focuses on community life, neighborhood interactions, and resident discussions.
 */

import type { FeedComment } from '../../../../types/comment';
import type { FeedPost } from '../../../../types/feed';
import {
  mockTimestampHoursAgo,
  mockTimestampDaysAgo,
  MOCK_COMMUNITIES,
  MOCK_AUTHORS,
} from '../shared';

// ============ Mock Comments Factory ============

const createConsumerComments = (postId: number): FeedComment[] => [
  {
    id: `c-${postId}-1`,
    postId: String(postId),
    author: {
      id: 'wang-id',
      name: MOCK_AUTHORS.WANG_MS.name,
      role: 'resident',
    },
    content: '真的嗎？我也想參加團購！',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    likesCount: 2,
    repliesCount: 0,
    time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    likes: 2,
  },
  {
    id: `c-${postId}-2`,
    postId: String(postId),
    author: {
      id: 'li-id',
      name: MOCK_AUTHORS.LI_MR.name,
      role: 'resident',
    },
    content: '+1',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    likesCount: 0,
    repliesCount: 0,
    time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    likes: 0,
  },
];

// ============ Consumer Mock Posts ============

/**
 * Consumer-specific mock posts
 * Content focuses on:
 * - Group buying / Community deals
 * - Parking spot exchanges
 * - Service recommendations
 * - Agent property listings visible to consumers
 */
export const CONSUMER_MOCK_POSTS: FeedPost[] = [
  {
    id: 1001,
    author: MOCK_AUTHORS.CHEN_MS.name,
    floor: MOCK_AUTHORS.CHEN_MS.floor,
    type: MOCK_AUTHORS.CHEN_MS.type,
    time: mockTimestampHoursAgo(2),
    title: '有人要團購掃地機嗎？🤖',
    content: '這款 iRobot 打折，滿 5 台有團購價～',
    images: [
      {
        src: 'https://picsum.photos/id/1/800/600',
        alt: '團購說明圖片',
      },
    ],
    likes: 31,
    comments: 2,
    communityId: MOCK_COMMUNITIES.HUIYU.id,
    communityName: MOCK_COMMUNITIES.HUIYU.name,
    commentList: createConsumerComments(1001),
  },
  {
    id: 1002,
    author: MOCK_AUTHORS.YOU_AGENT.name,
    type: MOCK_AUTHORS.YOU_AGENT.type,
    time: mockTimestampDaysAgo(1),
    title: '🏡 惠宇上晴 12F｜雙陽台視野戶',
    content: '客廳光線很好，上週屋主剛降價 50 萬，有興趣可私訊。',
    images: [
      {
        src: 'https://picsum.photos/id/13/800/600',
        alt: '寬敞明亮的客廳',
      },
      {
        src: 'https://picsum.photos/id/15/800/600',
        alt: '陽台視野',
      },
      {
        src: 'https://picsum.photos/id/29/800/600',
        alt: '乾淨衛浴',
      },
    ],
    views: 89,
    likes: 0,
    comments: 0,
    communityId: MOCK_COMMUNITIES.HUIYU.id,
    communityName: MOCK_COMMUNITIES.HUIYU.name,
    commentList: [],
  },
  {
    id: 1003,
    author: MOCK_AUTHORS.LI_MR.name,
    floor: MOCK_AUTHORS.LI_MR.floor,
    type: MOCK_AUTHORS.LI_MR.type,
    time: mockTimestampDaysAgo(3),
    title: '停車位交流 🚗',
    content: '我有 B2-128 想與 B1 交換，方便接送小孩',
    likes: 12,
    comments: 1,
    communityId: MOCK_COMMUNITIES.FARGLORY.id,
    communityName: MOCK_COMMUNITIES.FARGLORY.name,
    commentList: [
      {
        id: 'c-1003-1',
        postId: '1003',
        author: {
          id: 'zhang-id',
          name: MOCK_AUTHORS.ZHANG_MR.name,
          role: 'member',
        },
        content: '我有興趣，私訊您',
        createdAt: mockTimestampDaysAgo(2),
        likesCount: 1,
        repliesCount: 0,
        time: mockTimestampDaysAgo(2),
        likes: 1,
      },
    ],
  },
  {
    id: 1004,
    author: MOCK_AUTHORS.WANG_MS.name,
    floor: MOCK_AUTHORS.WANG_MS.floor,
    type: MOCK_AUTHORS.WANG_MS.type,
    time: mockTimestampDaysAgo(7),
    title: '推薦水電師傅',
    content: '上次找的師傅很專業，價格公道，需要的鄰居私訊我',
    likes: 25,
    comments: 0,
    communityId: MOCK_COMMUNITIES.CATHAY.id,
    communityName: MOCK_COMMUNITIES.CATHAY.name,
    commentList: [],
  },
  {
    id: 1005,
    author: MOCK_AUTHORS.LIN_AGENT.name,
    type: MOCK_AUTHORS.LIN_AGENT.type,
    time: mockTimestampDaysAgo(8),
    title: '🏡 惠宇上晴 8F｜三房車位',
    content: '屋況極新，前屋主自住保養好',
    images: [
      {
        src: 'https://picsum.photos/id/59/800/600',
        alt: '溫馨臥室',
      },
      {
        src: 'https://picsum.photos/id/60/800/600',
        alt: '功能齊全的廚房',
      },
    ],
    views: 156,
    likes: 0,
    comments: 0,
    communityId: MOCK_COMMUNITIES.HUIYU.id,
    communityName: MOCK_COMMUNITIES.HUIYU.name,
    commentList: [],
  },
];
