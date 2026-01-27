import { useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '../lib/logger';
import { TOAST_DURATION } from '../constants/toast';

/**
 * 安心留痕服務相關操作 Hook
 *
 * 提供安心留痕服務的常用操作:
 * - 開啟說明頁面 (處理 popup blocker)
 * - 要求房仲開啟服務 (顯示成功 Toast)
 *
 * @param propertyId - 物件 public ID
 * @returns 操作函數集合
 *
 * @example
 * ```tsx
 * const trustActions = useTrustActions(property.publicId);
 *
 * <TrustServiceBanner
 *   onLearnMore={trustActions.learnMore}
 *   onRequestEnable={trustActions.requestEnable}
 * />
 * ```
 */
export const useTrustActions = (propertyId: string) => {
  /**
   * 開啟安心留痕說明頁面
   *
   * @remarks
   * 若瀏覽器阻擋彈窗,會顯示 Toast 提示並提供手動開啟選項
   */
  const learnMore = useCallback(() => {
    logger.info('User clicked learn more on trust banner', { propertyId });

    const trustRoomUrl = `${window.location.origin}/maihouses/trust-room`;

    const newWindow = window.open(
      trustRoomUrl,
      '_blank',
      'noopener,noreferrer'
    );

    if (!newWindow) {
      logger.warn('Popup blocked, showing fallback toast', { propertyId });
      toast.warning('無法開啟新分頁', {
        description: '您的瀏覽器阻擋了新分頁',
        action: {
          label: '手動開啟',
          onClick: () => {
            window.location.href = trustRoomUrl;
          }
        },
        duration: TOAST_DURATION.WARNING
      });
    }
  }, [propertyId]);

  /**
   * 要求房仲開啟安心留痕服務
   *
   * @remarks
   * Phase 1: 僅記錄日誌並顯示成功 Toast
   * Phase 2: 將整合 API 呼叫
   */
  const requestEnable = useCallback(() => {
    logger.info('User requested trust enable', { propertyId });
    toast.success('要求已送出', {
      description: '系統將通知房仲開啟安心留痕服務,我們會透過 Email 通知您進度',
      duration: TOAST_DURATION.SUCCESS
    });
  }, [propertyId]);

  return { learnMore, requestEnable };
};
