import { useState, useRef, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { track } from '../analytics/track';
import { getErrorMessage } from '../lib/error';
import { logger } from '../lib/logger';
import { safeLocalStorage } from '../lib/safeStorage';
import { isDemoMode } from '../lib/pageMode';
import { toast } from 'sonner';
import { TOAST_DURATION } from '../constants/toast';

/**
 * PropertyTracker 返回的追蹤方法介面
 */
export interface PropertyTrackerActions {
  /** 追蹤圖片點擊 */
  trackPhotoClick: () => void;
  /** 追蹤 LINE 點擊（含去重 + S級檢測） */
  trackLineClick: () => Promise<void>;
  /** 追蹤電話點擊（含去重 + S級檢測） */
  trackCallClick: () => Promise<void>;
  /** 追蹤地圖點擊（含去重 + S級檢測） */
  trackMapClick: () => Promise<void>;
}

const UAG_TRACK_ENDPOINT = '/api/uag/track';
const DEFAULT_GRADE_RANK = 1;
const UAG_GRADE_RANK = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  F: 1,
} as const;

const TrackResponseSchema = z.object({
  success: z.boolean(),
  grade: z.string().optional(),
  reason: z.string().optional(),
});

const VALID_GRADES = new Set(Object.keys(UAG_GRADE_RANK));

const getGradeRank = (grade: unknown): number => {
  if (typeof grade !== 'string') return DEFAULT_GRADE_RANK;
  if (!VALID_GRADES.has(grade)) return DEFAULT_GRADE_RANK;
  return UAG_GRADE_RANK[grade as keyof typeof UAG_GRADE_RANK];
};

/**
 * UAG Tracker Hook v8.1 - 追蹤用戶行為 + S級攔截
 *
 * @description
 * 追蹤用戶在房源詳情頁的互動行為，用於 UAG 業務廣告系統評級與優化。
 *
 * @features
 * - ✅ 修正 district 傳遞（避免 "unknown"）
 * - ✅ S 級客戶即時回調通知
 * - ✅ 互動事件使用 fetch 獲取等級回傳
 * - ✅ UAG-6 修復：page_exit 去重邏輯（單一檢查點，鎖在第一時間）
 * - ✅ 支援 beacon API，確保頁面離開時也能送出事件
 *
 * @param propertyId - 房源公開 ID
 * @param agentId - 經紀人 ID（從 URL 參數或 localStorage 取得）
 * @param district - 行政區（從房源地址提取）
 * @param onGradeUpgrade - S 級升級回調函數（可選）
 *
 * @returns 追蹤方法物件
 *
 * @example
 * ```tsx
 * const tracker = usePropertyTracker(
 *   propertyId,
 *   agentId,
 *   district,
 *   (grade, reason) => {
 *     if (grade === 'S') {
 *       showVipModal(reason);
 *     }
 *   }
 * );
 *
 * // 使用追蹤方法
 * <button onClick={tracker.trackLineClick}>加 LINE</button>
 * ```
 */
export const usePropertyTracker = (
  propertyId: string,
  agentId: string,
  district: string,
  onGradeUpgrade?: (newGrade: string, reason?: string) => void
) => {
  const isDemo = isDemoMode();
  // 使用 useState 惰性初始化，避免在 render 中調用 Date.now()
  const [enterTime] = useState(() => Date.now());
  const actions = useRef({
    click_photos: 0,
    click_line: 0,
    click_call: 0,
    click_map: 0,
    scroll_depth: 0,
  });
  const hasSent = useRef(false);
  const sendLock = useRef(false);
  const currentGrade = useRef<string>('F');
  const clickSent = useRef({ line: false, call: false, map: false }); // 防重複點擊

  // 取得或建立 session_id
  const getSessionId = useCallback(() => {
    try {
      let sid = safeLocalStorage.getItem('uag_session');
      if (!sid) {
        sid = `u_${Math.random().toString(36).substring(2, 11)}`;
        safeLocalStorage.setItem('uag_session', sid);
      }
      return sid;
    } catch (error) {
      // Safari 無痕模式或禁用 localStorage
      logger.warn('[UAG] localStorage unavailable, using fallback', {
        error: getErrorMessage(error),
      });
      return `u_${Math.random().toString(36).substring(2, 11)}`;
    }
  }, []);

  // 建構 payload
  const buildPayload = useCallback(
    (eventType: string) => ({
      session_id: getSessionId(),
      // 修復 #3: 過濾 'unknown' agentId，避免首幀污染 UAG 追蹤資料
      agent_id: agentId !== 'unknown' ? agentId : null,
      fingerprint: btoa(
        JSON.stringify({
          screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
        })
      ),
      event: {
        type: eventType,
        property_id: propertyId,
        district: district || 'unknown', // 修正: 使用傳入的 district
        duration: Math.round((Date.now() - enterTime) / 1000),
        actions: { ...actions.current },
        focus: [],
      },
    }),
    [propertyId, agentId, district, getSessionId, enterTime]
  );

  // 發送追蹤事件 (支援 S 級回調)
  const sendEvent = useCallback(
    async (eventType: string, useBeacon = false) => {
      if (isDemo) return;

      const payload = buildPayload(eventType);

      // UAG-6 修復: page_exit 去重邏輯（單一檢查點，鎖在第一時間）
      if (eventType === 'page_exit') {
        if (sendLock.current) {
          logger.debug('[UAG-6] 已阻擋重複的 page_exit');
          // UAG-6 建議4: 監控去重效果
          track('uag.page_exit_dedupe_blocked', { property_id: propertyId });
          return;
        }
        sendLock.current = true; // ✅ 在任何異步操作前鎖住
        hasSent.current = true;
        logger.debug('[UAG-6] 正在發送 page_exit');
        // UAG-6 建議4: 監控發送成功
        track('uag.page_exit_sent', { property_id: propertyId });
      }

      // page_exit 或強制使用 beacon (確保離開頁面也能送出)
      if (useBeacon || eventType === 'page_exit') {
        const blob = new Blob([JSON.stringify(payload)], {
          type: 'application/json',
        });
        navigator.sendBeacon(UAG_TRACK_ENDPOINT, blob);
        return;
      }

      // 互動事件用 fetch，以便獲取等級回傳
      try {
        const res = await fetch(UAG_TRACK_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true, // 防止頁面切換時中斷
        });
        const raw: unknown = await res.json();
        const parsed = TrackResponseSchema.safeParse(raw);

        if (!parsed.success) {
          logger.warn('[UAG] Track response 格式驗證失敗', {
            error: parsed.error.message,
          });
        } else if (parsed.data.success && parsed.data.grade) {
          const newRank = getGradeRank(parsed.data.grade);
          const oldRank = getGradeRank(currentGrade.current);

          if (newRank > oldRank) {
            currentGrade.current = parsed.data.grade;
            // S 級即時通知 (含 reason)
            if (parsed.data.grade === 'S' && onGradeUpgrade) {
              onGradeUpgrade('S', parsed.data.reason);
            }
          }
        }
      } catch (e) {
        // 失敗時 fallback 到 beacon
        logger.error('[UAG] Track event failed, fallback to beacon', {
          error: getErrorMessage(e),
          payload,
          eventType,
        });
        const blob = new Blob([JSON.stringify(payload)], {
          type: 'application/json',
        });
        navigator.sendBeacon(UAG_TRACK_ENDPOINT, blob);
      }
    },
    [buildPayload, isDemo, onGradeUpgrade, propertyId]
  );

  // 追蹤滾動深度
  useEffect(() => {
    const handleScroll = () => {
      const depth = Math.round(
        ((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100
      );
      if (depth > actions.current.scroll_depth) {
        actions.current.scroll_depth = depth;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 穩定 sendEvent 引用以避免 useEffect 依賴問題
  // NOTE: sendEventRef 故意不加入依賴陣列，我們希望在調用時才讀取最新的 sendEvent 值
  const sendEventRef = useRef(sendEvent);

  useEffect(() => {
    sendEventRef.current = sendEvent;
  }, [sendEvent]);

  // 初始化：發送 page_view，離開時發送 page_exit
  useEffect(() => {
    if (!propertyId || isDemo) return;

    // 發送 page_view (用 beacon，不需等回應)
    sendEventRef.current('page_view', true);

    // 離開頁面時發送 page_exit
    // UAG-6 修復: 移除外層檢查，讓 sendEvent 統一處理鎖機制
    const handleUnload = () => {
      sendEventRef.current('page_exit', true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleUnload();
        // UAG-6 建議2: 發送後移除監聽器，避免重複觸發
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleUnload, { once: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleUnload);
      // UAG-6 修復: 只在未發送過 page_exit 時才發送（避免重複）
      if (!hasSent.current) {
        handleUnload();
      }
    };
  }, [isDemo, propertyId]);

  // 暴露追蹤方法
  return {
    trackPhotoClick: () => {
      if (isDemo) return;
      actions.current.click_photos++;
    },
    trackLineClick: async () => {
      if (isDemo) return;
      if (clickSent.current.line) return; // 防重複點擊
      clickSent.current.line = true;

      try {
        actions.current.click_line = 1;
        await Promise.all([
          track('uag.line_clicked', { property_id: propertyId }),
          sendEvent('click_line'),
        ]);
      } catch (error) {
        logger.error('[UAG] Track LINE click failed:', { error: getErrorMessage(error) });
        toast.warning('追蹤失敗', {
          description: '您的操作已記錄,但追蹤系統暫時異常',
          duration: TOAST_DURATION.WARNING,
        });
        // 仍執行 sendEvent 確保核心追蹤不中斷
        sendEvent('click_line').catch(() => {});
      }
    },
    trackCallClick: async () => {
      if (isDemo) return;
      if (clickSent.current.call) return; // 防重複點擊
      clickSent.current.call = true;

      try {
        actions.current.click_call = 1;
        await Promise.all([
          track('uag.call_clicked', { property_id: propertyId }),
          sendEvent('click_call'),
        ]);
      } catch (error) {
        logger.error('[UAG] Track call click failed:', { error: getErrorMessage(error) });
        toast.warning('追蹤失敗', {
          description: '您的操作已記錄,但追蹤系統暫時異常',
          duration: TOAST_DURATION.WARNING,
        });
        sendEvent('click_call').catch(() => {});
      }
    },
    trackMapClick: async () => {
      if (isDemo) return;
      if (clickSent.current.map) return; // 防重複點擊
      clickSent.current.map = true;

      try {
        actions.current.click_map = 1;
        await Promise.all([
          track('uag.map_clicked', { property_id: propertyId, district }),
          sendEvent('click_map'),
        ]);
      } catch (error) {
        logger.error('[UAG] Track map click failed:', { error: getErrorMessage(error) });
        toast.warning('追蹤失敗', {
          description: '您的操作已記錄,但追蹤系統暫時異常',
          duration: TOAST_DURATION.WARNING,
        });
        sendEvent('click_map').catch(() => {});
      }
    },
  };
};

