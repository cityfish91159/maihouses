import { deepFreeze } from '../../lib/deepFreeze';

export interface CommunityWallSummaryMock {
  reviewCount: number;
  rating: number;
}

const COMMUNITY_WALL_SUMMARY_BY_NAME = deepFreeze<Record<string, CommunityWallSummaryMock>>({
  快樂花園: { reviewCount: 28, rating: 4.3 },
  遠雄二代宅: { reviewCount: 45, rating: 4.1 },
  美河市: { reviewCount: 67, rating: 3.9 },
  景安和院: { reviewCount: 19, rating: 4.5 },
  松濤苑: { reviewCount: 32, rating: 4.2 },
  華固名邸: { reviewCount: 24, rating: 4.4 },
  default: { reviewCount: 12, rating: 4.2 },
});

const DEFAULT_COMMUNITY_WALL_SUMMARY: CommunityWallSummaryMock = deepFreeze({
  reviewCount: 12,
  rating: 4.2,
});

export function getCommunityWallSummaryMock(name: string): CommunityWallSummaryMock {
  return COMMUNITY_WALL_SUMMARY_BY_NAME[name] ?? DEFAULT_COMMUNITY_WALL_SUMMARY;
}

export interface CommunityReviewPreviewSeed {
  initial: string;
  name: string;
  residentLabel: string;
  content: string;
  avatarClass: string;
  propertyId: string;
  liked: boolean;
  totalLikes: number;
}

export const COMMUNITY_REVIEW_PREVIEWS = deepFreeze<CommunityReviewPreviewSeed[]>([
  {
    initial: '林',
    name: '林***',
    residentLabel: '信義區住戶',
    content: '透過平台不僅看到了真實的成交行情，還能直接與經紀人溝通，整體體驗非常順暢。',
    avatarClass: 'bg-gradient-to-br from-brand-500 to-brand-700',
    propertyId: 'MH-100001',
    liked: false,
    totalLikes: 3,
  },
  {
    initial: '王',
    name: '王***',
    residentLabel: '住戶評價',
    content: '社區管理很用心，公設維護良好，住戶素質也不錯，住起來很安心。',
    avatarClass: 'bg-gradient-to-br from-brand-light to-brand-600',
    propertyId: 'MH-100002',
    liked: true,
    totalLikes: 7,
  },
  {
    initial: '住',
    name: '住戶',
    residentLabel: '社區住戶',
    content: '樓下就有便利商店和公車站，生活機能很方便，唯一小缺點是假日停車位比較緊張。',
    avatarClass: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    propertyId: 'MH-100003',
    liked: false,
    totalLikes: 2,
  },
]);
