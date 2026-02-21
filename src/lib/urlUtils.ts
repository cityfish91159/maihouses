import { safeLocalStorage } from './safeStorage';
import { UAG_LAST_AID_STORAGE_KEY } from '../constants/strings';

/**
 * URL 工具函數 - 統一管理物件連結 (UAG v8.4)
 *
 * URL Pattern: /props/:propertyId?aid=:agentId&src=:channel&sid=:shareId&lid=:listingId&q=:searchQuery
 * - propertyId: 物件主鍵
 * - aid: 房仲 ID
 * - src: 流量來源 (首頁卡片、社區牆、LINE 分享、EDM...)
 * - sid: 分享鏈結 ID (追蹤哪條分享帶來的流量)
 * - lid: 列表來源 ID (從哪個列表頁點進來)
 * - q: 搜尋關鍵字 (用戶搜尋了什麼)
 */

// 來源類型定義
export type TrafficSource =
  | 'list_home' // 首頁列表
  | 'list_community' // 社區牆
  | 'list_search' // 搜尋結果
  | 'list_recommend' // AI 推薦
  | 'list_favorite' // 收藏列表
  | 'agent_share' // 業務分享
  | 'line_share' // LINE 分享
  | 'fb_share' // Facebook 分享
  | 'edm' // Email 行銷
  | 'qrcode' // QR Code
  | 'sms' // 簡訊推播
  | 'push' // 推播通知
  | 'direct'; // 直接訪問

export interface PropertyUrlParams {
  propertyId: string;
  agentId?: string | undefined;
  source?: TrafficSource | undefined;
  shareId?: string | undefined;
  listingId?: string | undefined; // 列表來源 ID
  searchQuery?: string | undefined; // 搜尋關鍵字
}

/**
 * 建立物件詳情頁 URL
 */
export function buildPropertyUrl({
  propertyId,
  agentId,
  source,
  shareId,
  listingId,
  searchQuery,
}: PropertyUrlParams): string {
  const params = new URLSearchParams();

  if (agentId && agentId !== 'unknown') {
    params.set('aid', agentId);
  }
  if (source) {
    params.set('src', source);
  }
  if (shareId) {
    params.set('sid', shareId);
  }
  if (listingId) {
    params.set('lid', listingId);
  }
  if (searchQuery) {
    params.set('q', searchQuery);
  }

  const queryString = params.toString();
  return `/props/${propertyId}${queryString ? `?${queryString}` : ''}`;
}

/**
 * 建立分享用 URL（完整 URL 含 domain）
 */
export function buildShareUrl(
  propertyId: string,
  agentId: string,
  channel: 'line' | 'fb' | 'copy' = 'line'
): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://maihouses.com';

  // 產生唯一的分享 ID
  const shareId = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  const source: TrafficSource =
    channel === 'line' ? 'line_share' : channel === 'fb' ? 'fb_share' : 'agent_share';

  const path = buildPropertyUrl({
    propertyId,
    agentId,
    source,
    shareId,
  });

  return `${baseUrl}${path}`;
}

/**
 * 產生 QR Code 用 URL
 */
export function buildQRCodeUrl(propertyId: string, agentId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://maihouses.com';

  const shareId = `qr_${Date.now().toString(36)}`;

  const path = buildPropertyUrl({
    propertyId,
    agentId,
    source: 'qrcode',
    shareId,
  });

  return `${baseUrl}${path}`;
}

/**
 * 從 URL 解析追蹤參數
 *
 * @deprecated 此函數的 agentId fallback 邏輯與 PropertyDetailPage.tsx 不一致。
 * 建議直接使用 PropertyDetailPage 的 agentId 計算邏輯（包含 property.agent.id fallback）。
 * 目前專案內無使用，保留供未來重構參考。
 *
 * 差異：
 * - PropertyDetailPage: URL > localStorage > property.agent.id > 'unknown'
 * - parseTrackingParams: URL > localStorage > 'unknown'（缺少 property.agent.id fallback）
 */
export function parseTrackingParams(): {
  agentId: string;
  source: TrafficSource;
  shareId: string | null;
  listingId: string | null;
  searchQuery: string | null;
} {
  if (typeof window === 'undefined') {
    return {
      agentId: 'unknown',
      source: 'direct',
      shareId: null,
      listingId: null,
      searchQuery: null,
    };
  }

  const params = new URLSearchParams(window.location.search);

  // 優先從 URL 取，其次從 localStorage（修復 #6: 註記不一致性）
  let agentId = params.get('aid');
  if (!agentId || agentId === 'unknown') {
    agentId = safeLocalStorage.getItem(UAG_LAST_AID_STORAGE_KEY) || 'unknown';
  } else {
    // 記住這個 agent
    safeLocalStorage.setItem(UAG_LAST_AID_STORAGE_KEY, agentId);
  }

  // [NASA TypeScript Safety] 使用類型守衛取代 as TrafficSource
  const srcParam = params.get('src');
  const validSources: TrafficSource[] = [
    'list_home',
    'list_community',
    'list_search',
    'list_recommend',
    'list_favorite',
    'agent_share',
    'line_share',
    'fb_share',
    'edm',
    'qrcode',
    'sms',
    'push',
    'direct',
  ];
  const source: TrafficSource =
    srcParam && validSources.includes(srcParam as TrafficSource)
      ? (srcParam as TrafficSource)
      : 'direct';

  const shareId = params.get('sid');
  const listingId = params.get('lid');
  const searchQuery = params.get('q');

  return { agentId, source, shareId, listingId, searchQuery };
}

/**
 * 從列表頁進入詳情頁的 URL 建立（包含來源追蹤）
 */
export function buildListingClickUrl(
  propertyId: string,
  listingType: 'home' | 'community' | 'search' | 'recommend' | 'favorite',
  agentId?: string,
  searchQuery?: string
): string {
  const sourceMap: Record<string, TrafficSource> = {
    home: 'list_home',
    community: 'list_community',
    search: 'list_search',
    recommend: 'list_recommend',
    favorite: 'list_favorite',
  };

  // 產生列表來源 ID（用於追蹤哪個列表帶來流量）
  const listingId = `${listingType}_${Date.now().toString(36)}`;

  return buildPropertyUrl({
    propertyId,
    agentId,
    source: sourceMap[listingType],
    listingId,
    searchQuery,
  });
}

/**
 * 建立 LINE 分享連結（打開 LINE 的 share 介面）
 */
export function buildLineShareLink(
  propertyId: string,
  propertyTitle: string,
  agentId: string
): string {
  const shareUrl = buildShareUrl(propertyId, agentId, 'line');
  const text = encodeURIComponent(`🏠 ${propertyTitle}\n\n👉 查看詳情：${shareUrl}`);
  return `https://line.me/R/share?text=${text}`;
}

/**
 * 建立 Facebook 分享連結
 */
export function buildFacebookShareLink(propertyId: string, agentId: string): string {
  const shareUrl = buildShareUrl(propertyId, agentId, 'fb');
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
}
