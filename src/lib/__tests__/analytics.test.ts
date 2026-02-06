/**
 * Google Analytics 工具函數測試
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { trackPageView, trackEvent, trackPropertyView, trackTrustServiceEnter } from '../analytics';

describe('analytics 工具函數', () => {
  beforeEach(() => {
    // Mock window.gtag
    window.gtag = vi.fn();
  });

  afterEach(() => {
    // 清理
    delete window.gtag;
  });

  describe('trackPageView', () => {
    it('應正確追蹤頁面瀏覽事件', () => {
      trackPageView('Home', '/home');

      expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', {
        page_title: 'Home',
        page_path: '/home',
      });
    });

    it('應在 gtag 未定義時不拋出錯誤', () => {
      delete window.gtag;

      expect(() => {
        trackPageView('Home', '/home');
      }).not.toThrow();
    });
  });

  describe('trackEvent', () => {
    it('應正確追蹤自訂事件', () => {
      trackEvent('test_event', {
        custom_param: 'value',
      });

      expect(window.gtag).toHaveBeenCalledWith('event', 'test_event', {
        custom_param: 'value',
      });
    });

    it('應接受無參數的事件', () => {
      trackEvent('simple_event');

      expect(window.gtag).toHaveBeenCalledWith('event', 'simple_event', undefined);
    });

    it('應在 gtag 未定義時不拋出錯誤', () => {
      delete window.gtag;

      expect(() => {
        trackEvent('test_event');
      }).not.toThrow();
    });
  });

  describe('trackPropertyView', () => {
    it('應正確追蹤房源瀏覽事件', () => {
      trackPropertyView('property-123');

      expect(window.gtag).toHaveBeenCalledWith('event', 'property_view', {
        property_id: 'property-123',
      });
    });
  });

  describe('trackTrustServiceEnter', () => {
    it('應正確追蹤信任流程進入事件', () => {
      trackTrustServiceEnter('property-456');

      expect(window.gtag).toHaveBeenCalledWith('event', 'trust_service_enter', {
        event_category: 'trust_flow',
        event_label: 'property-456',
        value: 1,
      });
    });
  });

  describe('window.gtag 類型定義', () => {
    it('應正確定義 window.gtag 類型', () => {
      expect(typeof window.gtag).toBe('function');
    });

    it("應接受 'event' 指令", () => {
      expect(() => {
        window.gtag?.('event', 'property_view', {
          property_id: '123',
        });
      }).not.toThrow();
    });

    it("應接受 'config' 指令", () => {
      expect(() => {
        window.gtag?.('config', 'G-XXXXXXXXXX', {
          page_title: 'Home',
        });
      }).not.toThrow();
    });

    it('應在 gtag 未定義時不拋出錯誤', () => {
      delete window.gtag;

      expect(() => {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'test', {});
        }
      }).not.toThrow();
    });
  });
});
