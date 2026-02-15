import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Hash, ArrowLeft } from 'lucide-react';
import { AgentTrustCard } from '../components/AgentTrustCard';
import { TrustBadge } from '../components/TrustBadge';
import { TrustServiceBanner } from '../components/TrustServiceBanner';
import { MaiMaiBase } from '../components/MaiMai';
import { Logo } from '../components/Logo/Logo';
import { AgentReviewListModal } from '../components/AgentReviewListModal';
import ErrorBoundary from '../app/ErrorBoundary';
import { ContactModal } from '../components/ContactModal';
import { trackTrustServiceEnter } from '../lib/analytics';
import { buildKeyCapsuleTags } from '../utils/keyCapsules';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/notify';
import { secureStorage } from '../lib/secureStorage';
import { ROUTES, RouteUtils } from '../constants/routes';
import { SkeletonBanner } from '../components/SkeletonScreen';
import { useAuth } from '../hooks/useAuth';
import { useTrustActions } from '../hooks/useTrustActions';
import { usePropertyTracker } from '../hooks/usePropertyTracker';
import { useCommunityReviewLike } from '../hooks/useCommunityReviewLike';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { usePageMode } from '../hooks/usePageMode';
import {
  PropertyInfoCard,
  PropertyGallery,
  PropertySpecs,
  PropertyDescription,
  CommunityReviews,
  MobileActionBar,
  VipModal,
  LineLinkPanel,
  CallConfirmPanel,
  PropertyDetailMaiMai,
} from '../components/PropertyDetail';
import {
  getTrustScenario,
  shouldAttachTrustAssureLeadNote,
} from '../components/PropertyDetail/trustAssure';
import { DEFAULT_AGENT_NAME, normalizeAgentName } from '../components/PropertyDetail/agentName';
import { useTrustAssureFlow } from './propertyDetail/useTrustAssureFlow';
import {
  classifyTrustServiceError,
  AUTO_CREATE_CASE_RESPONSE_SCHEMA,
} from './propertyDetail/trustServiceErrors';
import { usePropertyData } from './propertyDetail/usePropertyData';
import { useAgentId } from './propertyDetail/useAgentId';
import { useSocialProof } from './propertyDetail/useSocialProof';
import { useContactPanels } from './propertyDetail/useContactPanels';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

const LOADING_MESSAGES = {
  initial: '正在幫你找房子資訊…',
  retry: '重新載入中…',
  error: '載入失敗',
} as const;

/**
 * 解析返回目標
 * Safari 直接開啟頁面時 history.length 會是 2，所以用 > 2 更安全
 */
export const resolvePropertyDetailBackTarget = (historyLength: number): number | string => {
  return historyLength > 2 ? -1 : '/maihouses/';
};

/**
 * 房源詳情頁面
 */
export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, session } = useAuth();
  const mode = usePageMode();
  const isDemoMode = mode === 'demo';
  const isLoggedIn = isAuthenticated;
  const prefersReducedMotion = usePrefersReducedMotion();

  // #13b: 評價列表 Modal
  const [reviewListOpen, setReviewListOpen] = useState(false);

  // S 級 VIP 攔截 Modal
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipReason, setVipReason] = useState<string>('');

  // 安心留痕要求處理狀態
  const [isRequesting, setIsRequesting] = useState(false);

  // 開發測試：trustEnabled 狀態切換 (僅 Mock 頁面)
  const [mockTrustEnabled, setMockTrustEnabled] = useState<boolean | null>(null);

  // === 抽取的 Hooks ===
  const { property, isLoading, loadError, reloadAttempt, handleRetry } = usePropertyData({
    id, mode, isDemoMode, mockTrustEnabled,
  });
  const { agentId, leadAgentId } = useAgentId(property.agent?.id);

  const isTrustEnabled = property.trustEnabled ?? false;
  const safeAgentName = useMemo(() => normalizeAgentName(property.agent?.name), [property.agent?.name]);

  // 正式版瀏覽基準值：同一物件頁面保持穩定，避免重算導致數字抖動
  const [liveViewerBaseline] = useState(() => Math.floor(Math.random() * 16) + 3);

  const socialProof = useSocialProof({
    publicId: property.publicId, mode, isDemoMode, isTrustEnabled, liveViewerBaseline,
  });

  // S 級客戶即時攔截回調
  const handleGradeUpgrade = useCallback((grade: string, reason?: string) => {
    if (grade === 'S') {
      if (reason) setVipReason(reason);
      setTimeout(() => setShowVipModal(true), 500);
    }
  }, []);

  const extractDistrict = useCallback((address: string): string => {
    const match = address.match(/[市縣](.{2,3}[區鄉鎮市])/);
    return match?.[1] ?? 'unknown';
  }, []);

  const propertyTracker = usePropertyTracker(
    id || '', agentId, extractDistrict(property.address), handleGradeUpgrade
  );

  const {
    showContactModal, contactSource, contactDefaultChannel, contactTrustAssureRequested,
    linePanelOpen, callPanelOpen, linePanelSource, callPanelSource,
    openContactModal, closeContactModal,
    openLinePanel, openCallPanel, closeLinePanel, closeCallPanel,
    isActionLocked,
  } = useContactPanels(propertyTracker.trackLineClick, propertyTracker.trackCallClick);
  const assurePath = RouteUtils.toNavigatePath(ROUTES.ASSURE);

  // 安心留痕服務操作
  const trustActions = useTrustActions(property.publicId);
  const { toggleLike } = useCommunityReviewLike();

  const handleEnterService = useCallback(async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      if (isDemoMode) {
        navigate(assurePath);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch('/api/trust/auto-create-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.publicId,
          userId: user?.id,
          userName: user?.user_metadata?.name,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: '系統錯誤' }));
        throw new Error(errorData.error || 'Failed to create case');
      }

      const json = await res.json();
      const parseResult = AUTO_CREATE_CASE_RESPONSE_SCHEMA.safeParse(json);

      if (!parseResult.success) {
        logger.error('Invalid API response from auto-create-case', {
          error: parseResult.error.message, response: json,
        });
        notify.error('系統錯誤', '請稍後再試');
        return;
      }

      const { data } = parseResult.data;
      secureStorage.setItem('trustToken', data.token);
      secureStorage.setItem('trustCaseId', data.case_id);

      if (typeof window !== 'undefined') {
        trackTrustServiceEnter(property.publicId);
      }

      navigate(assurePath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? String(Object.getOwnPropertyDescriptor(error, 'code')?.value ?? '')
          : '';

      logger.error('handleEnterService error', {
        error: errorMessage, code: errorCode, propertyId: property.publicId,
      });

      const { title, description } = classifyTrustServiceError(error);
      notify.error(title, description);
    } finally {
      setIsRequesting(false);
    }
  }, [assurePath, isDemoMode, isRequesting, navigate, property.publicId]);

  const handleRequestEnable = useCallback(async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await trustActions.requestEnable();
    } catch (error) {
      logger.error('Failed to request trust enable', { error, propertyId: property.publicId });
      notify.error('要求失敗', '請稍後再試');
    } finally {
      setIsRequesting(false);
    }
  }, [trustActions, property.publicId, isRequesting]);

  const capsuleTags = useMemo(() => {
    return buildKeyCapsuleTags({
      advantage1: property.advantage1,
      advantage2: property.advantage2,
      features: property.features,
      floorCurrent: property.floorCurrent,
      floorTotal: property.floorTotal,
      size: property.size,
      rooms: property.rooms,
      halls: property.halls,
    }).slice(0, 4);
  }, [property]);

  // TODO: 實作收藏功能時啟用
  const handleFavoriteToggle = useCallback(() => undefined, []);

  const handleLineShare = useCallback(() => {
    propertyTracker.trackLineClick();
  }, [propertyTracker]);

  const handlePhotoClick = useCallback(() => {
    propertyTracker.trackPhotoClick();
  }, [propertyTracker]);

  const shouldAttachContactTrustAssure = useCallback(
    (trustChecked: boolean): boolean => {
      const scenario = getTrustScenario(isLoggedIn, property.trustEnabled ?? false);
      return shouldAttachTrustAssureLeadNote(scenario, trustChecked);
    },
    [isLoggedIn, property.trustEnabled]
  );

  const resolvedUserName = useMemo(() => {
    const metadataName = user?.user_metadata?.name;
    if (typeof metadataName === 'string' && metadataName.trim()) return metadataName.trim();
    if (typeof user?.email === 'string' && user.email.trim()) return user.email.trim();
    return undefined;
  }, [user?.email, user?.user_metadata]);

  const createAutoTrustCase = useCallback(
    async (payload: { propertyId: string; userId?: string; userName?: string }) => {
      const res = await fetch('/api/trust/auto-create-case-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 429) throw new Error('AUTO_CREATE_THROTTLED');
        throw new Error('AUTO_CREATE_FAILED');
      }

      let json: unknown;
      try {
        json = await res.json();
      } catch {
        throw new Error('AUTO_CREATE_FAILED');
      }

      const parseResult = AUTO_CREATE_CASE_RESPONSE_SCHEMA.safeParse(json);
      if (!parseResult.success) {
        logger.error('Invalid API response from auto-create-case-public', {
          error: parseResult.error.message, response: json,
        });
        throw new Error('AUTO_CREATE_FAILED');
      }

      return parseResult.data;
    },
    []
  );

  const { handleTrustAssureAction } = useTrustAssureFlow({
    isLoggedIn, isTrustEnabled,
    propertyPublicId: property.publicId,
    ...(property.id ? { propertyInternalId: property.id } : {}),
    ...(session?.access_token ? { sessionAccessToken: session.access_token } : {}),
    ...(user?.id ? { userId: user.id } : {}),
    ...(resolvedUserName ? { resolvedUserName } : {}),
    createAutoTrustCase,
  });

  const handleAgentLineClick = useCallback(() => openLinePanel('sidebar'), [openLinePanel]);
  const handleAgentCallClick = useCallback(() => openCallPanel('sidebar'), [openCallPanel]);
  const handleMobileLineClick = useCallback(() => openLinePanel('mobile_bar'), [openLinePanel]);
  const handleMobileCallClick = useCallback(() => openCallPanel('mobile_bar'), [openCallPanel]);
  const handleVipLineClick = useCallback(() => openLinePanel('mobile_bar'), [openLinePanel]);
  const handleVipCallClick = useCallback(() => openCallPanel('mobile_bar'), [openCallPanel]);
  const handleReviewClick = useCallback(() => setReviewListOpen(true), []);

  const handleBackClick = useCallback(() => {
    const backTarget = resolvePropertyDetailBackTarget(window.history.length);
    if (typeof backTarget === 'number') {
      navigate(backTarget);
      return;
    }
    navigate(backTarget);
  }, [navigate]);

  const handleLineFallbackContact = useCallback(
    (trustAssureChecked: boolean) => {
      openContactModal(linePanelSource, 'line', shouldAttachContactTrustAssure(trustAssureChecked));
    },
    [linePanelSource, openContactModal, shouldAttachContactTrustAssure]
  );

  const handleCallFallbackContact = useCallback(
    (trustAssureChecked: boolean) => {
      openContactModal(callPanelSource, 'phone', shouldAttachContactTrustAssure(trustAssureChecked));
    },
    [callPanelSource, openContactModal, shouldAttachContactTrustAssure]
  );

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f8fafc] px-4 text-center">
          <MaiMaiBase mood="thinking" size="md" animated={!prefersReducedMotion} showEffects={!prefersReducedMotion} />
          <p className="text-base text-slate-600">
            {reloadAttempt > 0 ? LOADING_MESSAGES.retry : LOADING_MESSAGES.initial}
          </p>
        </div>
      </ErrorBoundary>
    );
  }

  if (loadError) {
    return (
      <ErrorBoundary>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f8fafc] px-4 text-center">
          <MaiMaiBase mood="shy" size="md" animated={!prefersReducedMotion} showEffects={!prefersReducedMotion} />
          <p className="text-base text-slate-600">{LOADING_MESSAGES.error}</p>
          <p className="max-w-sm text-sm text-slate-500">{loadError}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="min-h-[44px] rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-600 motion-reduce:transition-none"
          >
            再試一次
          </button>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-dvh bg-[#f8fafc] font-sans text-slate-800">
        {/* Header */}
        <nav
          aria-label="物件導覽"
          className="sticky top-0 z-overlay flex h-16 items-center border-b border-brand-100 bg-white/90 px-4 shadow-sm backdrop-blur-md"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={handleBackClick}
              aria-label="返回上一頁"
              className="min-h-[44px] min-w-[44px] rounded-full p-2.5 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:bg-slate-200"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <Logo showSlogan={false} showBadge={true} href="/maihouses/" ariaLabel="回到邁房子首頁" />
          </div>
        </nav>

        {/* 開發測試按鈕 - 僅 Demo Mock 頁面顯示 */}
        {isDemoMode && (
          <div className="mx-auto max-w-4xl px-4 pt-4">
            <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-3">
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-900">
                  <span className="mr-1 inline-block size-3 rounded-full bg-amber-500" aria-hidden="true" />
                  開發測試模式 (僅 Mock 頁面)
                </p>
                <p className="text-[10px] text-amber-700">切換安心留痕狀態查看不同 UI 效果</p>
              </div>
              <button
                onClick={() =>
                  setMockTrustEnabled((prev) => {
                    const newValue = prev === null ? true : !prev;
                    notify.info(`切換為：${newValue ? '已開啟' : '未開啟'}`, undefined, { duration: 1500 });
                    return newValue;
                  })
                }
                aria-label={
                  mockTrustEnabled === null
                    ? '啟動安心留痕測試'
                    : `安心留痕目前${mockTrustEnabled ? '已開啟' : '未開啟'}，點擊切換`
                }
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700 active:scale-95"
              >
                {mockTrustEnabled === null ? '啟動測試' : mockTrustEnabled ? '已開啟' : '未開啟'}
              </button>
            </div>
          </div>
        )}

        {/* 安心留痕服務橫幅 */}
        {!property ? (
          <SkeletonBanner className="my-4" />
        ) : (
          <TrustServiceBanner
            trustEnabled={isTrustEnabled}
            propertyId={property.publicId}
            className="my-4"
            onEnterService={handleEnterService}
            onRequestEnable={handleRequestEnable}
            isRequesting={isRequesting}
          />
        )}

        <main className="mx-auto max-w-4xl p-4 pb-24">
          <div
            role="status"
            aria-label={`物件編號 ${property.publicId}`}
            className="mb-3 inline-flex items-center rounded-lg border border-brand-100 bg-brand-50 px-3 py-1.5 font-mono text-sm text-brand-700"
          >
            <Hash size={14} className="mr-1 text-brand-500" />
            編號：
            <span className="ml-1 font-bold text-brand-700">{property.publicId}</span>
          </div>

          <PropertyGallery
            images={property.images || []}
            title={property.title}
            onPhotoClick={handlePhotoClick}
            fallbackImage={FALLBACK_IMAGE}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <PropertyInfoCard
                property={property}
                isFavorite={false}
                onFavoriteToggle={handleFavoriteToggle}
                onLineShare={handleLineShare}
                capsuleTags={capsuleTags}
                socialProof={socialProof}
                trustEnabled={isTrustEnabled}
              />
              <PropertySpecs property={property} />
              <div className="h-px bg-slate-100" />
              <PropertyDescription description={property.description} />
              <CommunityReviews
                isLoggedIn={isLoggedIn}
                communityId={property.communityId}
                onToggleLike={(propertyId) => toggleLike.mutate(propertyId)}
              />
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <AgentTrustCard
                  agent={property.agent}
                  onLineClick={handleAgentLineClick}
                  onCallClick={handleAgentCallClick}
                  onReviewClick={handleReviewClick}
                />
                {isTrustEnabled && <TrustBadge />}
                <div className="hidden lg:block">
                  <PropertyDetailMaiMai
                    trustEnabled={isTrustEnabled}
                    isHot={socialProof.isHot}
                    trustCasesCount={socialProof.trustCasesCount}
                    agentName={safeAgentName}
                    propertyId={property.publicId}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        <MobileActionBar
          onLineClick={handleMobileLineClick}
          onCallClick={handleMobileCallClick}
          socialProof={socialProof}
          trustEnabled={isTrustEnabled}
          isVerified={isDemoMode ? true : (property.agent?.isVerified ?? false)}
          isActionLocked={isActionLocked}
        />

        <LineLinkPanel
          isOpen={linePanelOpen}
          onClose={closeLinePanel}
          agentLineId={property.agent?.lineId ?? null}
          agentName={safeAgentName || DEFAULT_AGENT_NAME}
          isLoggedIn={isLoggedIn}
          trustEnabled={isTrustEnabled}
          onTrustAction={(checked) => handleTrustAssureAction('line', checked)}
          onFallbackContact={handleLineFallbackContact}
        />

        <CallConfirmPanel
          isOpen={callPanelOpen}
          onClose={closeCallPanel}
          agentPhone={property.agent?.phone ?? null}
          agentName={safeAgentName || DEFAULT_AGENT_NAME}
          isLoggedIn={isLoggedIn}
          trustEnabled={isTrustEnabled}
          onTrustAction={(checked) => handleTrustAssureAction('call', checked)}
          onFallbackContact={handleCallFallbackContact}
        />

        {showContactModal && (
          <ContactModal
            isOpen={showContactModal}
            onClose={closeContactModal}
            propertyId={property.publicId}
            propertyTitle={property.title}
            agentId={leadAgentId}
            agentName={safeAgentName || DEFAULT_AGENT_NAME}
            source={contactSource}
            defaultChannel={contactDefaultChannel}
            trustAssureRequested={contactTrustAssureRequested}
          />
        )}

        <VipModal
          isOpen={showVipModal}
          onClose={() => setShowVipModal(false)}
          onLineClick={handleVipLineClick}
          onCallClick={handleVipCallClick}
          reason={vipReason}
        />

        {reviewListOpen && (
          <AgentReviewListModal
            open={reviewListOpen}
            agentId={property.agent?.id || ''}
            agentName={property.agent?.name || ''}
            onClose={() => setReviewListOpen(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};
