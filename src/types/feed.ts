/**
 * Feed Domain Types
 *
 * 信息流領域模型定義
 * 擴展 community.ts 的基礎型別，增加 Feed 專用屬性
 */

import type { Post, Role } from './community';

/** 圖片資訊（支援 WebP 優先） */
export interface FeedImage {
  src: string;
  srcWebp?: string;
  alt: string;
  width?: number;
  height?: number;
}

/** AI 社區洞察 */
export interface AiInsight {
  /** 活躍度分數 (0-100) */
  score: number;
  /** 公開討論比例 (0-100) */
  publicRatio: number;
  /** 社區評分 (0-5) */
  communityRating: number;
}

/** 擴展貼文（Feed 專用） */
export interface FeedPostExtended extends Post {
  /** 所屬社區 ID */
  communityId?: string;
  /** 所屬社區名稱 */
  communityName?: string;
  /** 貼文圖片 */
  images?: FeedImage[];
  /** AI 洞察 */
  aiInsight?: AiInsight;
  /** 原始內容（截斷前） */
  fullContent?: string;
  /** 是否已截斷 */
  isTruncated?: boolean;
}

/** 用戶統計數據 */
export interface ProfileStats {
  /** 互動天數 */
  days: number;
  /** 被感謝次數 */
  liked: number;
  /** 貢獻篇數 */
  contributions: number;
}

/** 用戶資料 */
export interface UserProfile {
  id: string;
  name: string;
  role: Role;
  stats: ProfileStats;
  avatarUrl?: string;
  communityId?: string;
  communityName?: string;
  floor?: string;
}

/** 進行中的交易 */
export interface ActiveTransaction {
  /** 是否有進行中的交易 */
  hasActive: boolean;
  /** 物件名稱 */
  propertyName?: string;
  /** 交易階段 */
  stage?: 'negotiation' | 'contract' | 'loan' | 'closing';
  /** 交易 ID */
  transactionId?: string;
}

/** 側邊欄熱門貼文 */
export interface HotPost {
  id: string | number;
  title: string;
  communityName: string;
  likes: number;
}

/** 側邊欄待售物件 */
export interface SaleItem {
  id: string;
  title: string;
  price: number;
  priceUnit: string;
  communityName: string;
  imageUrl?: string;
}

/** 側邊欄資料 */
export interface SidebarData {
  hotPosts: HotPost[];
  saleItems: SaleItem[];
}

/** 底部導航項目 */
export interface BottomNavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  isActive?: boolean;
}

/** Consumer 頁面狀態 */
export interface ConsumerPageState {
  isLoading: boolean;
  error: Error | null;
  profile: UserProfile | null;
  transaction: ActiveTransaction | null;
  sidebar: SidebarData | null;
}
