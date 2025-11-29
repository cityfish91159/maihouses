/**
 * URL 工具函數 - 統一管理物件連結
 * 
 * URL Pattern: /props/:propertyId?aid=:agentId&src=:channel&sid=:shareId
 * - propertyId: 物件主鍵
 * - aid: 房仲 ID
 * - src: 流量來源 (首頁卡片、社區牆、LINE 分享、EDM...)
 * - sid: 分享鏈結 ID (追蹤哪條分享帶來的流量)
 */

// 來源類型定義
export type TrafficSource = 
  | 'list_home'          // 首頁列表
  | 'list_community'     // 社區牆
  | 'list_search'        // 搜尋結果
  | 'agent_share'        // 業務分享
  | 'line_share'         // LINE 分享
  | 'fb_share'           // Facebook 分享
  | 'edm'                // Email 行銷
  | 'qrcode'             // QR Code
  | 'direct';            // 直接訪問

export interface PropertyUrlParams {
  propertyId: string;
  agentId?: string;
  source?: TrafficSource;
  shareId?: string;
}

/**
 * 建立物件詳情頁 URL
 */
export function buildPropertyUrl({
  propertyId,
  agentId,
  source,
  shareId
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
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://maihouses.com';
  
  // 產生唯一的分享 ID
  const shareId = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  
  const source: TrafficSource = channel === 'line' ? 'line_share' : 
                                 channel === 'fb' ? 'fb_share' : 'agent_share';
  
  const path = buildPropertyUrl({
    propertyId,
    agentId,
    source,
    shareId
  });
  
  return `${baseUrl}${path}`;
}

/**
 * 產生 QR Code 用 URL
 */
export function buildQRCodeUrl(propertyId: string, agentId: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://maihouses.com';
  
  const shareId = `qr_${Date.now().toString(36)}`;
  
  const path = buildPropertyUrl({
    propertyId,
    agentId,
    source: 'qrcode',
    shareId
  });
  
  return `${baseUrl}${path}`;
}

/**
 * 從 URL 解析追蹤參數
 */
export function parseTrackingParams(): {
  agentId: string;
  source: TrafficSource;
  shareId: string | null;
} {
  if (typeof window === 'undefined') {
    return { agentId: 'unknown', source: 'direct', shareId: null };
  }
  
  const params = new URLSearchParams(window.location.search);
  
  // 優先從 URL 取，其次從 localStorage
  let agentId = params.get('aid');
  if (!agentId || agentId === 'unknown') {
    agentId = localStorage.getItem('uag_last_aid') || 'unknown';
  } else {
    // 記住這個 agent
    localStorage.setItem('uag_last_aid', agentId);
  }
  
  const srcParam = params.get('src') as TrafficSource | null;
  const source: TrafficSource = srcParam || 'direct';
  
  const shareId = params.get('sid');
  
  return { agentId, source, shareId };
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
export function buildFacebookShareLink(
  propertyId: string,
  agentId: string
): string {
  const shareUrl = buildShareUrl(propertyId, agentId, 'fb');
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
}
