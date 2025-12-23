/**
 * 應用程式路由常數
 * 集中管理所有路由路徑，避免硬編碼
 */
export const ROUTES = {
  /** 首頁 */
  HOME: '/maihouses/',

  /** 房地產列表 */
  PROPERTY_LIST: '/maihouses/property.html',

  /** 個人信息流 (React) - 需要 userId 參數 */
  FEED: (userId: string): string => `/maihouses/feed/${userId}`,

  /** 房仲信息流 (React) - 已棄用，改用 FEED */
  FEED_AGENT: '/maihouses/feed/agent',

  /** 消費者信息流 (React) - 已棄用，改用 FEED */
  FEED_CONSUMER: '/maihouses/feed/consumer',

  /** 房仲信息流 (Legacy HTML) */
  FEED_AGENT_LEGACY: '/maihouses/feed-agent.html',

  /** 消費者信息流 (Legacy HTML) */
  FEED_CONSUMER_LEGACY: '/maihouses/feed-consumer.html',

  /** ASSURE 交易戰情室 */
  ASSURE: '/maihouses/assure',

  /** 社區牆 MVP */
  COMMUNITY_WALL_MVP: '/maihouses/community-wall_mvp.html',

  /** UAG 評分系統 */
  UAG: 'https://maihouses.vercel.app/maihouses/uag',

  /** 信任交易 */
  TRUST: '/trust',

  /** 認證頁面 */
  AUTH: '/maihouses/auth.html',

  /** 社區頁面 - 需要 communityId 參數 */
  COMMUNITY: (communityId: string): string => `/maihouses/community/${communityId}`,

  /** 社區牆頁面 - 需要 communityId 參數 */
  COMMUNITY_WALL: (communityId: string): string => `/maihouses/community/${communityId}/wall`,

  /** 房源詳情頁 - 需要 propertyId 參數 */
  PROPERTY: (propertyId: string): string => `/maihouses/p/${propertyId}`,
} as const;

/** 路由輔助函數 */
export const RouteUtils = {
  /** 檢查當前路徑是否匹配指定路由 */
  isActive: (currentPath: string, route: string): boolean => {
    return currentPath === route || currentPath.startsWith(route);
  },

  /** 取得帶有查詢參數的路由 */
  withQuery: (route: string, params: Record<string, string>): string => {
    const query = new URLSearchParams(params).toString();
    return query ? `${route}?${query}` : route;
  },
} as const;
