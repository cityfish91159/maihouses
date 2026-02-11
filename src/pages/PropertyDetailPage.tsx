import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Hash, ArrowLeft } from 'lucide-react';
import { AgentTrustCard } from '../components/AgentTrustCard';
import { TrustBadge } from '../components/TrustBadge';
import { TrustServiceBanner } from '../components/TrustServiceBanner';
import { MaiMaiBase } from '../components/MaiMai';
import { Logo } from '../components/Logo/Logo';
import { AgentReviewListModal } from '../components/AgentReviewListModal';
import ErrorBoundary from '../app/ErrorBoundary';
import { propertyService, DEFAULT_PROPERTY, PropertyData } from '../services/propertyService';
import { ContactModal, type ContactChannel } from '../components/ContactModal';
import { trackTrustServiceEnter } from '../lib/analytics';
import { track } from '../analytics/track';
import { buildKeyCapsuleTags } from '../utils/keyCapsules';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/notify';
import { secureStorage } from '../lib/secureStorage';
import { SkeletonBanner } from '../components/SkeletonScreen';
import { useAuth } from '../hooks/useAuth';
import { useTrustActions } from '../hooks/useTrustActions';
import { usePropertyTracker } from '../hooks/usePropertyTracker';
import { useCommunityReviewLike } from '../hooks/useCommunityReviewLike';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { TOAST_DURATION } from '../constants/toast';
import { isDemoPropertyId } from '../constants/property';

// 優化方案 1: 拆分組件並使用 React.memo
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
 * 或結合 document.referrer 判斷是否有來源頁
 */
export const resolvePropertyDetailBackTarget = (historyLength: number): number | string => {
  // 使用 > 2 避免 Safari 的 history.length === 2 誤判
  return historyLength > 2 ? -1 : '/maihouses/';
};

/**
 * 房源詳情頁面
 *
 * 顯示房源的完整資訊,包含:
 * - 圖片輪播
 * - 基本資訊 (價格、地址、坪數、格局)
 * - 安心留痕服務橫幅
 * - 社區評價
 * - 經紀人資訊
 * - 聯絡 CTA
 *
 * @remarks
 * 使用 UAG 追蹤系統記錄用戶行為。
 * 使用 Error Boundary 保護安心留痕橫幅。
 */
export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const { isAuthenticated, user, session } = useAuth();

  const isLoggedIn = isAuthenticated;

  // ContactModal 狀態
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSource, setContactSource] = useState<'sidebar' | 'mobile_bar'>('sidebar');
  const [contactDefaultChannel, setContactDefaultChannel] = useState<ContactChannel>('line');
  const [contactTrustAssureRequested, setContactTrustAssureRequested] = useState(false);

  // Phase 11-A + #2: 雙按鈕分流面板狀態（移除 booking）
  const [linePanelOpen, setLinePanelOpen] = useState(false);
  const [callPanelOpen, setCallPanelOpen] = useState(false);
  const [linePanelSource, setLinePanelSource] = useState<'sidebar' | 'mobile_bar'>('sidebar');
  const [callPanelSource, setCallPanelSource] = useState<'sidebar' | 'mobile_bar'>('sidebar');

  // #13b: 評價列表 Modal
  const [reviewListOpen, setReviewListOpen] = useState(false);

  // S 級 VIP 攔截 Modal
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipReason, setVipReason] = useState<string>('');

  // 安心留痕要求處理狀態
  const [isRequesting, setIsRequesting] = useState(false);

  // 開發測試：trustEnabled 狀態切換 (僅 Mock 頁面)
  const [mockTrustEnabled, setMockTrustEnabled] = useState<boolean | null>(null);

  // 初始化直接使用 DEFAULT_PROPERTY，確保第一幀就有畫面，絕不留白
  const [property, setProperty] = useState<PropertyData>(() => ({
    ...DEFAULT_PROPERTY,
    publicId: id ?? DEFAULT_PROPERTY.publicId,
    isDemo: isDemoPropertyId(id),
  }));
  const [isPropertyLoading, setIsPropertyLoading] = useState(() => Boolean(id));
  const [propertyLoadError, setPropertyLoadError] = useState<string | null>(null);
  const [reloadAttempt, setReloadAttempt] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  // ✅ agentId 正規化：trim + 格式驗證（UUID / agent-* / mock-agent-*）
  const normalizeAgentId = useCallback((aid: string | null | undefined): string | null => {
    if (!aid) return null;
    const trimmed = aid.trim();
    if (trimmed === '' || trimmed === 'unknown') return null;
    // UUID 格式: 8-4-4-4-12，或語意化 agent id（agent-* / mock-agent-*）
    const isValid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed) ||
      /^agent-[a-z0-9_-]+$/i.test(trimmed) ||
      /^mock-agent-[a-z0-9_-]+$/i.test(trimmed);
    return isValid ? trimmed : null;
  }, []);

  // ✅ 計算 agent_id 優先級：URL ?aid > localStorage > property.agent.id > 'unknown'
  const agentId = useMemo(() => {
    let aid = normalizeAgentId(searchParams.get('aid'));
    if (!aid) aid = normalizeAgentId(localStorage.getItem('uag_last_aid'));
    if (!aid) aid = normalizeAgentId(property.agent?.id);
    return aid || 'unknown';
  }, [searchParams, property.agent?.id, normalizeAgentId]);

  // #1 防呆：若正規化後仍為 unknown，但 property.agent.id 有原始值，Lead 仍優先使用原始值
  const leadAgentId = useMemo(() => {
    if (agentId !== 'unknown') return agentId;
    const rawPropertyAgentId = property.agent?.id?.trim();
    if (rawPropertyAgentId && rawPropertyAgentId.toLowerCase() !== 'unknown') {
      return rawPropertyAgentId;
    }
    return 'unknown';
  }, [agentId, property.agent?.id]);

  // ✅ 副作用：將有效 agentId 寫入 localStorage（React 18+ StrictMode 安全）
  useEffect(() => {
    if (agentId && agentId !== 'unknown') {
      localStorage.setItem('uag_last_aid', agentId);
    }
  }, [agentId]);

  // S 級客戶即時攔截回調
  const handleGradeUpgrade = useCallback((grade: string, reason?: string) => {
    if (grade === 'S') {
      if (reason) setVipReason(reason);
      // 延遲 500ms 顯示，避免太突兀
      setTimeout(() => setShowVipModal(true), 500);
    }
  }, []);

  // ✅ 使用 useCallback 快取 Regex 函數，避免每次渲染都創建新引用
  const extractDistrict = useCallback((address: string): string => {
    const match = address.match(/[市縣](.{2,3}[區鄉鎮市])/);
    return match?.[1] ?? 'unknown';
  }, []);

  // 初始化追蹤器 (傳入 district + S級回調)
  const propertyTracker = usePropertyTracker(
    id || '',
    agentId,
    extractDistrict(property.address),
    handleGradeUpgrade
  );

  const openContactModal = useCallback(
    (
      source: 'sidebar' | 'mobile_bar',
      defaultChannel: ContactChannel = 'line',
      trustAssureRequested = false
    ) => {
      setContactSource(source);
      setContactDefaultChannel(defaultChannel);
      setContactTrustAssureRequested(trustAssureRequested);
      setShowContactModal(true);
    },
    []
  );

  const closeContactModal = useCallback(() => {
    setShowContactModal(false);
    setContactTrustAssureRequested(false);
  }, []);

  const openLinePanel = useCallback(
    (source: 'sidebar' | 'mobile_bar') => {
      setLinePanelSource(source);
      setLinePanelOpen(true);
      propertyTracker.trackLineClick();
    },
    [propertyTracker]
  );

  const openCallPanel = useCallback(
    (source: 'sidebar' | 'mobile_bar') => {
      setCallPanelSource(source);
      setCallPanelOpen(true);
      propertyTracker.trackCallClick();
    },
    [propertyTracker]
  );

  const closeLinePanel = useCallback(() => setLinePanelOpen(false), []);
  const closeCallPanel = useCallback(() => setCallPanelOpen(false), []);

  const isTrustEnabled = property.trustEnabled ?? false;
  const safeAgentName = useMemo(() => normalizeAgentName(property.agent?.name), [property.agent?.name]);

  // #8 社會證明真實數據 — 正式版從 API 取得，Mock 保持假數據
  const { data: publicStats } = useQuery({
    queryKey: ['property-public-stats', property.publicId],
    queryFn: async () => {
      const res = await fetch(`/api/property/public-stats?id=${property.publicId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<{
        success: boolean;
        data: { view_count: number; trust_cases_count: number };
      }>;
    },
    enabled: !property.isDemo && Boolean(property.publicId),
    staleTime: 60_000, // 1 分鐘快取
  });

  // 正式版瀏覽基準值：同一物件頁面保持穩定，避免重算導致數字抖動
  const liveViewerBaseline = useMemo(
    () => Math.floor(Math.random() * 16) + 3, // 3-18
    []
  );

  const socialProof = useMemo(() => {
    // Mock 版：基於 property.publicId 產生穩定的隨機數（完全不改）
    if (property.isDemo) {
      const seed = property.publicId?.charCodeAt(3) || 0;
      return {
        currentViewers: Math.floor(seed % 5) + 2, // 2-6 人正在瀏覽
        trustCasesCount: Math.floor(seed % 8) + 5, // 5-12 組客戶已賞屋（保持 Mock 假數據）
        isHot: seed % 3 === 0, // 1/3 機率顯示為熱門
      };
    }

    // 正式版：真實數據
    const realViewCount = publicStats?.data?.view_count ?? 0;
    const trustCasesCount = publicStats?.data?.trust_cases_count ?? 0;

    return {
      currentViewers: Math.max(liveViewerBaseline, realViewCount), // 顯示較大值
      trustCasesCount, // 真實案件數
      isHot: isTrustEnabled && trustCasesCount >= 3, // 需啟用安心留痕且 3 組以上才算熱門
    };
  }, [isTrustEnabled, liveViewerBaseline, property.isDemo, property.publicId, publicStats]);

  // 安心留痕服務操作
  const trustActions = useTrustActions(property.publicId);

  // #14b: 獲得鼓勵系統
  const { toggleLike } = useCommunityReviewLike();

  const handleEnterService = useCallback(async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      // Demo 物件直接導向 mock 模式
      if (property.isDemo) {
        window.location.href = '/maihouses/assure?mock=true';
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
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
          error: parseResult.error.message,
          response: json,
        });
        notify.error('系統錯誤', '請稍後再試');
        return;
      }

      const { data } = parseResult.data;

      // [Team Alpha - S-01] 儲存加密 Token 到 localStorage (AES-256)
      secureStorage.setItem('trustToken', data.token);
      secureStorage.setItem('trustCaseId', data.case_id);

      // [Team 14 修復] 追蹤 GA 事件
      if (typeof window !== 'undefined') {
        trackTrustServiceEnter(property.publicId);
      }

      // [Team 5 修復] Security: 不透過 URL 傳遞 Token
      // Token 已安全存儲在 secureStorage，Assure 頁面會自動從 localStorage 讀取
      // 避免 Token 洩漏到瀏覽器歷史、Server logs 或 Referrer header
      window.location.href = '/maihouses/assure';
    } catch (error) {
      // [Team 8 第五位修復] 使用提取的錯誤分類函數
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';

      logger.error('handleEnterService error', {
        error: errorMessage,
        code: errorCode,
        propertyId: property.publicId,
      });

      const { title, description } = classifyTrustServiceError(error);
      notify.error(title, description);
    } finally {
      setIsRequesting(false);
    }
  }, [property.publicId, property.isDemo, isRequesting]);

  // ✅ 現在 trustActions 已經穩定，不會造成不必要的重新渲染
  const handleRequestEnable = useCallback(async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await trustActions.requestEnable();
    } catch (error) {
      logger.error('Failed to request trust enable', {
        error,
        propertyId: property.publicId,
      });
      notify.error('要求失敗', '請稍後再試');
    } finally {
      setIsRequesting(false);
    }
  }, [trustActions, property.publicId, isRequesting]);

  // 優化方案 1: 使用 useMemo 快取計算結果
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
  }, [
    property.advantage1,
    property.advantage2,
    property.features,
    property.floorCurrent,
    property.floorTotal,
    property.size,
    property.rooms,
    property.halls,
  ]);

  // 穩定的事件處理函數
  const handleFavoriteToggle = useCallback(() => {
    setIsFavorite((prev) => !prev);
  }, []);

  const handleLineShare = useCallback(() => {
    propertyTracker.trackLineClick();
  }, [propertyTracker]);

  const handleMapClick = useCallback(() => {
    propertyTracker.trackMapClick();
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
    if (typeof metadataName === 'string' && metadataName.trim()) {
      return metadataName.trim();
    }
    if (typeof user?.email === 'string' && user.email.trim()) {
      return user.email.trim();
    }
    return undefined;
  }, [user?.email, user?.user_metadata]);

  const createAutoTrustCase = useCallback(
    async (payload: { propertyId: string; userId?: string; userName?: string }) => {
      const res = await fetch('/api/trust/auto-create-case-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('AUTO_CREATE_THROTTLED');
        }
        throw new Error('AUTO_CREATE_FAILED');
      }

      return res.json().catch(() => null);
    },
    []
  );

  const { handleTrustAssureAction } = useTrustAssureFlow({
    isLoggedIn,
    isTrustEnabled,
    propertyPublicId: property.publicId,
    ...(property.id ? { propertyInternalId: property.id } : {}),
    ...(session?.access_token ? { sessionAccessToken: session.access_token } : {}),
    ...(user?.id ? { userId: user.id } : {}),
    ...(resolvedUserName ? { resolvedUserName } : {}),
    createAutoTrustCase,
  });

  // AgentTrustCard callbacks (#2 移除 booking)
  const handleAgentLineClick = useCallback(() => {
    openLinePanel('sidebar');
  }, [openLinePanel]);

  const handleAgentCallClick = useCallback(() => {
    openCallPanel('sidebar');
  }, [openCallPanel]);

  // Mobile / VIP callbacks (#2 移除 booking)
  const handleMobileLineClick = useCallback(() => {
    openLinePanel('mobile_bar');
  }, [openLinePanel]);

  const handleMobileCallClick = useCallback(() => {
    openCallPanel('mobile_bar');
  }, [openCallPanel]);

  const handleVipLineClick = useCallback(() => {
    openLinePanel('mobile_bar');
  }, [openLinePanel]);

  const handleVipCallClick = useCallback(() => {
    openCallPanel('mobile_bar');
  }, [openCallPanel]);

  const handleReviewClick = useCallback(() => {
    setReviewListOpen(true);
  }, []);

  const handleBackClick = useCallback(() => {
    const backTarget = resolvePropertyDetailBackTarget(window.history.length);
    if (typeof backTarget === 'number') {
      navigate(backTarget);
      return;
    }
    navigate(backTarget);
  }, [navigate]);

  const handleRetryPropertyLoad = useCallback(() => {
    setPropertyLoadError(null);
    setReloadAttempt((prev) => prev + 1);
  }, []);

  const handleLineFallbackContact = useCallback(
    (trustAssureChecked: boolean) => {
      openContactModal(linePanelSource, 'line', shouldAttachContactTrustAssure(trustAssureChecked));
    },
    [linePanelSource, openContactModal, shouldAttachContactTrustAssure]
  );

  const handleCallFallbackContact = useCallback(
    (trustAssureChecked: boolean) => {
      openContactModal(
        callPanelSource,
        'phone',
        shouldAttachContactTrustAssure(trustAssureChecked)
      );
    },
    [callPanelSource, openContactModal, shouldAttachContactTrustAssure]
  );

  // 當 mockTrustEnabled 改變時，更新 property
  useEffect(() => {
    if (property.isDemo && mockTrustEnabled !== null) {
      setProperty((prev) => ({ ...prev, trustEnabled: mockTrustEnabled }));
    }
  }, [mockTrustEnabled, property.isDemo]);

  useEffect(() => {
    let cancelled = false;

    const fetchProperty = async () => {
      if (!id) {
        if (!cancelled) setIsPropertyLoading(false);
        return;
      }

      if (!cancelled) {
        setIsPropertyLoading(true);
        setPropertyLoadError(null);
      }

      try {
        const data = await propertyService.getPropertyByPublicId(id);
        if (cancelled) return;

        if (data) {
          // 如果是 Mock 頁面且有開發測試狀態，覆寫 trustEnabled
          if (data.isDemo && mockTrustEnabled !== null) {
            setProperty({ ...data, trustEnabled: mockTrustEnabled });
          } else {
            setProperty(data);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        let description = '無法取得物件詳情，請重新整理頁面';

        // 錯誤分類
        if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
          description = '網路連線異常，請檢查網路後重試';
        } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          description = '此物件不存在或已下架';
        } else if (errorMessage.includes('500')) {
          description = '伺服器異常，請稍後再試';
        }

        logger.error('Failed to load property details', {
          error,
          propertyId: id,
          errorMessage,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        });

        toast.error('載入失敗', {
          description,
          action: {
            label: '重新載入',
            onClick: () => window.location.reload(),
          },
          duration: TOAST_DURATION.ERROR,
        });

        if (!cancelled) {
          setPropertyLoadError(description);
        }
      } finally {
        if (!cancelled) {
          setIsPropertyLoading(false);
        }
      }
    };
    void fetchProperty();

    return () => {
      cancelled = true;
    };
  }, [id, mockTrustEnabled, reloadAttempt]);

  const isActionLocked = linePanelOpen || callPanelOpen || showContactModal;

  if (isPropertyLoading) {
    return (
      <ErrorBoundary>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f8fafc] px-4 text-center">
          <MaiMaiBase
            mood="thinking"
            size="md"
            animated={!prefersReducedMotion}
            showEffects={!prefersReducedMotion}
          />
          <p className="text-base text-slate-600">
            {reloadAttempt > 0 ? LOADING_MESSAGES.retry : LOADING_MESSAGES.initial}
          </p>
        </div>
      </ErrorBoundary>
    );
  }

  if (propertyLoadError) {
    return (
      <ErrorBoundary>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#f8fafc] px-4 text-center">
          <MaiMaiBase
            mood="shy"
            size="md"
            animated={!prefersReducedMotion}
            showEffects={!prefersReducedMotion}
          />
          <p className="text-base text-slate-600">{LOADING_MESSAGES.error}</p>
          <p className="max-w-sm text-sm text-slate-500">{propertyLoadError}</p>
          <button
            type="button"
            onClick={handleRetryPropertyLoad}
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
            <Logo
              showSlogan={false}
              showBadge={true}
              href="/maihouses/"
              ariaLabel="回到邁房子首頁"
            />
          </div>
        </nav>

        {/* 開發測試按鈕 - 僅 Demo Mock 頁面顯示 */}
        {property.isDemo && (
          <div className="mx-auto max-w-4xl px-4 pt-4">
            <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-3">
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-900">
                  <span
                    className="mr-1 inline-block size-3 rounded-full bg-amber-500"
                    aria-hidden="true"
                  />
                  開發測試模式 (僅 Mock 頁面)
                </p>
                <p className="text-[10px] text-amber-700">切換安心留痕狀態查看不同 UI 效果</p>
              </div>
              <button
                onClick={() =>
                  setMockTrustEnabled((prev) => {
                    const newValue = prev === null ? true : !prev;
                    toast.info(`切換為：${newValue ? '已開啟' : '未開啟'}`, {
                      duration: 1500,
                    });
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

          {/* 優化方案 1: 使用拆分的 PropertyGallery 組件 */}
          <PropertyGallery
            images={property.images || []}
            title={property.title}
            onPhotoClick={handlePhotoClick}
            fallbackImage={FALLBACK_IMAGE}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-6 lg:col-span-2">
              {/* 優化方案 1: 使用拆分的 PropertyInfoCard 組件 */}
              <PropertyInfoCard
                property={property}
                isFavorite={isFavorite}
                onFavoriteToggle={handleFavoriteToggle}
                onLineShare={handleLineShare}
                onMapClick={handleMapClick}
                capsuleTags={capsuleTags}
                socialProof={socialProof}
                trustEnabled={isTrustEnabled}
              />

              {/* 優化方案 1: 使用拆分的 PropertySpecs 組件 */}
              <PropertySpecs property={property} />

              <div className="h-px bg-slate-100" />

              {/* 優化方案 1: 使用拆分的 PropertyDescription 組件 */}
              <PropertyDescription description={property.description} />

              {/* 優化方案 3: 使用 Intersection Observer 延遲渲染評論區 */}
              <CommunityReviews
                isLoggedIn={isLoggedIn}
                communityId={property.communityId}
                {...(property.isDemo !== undefined && { isDemo: property.isDemo })}
                onToggleLike={(propertyId) => toggleLike.mutate(propertyId)}
              />
            </div>

            {/* Sidebar / Agent Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <AgentTrustCard
                  agent={property.agent}
                  {...(property.isDemo !== undefined ? { isDemo: property.isDemo } : {})}
                  onLineClick={handleAgentLineClick}
                  onCallClick={handleAgentCallClick}
                  onReviewClick={handleReviewClick}
                />

                {/* FE-2: 安心留痕徽章（僅當房仲開啟服務時顯示） */}
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

        {/* 優化方案 1: 使用拆分的 MobileActionBar 組件（#2 雙按鈕） */}
        <MobileActionBar
          onLineClick={handleMobileLineClick}
          onCallClick={handleMobileCallClick}
          socialProof={socialProof}
          trustEnabled={isTrustEnabled}
          isVerified={property.isDemo ? true : (property.agent?.isVerified ?? false)}
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

        {/* 統一聯絡入口 Modal */}
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

        {/* 優化方案 1: 使用拆分的 VipModal 組件（#2 雙按鈕） */}
        <VipModal
          isOpen={showVipModal}
          onClose={() => setShowVipModal(false)}
          onLineClick={handleVipLineClick}
          onCallClick={handleVipCallClick}
          reason={vipReason}
        />

        {/* #13b: 評價列表 Modal */}
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
