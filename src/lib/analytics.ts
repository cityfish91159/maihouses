/**
 * Google Analytics 工具函數
 */

/**
 * 追蹤頁面瀏覽事件
 */
export function trackPageView(pageTitle: string, pagePath: string): void {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_title: pageTitle,
      page_path: pagePath,
    });
  }
}

/**
 * 追蹤自訂事件
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

/**
 * 追蹤房源瀏覽事件
 */
export function trackPropertyView(propertyId: string): void {
  trackEvent('property_view', {
    property_id: propertyId,
  });
}

/**
 * 追蹤信任流程進入事件
 */
export function trackTrustServiceEnter(propertyId: string): void {
  trackEvent('trust_service_enter', {
    event_category: 'trust_flow',
    event_label: propertyId,
    value: 1,
  });
}
