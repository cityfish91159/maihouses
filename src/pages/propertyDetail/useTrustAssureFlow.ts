import { useCallback } from 'react';
import { track } from '../../analytics/track';
import { logger } from '../../lib/logger';
import { notify } from '../../lib/notify';
import { getTrustScenario } from '../../components/PropertyDetail/trustAssure';

type TrustAssurePanel = 'line' | 'call' | 'booking'; // 'booking' deprecated (Phase 11-A #2), kept for analytics compatibility

interface UseTrustAssureFlowOptions {
  isLoggedIn: boolean;
  isTrustEnabled: boolean;
  propertyPublicId: string;
  propertyInternalId?: string;
  sessionAccessToken?: string;
  userId?: string;
  resolvedUserName?: string;
  createAutoTrustCase: (payload: {
    propertyId: string;
    userId?: string;
    userName?: string;
  }) => Promise<unknown>;
}

const trackChecked = (scenario: 'A' | 'B' | 'C' | 'D', panel: TrustAssurePanel, propertyId: string) => {
  void track('trust_assure_checked', { scenario, panel });
  logger.info('audit.trust_assure.checked', {
    scenario,
    panel,
    propertyId,
  });
};

const trackCreated = (scenario: 'A' | 'B' | 'C' | 'D', panel: TrustAssurePanel, propertyId: string) => {
  void track('trust_assure_created', {
    scenario,
    property_id: propertyId,
  });
  logger.info('audit.trust_assure.created', {
    scenario,
    panel,
    propertyId,
  });
};

const trackRequested = (
  scenario: 'A' | 'B' | 'C' | 'D',
  panel: TrustAssurePanel,
  propertyId: string,
  mode: 'enable_trust' | 'lead_note'
) => {
  void track('trust_assure_requested', {
    scenario,
    property_id: propertyId,
  });
  logger.info('audit.trust_assure.requested', {
    scenario,
    panel,
    propertyId,
    mode,
  });
};

export function useTrustAssureFlow({
  isLoggedIn,
  isTrustEnabled,
  propertyPublicId,
  propertyInternalId,
  sessionAccessToken,
  userId,
  resolvedUserName,
  createAutoTrustCase,
}: UseTrustAssureFlowOptions) {
  const handleTrustAssureAction = useCallback(
    async (panel: TrustAssurePanel, checked: boolean) => {
      if (!checked) return;

      const scenario = getTrustScenario(isLoggedIn, isTrustEnabled);
      trackChecked(scenario, panel, propertyPublicId);

      try {
        if (scenario === 'A' || scenario === 'C') {
          await createAutoTrustCase({
            propertyId: propertyPublicId,
            ...(userId ? { userId } : {}),
            ...(resolvedUserName ? { userName: resolvedUserName } : {}),
          });
          trackCreated(scenario, panel, propertyPublicId);
          notify.success('已建立安心留痕', '交易紀錄已同步建立。');
          return;
        }

        if (scenario === 'B' && sessionAccessToken && propertyInternalId) {
          const enableRes = await fetch('/api/property/enable-trust', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionAccessToken}`,
            },
            body: JSON.stringify({ propertyId: propertyInternalId }),
          });

          if (enableRes.ok) {
            trackRequested(scenario, panel, propertyPublicId, 'enable_trust');
            notify.success('已送出開啟要求', '經紀人可在後台完成安心留痕開啟。');
            return;
          }
        }

        trackRequested(scenario, panel, propertyPublicId, 'lead_note');
        notify.info('已附帶安心留痕需求', '系統會把你的需求一併通知經紀人。');
      } catch (error) {
        if (error instanceof Error && error.message === 'AUTO_CREATE_THROTTLED') {
          notify.info('請稍候再試', '你剛剛已觸發過安心留痕建立');
          return;
        }

        logger.error('Trust assure action failed', {
          error: error instanceof Error ? error.message : String(error),
          panel,
          propertyId: propertyPublicId,
        });
        notify.warning('安心留痕未完成', '聯絡流程會繼續進行，你可以稍後再試一次。');
      }
    },
    [
      createAutoTrustCase,
      isLoggedIn,
      isTrustEnabled,
      propertyInternalId,
      propertyPublicId,
      resolvedUserName,
      sessionAccessToken,
      userId,
    ]
  );

  return { handleTrustAssureAction };
}

