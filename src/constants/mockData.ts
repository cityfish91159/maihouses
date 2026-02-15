import type { PerformanceStats, TodoItem, UagSummary } from '../types/agent';
import type { ActiveTransaction, ProfileStats, SaleItem } from '../types/feed';
import type { AgentProfile } from '../pages/UAG/types/uag.types';
import type { AgentProfileMe } from '../types/agent.types';
import { deepFreeze } from '../lib/deepFreeze';

/**
 * Centralized Mock Data Constants
 *
 * Single source of truth for shared mock values used by:
 * - Feed (consumer/agent)
 * - UAG dashboard
 * - Agent profile defaults
 */

const MOCK_SCORE = 92;
const MOCK_GROWTH = 15;
const MOCK_ACTIVE_DAYS = 128;
const MOCK_LIKED_COUNT = 73;
const MOCK_CONTRIBUTIONS = 15;

export const MOCK_AGENT_IDENTITIES = deepFreeze({
  primaryAgentName: '游傑倫',
  secondaryAgentName: '林筱婷',
  defaultCompanyName: '',
  defaultCommunityName: '惠宇上晴',
} as const);

export const MOCK_PROPERTY_TITLES = deepFreeze({
  huiyu12F: '惠宇上晴 12F',
  huiyu8F: '惠宇上晴 8F',
} as const);

export const MOCK_FEED_STATS: ProfileStats = deepFreeze({
  days: MOCK_ACTIVE_DAYS,
  liked: MOCK_LIKED_COUNT,
  contributions: MOCK_CONTRIBUTIONS,
});

export const MOCK_SALE_ITEMS: SaleItem[] = deepFreeze([
  {
    id: '1',
    title: MOCK_PROPERTY_TITLES.huiyu12F,
    price: 1280,
    priceUnit: '萬',
    communityName: MOCK_AGENT_IDENTITIES.defaultCommunityName,
  },
  {
    id: '2',
    title: MOCK_PROPERTY_TITLES.huiyu8F,
    price: 1150,
    priceUnit: '萬',
    communityName: MOCK_AGENT_IDENTITIES.defaultCommunityName,
  },
]);

export const MOCK_ACTIVE_TRANSACTION: ActiveTransaction = deepFreeze({
  hasActive: true,
  propertyName: MOCK_PROPERTY_TITLES.huiyu12F,
  stage: 'negotiation',
});

export const MOCK_UAG_SUMMARY: UagSummary = deepFreeze({
  grade: 'S',
  score: MOCK_SCORE,
  growth: MOCK_GROWTH,
  tags: ['回覆迅速', '社區熟悉', '協調力高'],
});

export const MOCK_AGENT_PROFILE: AgentProfile = deepFreeze({
  id: 'mock-agent-001',
  internalCode: 88001,
  name: MOCK_AGENT_IDENTITIES.primaryAgentName,
  avatarUrl: null,
  company: 'MaiHouses',
  trustScore: 87,
  encouragementCount: 23,
  visitCount: 156,
  dealCount: 45,
});

export const MOCK_AGENT_PROFILE_ME: AgentProfileMe = deepFreeze({
  id: MOCK_AGENT_PROFILE.id,
  internalCode: MOCK_AGENT_PROFILE.internalCode,
  name: MOCK_AGENT_PROFILE.name,
  avatarUrl: MOCK_AGENT_PROFILE.avatarUrl ?? null,
  company: MOCK_AGENT_PROFILE.company ?? null,
  trustScore: MOCK_AGENT_PROFILE.trustScore,
  encouragementCount: MOCK_AGENT_PROFILE.encouragementCount,
  visitCount: MOCK_AGENT_PROFILE.visitCount,
  dealCount: MOCK_AGENT_PROFILE.dealCount,
  bio: 'Focus on Taipei metro area housing with first-home buyer consulting.',
  specialties: ['Transit-oriented housing', 'School district', 'First-home consulting'],
  certifications: ['Real Estate Broker', 'Land Administration Agent'],
  phone: '0912345678',
  lineId: 'maihouses_demo',
  licenseNumber: '(113) Taipei Broker No.004521',
  isVerified: true,
  verifiedAt: '2024-06-15T00:00:00Z',
  serviceRating: 4.8,
  reviewCount: 32,
  completedCases: 45,
  activeListings: 12,
  serviceYears: 4,
  joinedAt: '2021-02-01',
  email: null,
  points: 1200,
  quotaS: 5,
  quotaA: 10,
  createdAt: '2021-02-01T00:00:00Z',
});

export const MOCK_PERFORMANCE_STATS: PerformanceStats = deepFreeze({
  score: 2560,
  days: MOCK_ACTIVE_DAYS,
  liked: MOCK_LIKED_COUNT,
  views: 1250,
  replies: 45,
  contacts: 8,
  deals: 2,
  amount: 3280,
  clients: 18,
});

export const MOCK_TODO_LIST: TodoItem[] = deepFreeze([
  {
    id: 't1',
    type: 'reply',
    content: '回覆陳小姐詢問「惠宇上晴」的細節',
    isDone: false,
    time: '10:00',
  },
  {
    id: 't2',
    type: 'contact',
    content: '聯繫李先生安排看屋',
    isDone: false,
    time: '14:30',
  },
  {
    id: 't3',
    type: 'system',
    content: '更新個人簡介以提升信任度',
    isDone: true,
    time: 'Yesterday',
  },
]);
