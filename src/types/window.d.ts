/**
 * Window Interface 擴展
 *
 * 用於定義全域 window 物件的額外屬性（如 Google Analytics gtag）
 */

declare global {
  interface Window {
    /**
     * Google Analytics 4 全域追蹤函數
     *
     * @param command - GA4 指令（'config', 'event', 'set', 'get'）
     * @param targetId - GA4 測量 ID 或事件名稱
     * @param params - 事件參數
     *
     * @example
     * ```typescript
     * window.gtag('event', 'page_view', {
     *   page_title: 'Home',
     *   page_location: window.location.href,
     * });
     * ```
     */
    gtag?: (
      command: 'config' | 'event' | 'set' | 'get',
      targetId: string,
      params?: Record<string, unknown>
    ) => void;

    /**
     * Google Analytics 資料層（DataLayer）
     *
     * 用於手動推送事件到 GA4
     */
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export {};
