/**
 * UAG Realtime 訂閱管理 Hook
 *
 * 職責：
 * - 管理 Supabase Realtime 訂閱
 * - 處理 S 級客戶升級即時通知
 * - 自動訂閱/取消訂閱生命週期
 *
 * @module useRealtimeUpdates
 */

import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { logger } from '../../../lib/logger';
import { notify } from '../../../lib/notify';

// ============================================================================
// Types
// ============================================================================

/** Hook 參數 */
export interface UseRealtimeUpdatesParams {
  /** 是否使用 Mock 模式（Mock 模式不訂閱） */
  useMock: boolean;
  /** 用戶 ID（用於訂閱篩選） */
  userId: string | undefined;
  /** 數據刷新函數 */
  refetch: () => Promise<unknown>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * UAG Realtime 訂閱管理 Hook
 *
 * 訂閱 `uag_s_grade_upgrades` 表的 INSERT 事件，
 * 當客戶升級到 S 級時即時推播通知房仲。
 *
 * @example
 * ```tsx
 * const { data, useMock, userId, refetch } = useUAGData();
 *
 * // 訂閱 S 級升級通知
 * useRealtimeUpdates({
 *   useMock,
 *   userId,
 *   refetch,
 * });
 * ```
 */
export function useRealtimeUpdates({ useMock, userId, refetch }: UseRealtimeUpdatesParams): void {
  useEffect(() => {
    // 只在 Live 模式且已登入時訂閱
    if (useMock || !userId) {
      return;
    }

    const channelName = `uag-s-upgrades-${userId}`;

    logger.info('useRealtimeUpdates.subscribing', {
      channelName,
      userId,
    });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'uag_s_grade_upgrades',
          filter: `agent_id=eq.${userId}`,
        },
        (payload) => {
          // [NASA TypeScript Safety] 使用類型守衛取代 as Record
          const newRecord = payload.new;
          const sessionId =
            newRecord && typeof newRecord === 'object' && 'session_id' in newRecord
              ? String(newRecord.session_id)
              : undefined;
          const previousGrade =
            newRecord && typeof newRecord === 'object' && 'previous_grade' in newRecord
              ? String(newRecord.previous_grade)
              : undefined;

          logger.info('useRealtimeUpdates.sGradeUpgrade', {
            sessionId,
            previousGrade,
          });

          // 顯示 UI 通知
          notify.success('🎉 新的 S 級客戶！請查看 UAG Radar 檢視詳細資訊');

          // 刷新數據以顯示新的 S 級客戶
          void refetch();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('useRealtimeUpdates.subscribed', {
            channelName,
          });
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('useRealtimeUpdates.error', {
            channelName,
            status,
          });
        }
      });

    // 清理：取消訂閱
    return () => {
      logger.info('useRealtimeUpdates.unsubscribing', {
        channelName,
      });
      void supabase.removeChannel(channel);
    };
  }, [useMock, userId, refetch]);
}
