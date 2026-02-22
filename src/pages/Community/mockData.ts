/**
 * Community Wall Mock Data
 *
 * Mock 資料 - 開發與測試用
 */

import type { MockData } from './types';
import { mockTimestampMinutesAgo } from '../../lib/time';
import { MOCK_AGENT_IDENTITIES, MOCK_PROPERTY_TITLES } from '../../constants/mockData';
import { deepFreeze } from '../../lib/deepFreeze';

let mockEntitySerial = 0;

function createMockEntityId(prefix: 'post' | 'question'): string {
  mockEntitySerial += 1;
  const uuidPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : `${Date.now()}-${mockEntitySerial}`;
  return `${prefix}-${uuidPart}-${mockEntitySerial}`;
}

const publicPosts = deepFreeze([
  {
    id: 1,
    author: '陳小姐',
    floor: '12F',
    type: 'resident' as const,
    time: mockTimestampMinutesAgo(120),
    title: '有人要團購掃地機嗎？',
    content: '這款 iRobot 打折，滿 5 台有團購價～',
    likes: 31,
    comments: 14,
  },
  {
    id: 2,
    author: MOCK_AGENT_IDENTITIES.primaryAgentName,
    type: 'agent' as const,
    time: mockTimestampMinutesAgo(1440),
    title: `${MOCK_PROPERTY_TITLES.huiyu12F}｜雙陽台視野戶`,
    content: '客廳光線很好，上週屋主剛降價 50 萬，有興趣可私訊。',
    views: 89,
    likes: 0,
    comments: 5,
  },
  {
    id: 3,
    author: '李先生',
    floor: '8F',
    type: 'resident' as const,
    time: mockTimestampMinutesAgo(3 * 24 * 60),
    title: '停車位交流',
    content: '我有 B2-128 想與 B1 交換，方便接送小孩',
    likes: 12,
    comments: 8,
  },
  {
    id: 4,
    author: '王太太',
    floor: '5F',
    type: 'resident' as const,
    time: mockTimestampMinutesAgo(7 * 24 * 60),
    title: '推薦水電師傅',
    content: '上次找的師傅很專業，價格公道，需要的鄰居私訊我',
    likes: 25,
    comments: 6,
  },
  {
    id: 5,
    author: MOCK_AGENT_IDENTITIES.secondaryAgentName,
    type: 'agent' as const,
    time: mockTimestampMinutesAgo(8 * 24 * 60),
    title: `${MOCK_PROPERTY_TITLES.huiyu8F}｜三房車位`,
    content: '屋況極新，前屋主自住保養好',
    views: 156,
    likes: 0,
    comments: 12,
  },
]);

const privatePosts = deepFreeze([
  {
    id: 101,
    author: '管委會',
    type: 'official' as const,
    time: mockTimestampMinutesAgo(3 * 24 * 60),
    title: '年度消防演練通知',
    content: '12/15（日）上午 10:00 將進行全社區消防演練，届時警報器會響，請勿驚慌。',
    pinned: true,
    likes: 0,
    comments: 0,
  },
  {
    id: 102,
    author: '15F 住戶',
    floor: '15F',
    type: 'resident' as const,
    time: mockTimestampMinutesAgo(8 * 24 * 60),
    title: '管理費調漲討論',
    content: '想問大家覺得管理費調漲合理嗎？從 2,800 調到 3,200，漲幅有點大...',
    likes: 0,
    comments: 28,
    private: true,
  },
  {
    id: 103,
    author: '3F 住戶',
    floor: '3F',
    type: 'resident' as const,
    time: mockTimestampMinutesAgo(14 * 24 * 60),
    title: '頂樓漏水問題',
    content: '最近下雨頂樓好像有漏水，管委會有要處理嗎？',
    likes: 0,
    comments: 15,
    private: true,
  },
]);

const reviews = deepFreeze([
  {
    id: 1,
    author: MOCK_AGENT_IDENTITIES.primaryAgentName,
    company: '21世紀',
    visits: 12,
    deals: 3,
    pros: ['公設維護得乾淨，假日草皮有人整理', '反映停車動線，管委會一週內就公告改善'],
    cons: '面向大馬路低樓層車聲明顯，喜靜者選中高樓層',
  },
  {
    id: 2,
    author: '林美玲',
    company: '信義房屋',
    visits: 8,
    deals: 2,
    pros: ['頂樓排水設計不錯，颱風天也沒有積水問題', '中庭花園維護用心，住戶反應都很正面'],
    cons: '垃圾車時間稍晚，家裡偶爾會有下水道味',
  },
  {
    id: 3,
    author: '陳志明',
    company: '永慶房屋',
    visits: 6,
    deals: 1,
    pros: ['管理員服務態度很好，代收包裹很方便', '社區有健身房，設備維護不錯'],
    cons: '電梯尖峰時段要等比較久',
  },
  {
    id: 4,
    author: '黃小華',
    company: '住商不動產',
    visits: 10,
    deals: 2,
    pros: ['學區不錯，走路到國小只要5分鐘', '附近生活機能完善'],
    cons: '部分戶型採光稍弱',
  },
  {
    id: 5,
    author: '張大明',
    company: '台灣房屋',
    visits: 5,
    deals: 1,
    pros: ['建商口碑好，用料實在', '公設比合理，實坪數划算'],
    cons: '車道坡度較陡，新手要小心',
  },
]);

const questions = deepFreeze([
  {
    id: 1,
    question: '請問社區停車位好停嗎？會不會常客滿？',
    time: mockTimestampMinutesAgo(2 * 24 * 60),
    answersCount: 2,
    answers: [
      {
        author: '12F 住戶',
        type: 'resident' as const,
        content: 'B2 比較容易有位，B1 要碰運氣。',
      },
      {
        author: MOCK_AGENT_IDENTITIES.primaryAgentName,
        type: 'agent' as const,
        content: '這社區車位配比是 1:1.2，算充裕的。',
        expert: true,
      },
    ],
  },
  {
    id: 2,
    question: '晚上會不會很吵？我看物件時是白天',
    time: mockTimestampMinutesAgo(5 * 24 * 60),
    answersCount: 2,
    answers: [
      {
        author: '3F 住戶',
        type: 'resident' as const,
        content: '面大馬路那側確實有車聲，但習慣就好。內側安靜很多。',
      },
      {
        author: '10F 住戶',
        type: 'resident' as const,
        content: '我住內側，晚上很安靜，睡眠品質不錯。',
      },
    ],
  },
  {
    id: 3,
    question: '管理費多少？有包含哪些服務？',
    time: mockTimestampMinutesAgo(7 * 24 * 60),
    answersCount: 1,
    answers: [
      {
        author: '管委會',
        type: 'official' as const,
        content: '目前每坪 85 元，含 24 小時保全、公設維護、垃圾代收。',
      },
    ],
  },
  {
    id: 4,
    question: '社區有健身房嗎？設備新不新？',
    time: mockTimestampMinutesAgo(3 * 24 * 60),
    answersCount: 0,
    answers: [],
  },
]);

export const MOCK_DATA: MockData = deepFreeze({
  communityInfo: {
    name: MOCK_AGENT_IDENTITIES.defaultCommunityName,
    year: 2018,
    units: 280,
    managementFee: 85,
    builder: '惠宇建設',
    members: 88,
    avgRating: 4.2,
    monthlyInteractions: 156,
    forSale: 23,
  },
  posts: {
    public: publicPosts,
    private: privatePosts,
    publicTotal: publicPosts.length,
    privateTotal: privatePosts.length,
  },
  reviews: {
    items: reviews,
    total: reviews.length,
  },
  questions: {
    items: questions,
    total: questions.length,
  },
});

// ============ Mock Factories ============

import type { Post, Question } from '../../types/community';
type QuestionAnswer = Question['answers'][number];

export const createMockPost = (content: string, visibility: 'public' | 'private'): Post =>
  deepFreeze({
    id: createMockEntityId('post'),
    author: '測試用戶',
    type: 'resident',
    time: new Date().toISOString(),
    title: content.substring(0, 20) + (content.length > 20 ? '...' : ''),
    content,
    likes: 0,
    comments: 0,
    pinned: false,
    private: visibility === 'private',
  });

export const createMockQuestion = (question: string): Question =>
  deepFreeze({
    id: createMockEntityId('question'),
    question,
    time: new Date().toISOString(),
    answersCount: 0,
    answers: [],
  });

export const createMockAnswer = (content: string): QuestionAnswer =>
  deepFreeze({
    author: '測試用戶',
    type: 'resident',
    content,
    expert: false,
  });
