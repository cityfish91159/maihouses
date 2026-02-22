/** 物件資料載入 Hook：fetch + loading + error + retry */
import { useState, useEffect, useCallback } from 'react';
import {
  propertyService,
  DEFAULT_PROPERTY,
  type PropertyData,
} from '../../services/propertyService';
import type { PageMode } from '../../hooks/usePageMode';
import { logger } from '../../lib/logger';
import { notify } from '../../lib/notify';
import { TOAST_DURATION } from '../../constants/toast';

function classifyLoadError(msg: string): string {
  if (msg.includes('NetworkError') || msg.includes('Failed to fetch'))
    return '網路連線異常，請檢查網路後重試';
  if (msg.includes('404') || msg.includes('not found')) return '此物件不存在或已下架';
  if (msg.includes('500')) return '伺服器異常，請稍後再試';
  return '無法取得物件詳情，請重新整理頁面';
}

interface UsePropertyDataOptions {
  id: string | undefined;
  mode: PageMode;
  isDemoMode: boolean;
  mockTrustEnabled: boolean | null;
}

export function usePropertyData({
  id,
  mode,
  isDemoMode,
  mockTrustEnabled,
}: UsePropertyDataOptions) {
  const [property, setProperty] = useState<PropertyData>(() => ({
    ...DEFAULT_PROPERTY,
    publicId: id ?? DEFAULT_PROPERTY.publicId,
  }));
  const [isLoading, setIsLoading] = useState(() => Boolean(id));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadAttempt, setReloadAttempt] = useState(0);
  const handleRetry = useCallback(() => {
    setLoadError(null);
    setReloadAttempt((p) => p + 1);
  }, []);

  useEffect(() => {
    if (isDemoMode && mockTrustEnabled !== null) {
      setProperty((prev) => ({ ...prev, trustEnabled: mockTrustEnabled }));
    }
  }, [mockTrustEnabled, isDemoMode]);

  useEffect(() => {
    let cancelled = false;
    const fetchProperty = async () => {
      if (!id) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      if (!cancelled) {
        setIsLoading(true);
        setLoadError(null);
      }
      try {
        const data = await propertyService.getPropertyByPublicId(id, { mode });
        if (cancelled) return;
        if (data) {
          setProperty(
            isDemoMode && mockTrustEnabled !== null
              ? { ...data, trustEnabled: mockTrustEnabled }
              : data
          );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const description = classifyLoadError(errorMessage);
        logger.error('Failed to load property details', {
          error,
          propertyId: id,
          errorMessage,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        });
        notify.error('載入失敗', description, {
          action: { label: '重新載入', onClick: () => window.location.reload() },
          duration: TOAST_DURATION.ERROR,
        });
        if (!cancelled) setLoadError(description);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void fetchProperty();
    return () => {
      cancelled = true;
    };
  }, [id, isDemoMode, mockTrustEnabled, mode, reloadAttempt]);

  return { property, setProperty, isLoading, loadError, reloadAttempt, handleRetry };
}
