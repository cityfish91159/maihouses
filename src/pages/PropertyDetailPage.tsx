import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Home, Hash, ArrowLeft, Phone, FileText } from 'lucide-react';
import { AgentTrustCard } from '../components/AgentTrustCard';
import { TrustBadge } from '../components/TrustBadge';
import { TrustServiceBanner } from '../components/TrustServiceBanner';
import ErrorBoundary from '../app/ErrorBoundary';
import { propertyService, DEFAULT_PROPERTY, PropertyData } from '../services/propertyService';
import { ContactModal } from '../components/ContactModal';
import { ReportGenerator } from './Report';
import { trackTrustServiceEnter } from '../lib/analytics';
import { buildKeyCapsuleTags } from '../utils/keyCapsules';
import { logger } from '../lib/logger';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/notify';
import { z } from 'zod';
import { secureStorage } from '../lib/secureStorage';
import { SkeletonBanner } from '../components/SkeletonScreen';
import { useTrustActions } from '../hooks/useTrustActions';
import { usePropertyTracker } from '../hooks/usePropertyTracker';
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
  MobileCTA,
  VipModal,
} from '../components/PropertyDetail';

/**
 * [Team 8 第五位修復] 錯誤分類輔助函數
 *
 * 將複雜的 if-else 鏈條提取為獨立函數，降低 cyclomatic complexity。
 *
 * @param error - 錯誤物件
 * @returns 錯誤標題和描述
 */
function classifyTrustServiceError(error: unknown): {
  title: string;
  description: string;
} {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  // 優先使用 error.code（更可靠）
  if (errorCode === 'RATE_LIMIT_EXCEEDED') {
    return {
      title: '操作過於頻繁',
      description: '請稍後再試（約 1 分鐘）',
    };
  }

  if (errorCode === 'UNAUTHORIZED') {
    return {
      title: '權限不足',
      description: '請登入後再試',
    };
  }

  if (errorCode === 'NOT_FOUND') {
    return {
      title: '物件不存在',
      description: '此物件可能已下架',
    };
  }

  // Timeout 錯誤
  if (
    errorMessage.includes('timed out') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('Timeout')
  ) {
    return {
      title: '請求超時',
      description: '伺服器回應時間過長，請稍後再試',
    };
  }

  // CORS 錯誤
  if (
    errorMessage.includes('CORS') ||
    errorMessage.includes('Cross-Origin') ||
    errorCode === 'ERR_BLOCKED_BY_CLIENT'
  ) {
    return {
      title: '連線被阻擋',
      description: '請檢查瀏覽器設定或網路環境',
    };
  }

  // 網路連線錯誤
  if (
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('網路') ||
    errorCode === 'ERR_NETWORK'
  ) {
    return {
      title: '網路連線異常',
      description: '請檢查網路連線後重試',
    };
  }

  // 速率限制（字串匹配作為 fallback）
  if (errorMessage.includes('429') || errorMessage.includes('請求過於頻繁')) {
    return {
      title: '操作過於頻繁',
      description: '請稍後再試（約 1 分鐘）',
    };
  }

  // 權限錯誤（字串匹配作為 fallback）
  if (
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    errorMessage.includes('未授權')
  ) {
    return {
      title: '權限不足',
      description: '請登入後再試',
    };
  }

  // 資源不存在（字串匹配作為 fallback）
  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    return {
      title: '物件不存在',
      description: '此物件可能已下架',
    };
  }

  // 伺服器錯誤（字串匹配作為 fallback）
  if (errorMessage.includes('500') || errorMessage.includes('系統錯誤')) {
    return {
      title: '伺服器異常',
      description: '請稍後再試，或聯繫客服',
    };
  }

  // 預設錯誤
  return {
    title: '無法進入服務',
    description: '請稍後再試',
  };
}

const AUTO_CREATE_CASE_RESPONSE_SCHEMA = z.object({
  data: z.object({
    token: z.string().uuid(),
    case_id: z.string().uuid(),
    buyer_name: z.string(),
  }),
});

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

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
  const [searchParams] = useSearchParams();
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock: 固定未登入狀態（正式版改用 useAuth）
  const isLoggedIn = false;

  // ContactModal 狀態
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSource, setContactSource] = useState<'sidebar' | 'mobile_bar' | 'booking'>(
    'sidebar'
  );

  // S 級 VIP 攔截 Modal
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipReason, setVipReason] = useState<string>('');

  // 報告生成器 Modal
  const [showReportGenerator, setShowReportGenerator] = useState(false);

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

  // ✅ 快取 agent_id，只在 mount 時讀取一次 localStorage
  const agentId = useMemo(() => {
    let aid = searchParams.get('aid');
    if (!aid) aid = localStorage.getItem('uag_last_aid');
    if (aid && aid !== 'unknown') localStorage.setItem('uag_last_aid', aid);
    return aid || 'unknown';
  }, [searchParams]);

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

  // 開啟聯絡 Modal 的處理函數
  const openContactModal = useCallback(
    (source: 'sidebar' | 'mobile_bar' | 'booking') => {
      setContactSource(source);
      setShowContactModal(true);
      // 同時追蹤點擊事件
      if (source === 'mobile_bar') {
        propertyTracker.trackLineClick();
      } else {
        propertyTracker.trackCallClick();
      }
    },
    [propertyTracker]
  );

  // 社會證明數據 - 模擬即時瀏覽人數與預約組數
  const socialProof = useMemo(() => {
    // 基於 property.publicId 產生穩定的隨機數
    const seed = property.publicId?.charCodeAt(3) || 0;
    return {
      currentViewers: Math.floor(seed % 5) + 2, // 2-6 人正在瀏覽
      weeklyBookings: Math.floor(seed % 8) + 5, // 5-12 組預約
      isHot: seed % 3 === 0, // 1/3 機率顯示為熱門
    };
  }, [property.publicId]);

  // 安心留痕服務操作
  const trustActions = useTrustActions(property.publicId);

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

  // AgentTrustCard 專用的穩定 callbacks
  const handleAgentLineClick = useCallback(() => {
    openContactModal('sidebar');
  }, [openContactModal]);

  const handleAgentCallClick = useCallback(() => {
    openContactModal('sidebar');
  }, [openContactModal]);

  const handleAgentBookingClick = useCallback(() => {
    openContactModal('booking');
  }, [openContactModal]);

  // 當 mockTrustEnabled 改變時，更新 property
  useEffect(() => {
    if (property.isDemo && mockTrustEnabled !== null) {
      setProperty((prev) => ({ ...prev, trustEnabled: mockTrustEnabled }));
    }
  }, [mockTrustEnabled, property.isDemo]);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

      try {
        const data = await propertyService.getPropertyByPublicId(id);
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
      }
    };
    fetchProperty();
  }, [id, mockTrustEnabled]);

  const isTrustEnabled = property.trustEnabled ?? false;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-800">
        {/* Header */}
        <nav className="sticky top-0 z-overlay flex h-16 items-center justify-between border-b border-slate-100 bg-white/90 px-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button className="rounded-full p-2 transition-colors hover:bg-slate-100">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-2 text-xl font-extrabold text-[#003366]">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#003366] to-[#00A8E8] text-white">
                <Home size={18} />
              </div>
              邁房子
            </div>
          </div>

          {/* 僅顯示公開編號 */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-500">
            <Hash size={12} className="mr-1 text-gray-400" />
            編號：
            <span className="ml-1 font-bold text-[#003366]">{property.publicId}</span>
          </div>
        </nav>

        {/* 開發測試按鈕 - 僅 Demo Mock 頁面顯示 */}
        {property.isDemo && (
          <div className="mx-auto max-w-4xl px-4 pt-4">
            <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-3">
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-900">🧪 開發測試模式 (僅 Mock 頁面)</p>
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
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-700 active:scale-95"
              >
                {mockTrustEnabled === null
                  ? '啟動測試'
                  : mockTrustEnabled
                    ? '✅ 已開啟'
                    : '❌ 未開啟'}
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
          {/* 優化方案 1: 使用拆分的 PropertyGallery 組件 */}
          <PropertyGallery
            images={property.images || []}
            title={property.title}
            onPhotoClick={handlePhotoClick}
            fallbackImage={FALLBACK_IMAGE}
          />

          {/* 優化方案 1: 使用拆分的 MobileCTA 組件 */}
          <MobileCTA
            onLineClick={() => openContactModal('mobile_bar')}
            onCallClick={() => openContactModal('mobile_bar')}
            weeklyBookings={socialProof.weeklyBookings}
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
              />

              {/* 優化方案 1: 使用拆分的 PropertySpecs 組件 */}
              <PropertySpecs property={property} />

              <div className="h-px bg-slate-100" />

              {/* 優化方案 1: 使用拆分的 PropertyDescription 組件 */}
              <PropertyDescription description={property.description} />

              {/* 優化方案 3: 使用 Intersection Observer 延遲渲染評論區 */}
              <CommunityReviews isLoggedIn={isLoggedIn} communityId={property.communityId} />
            </div>

            {/* Sidebar / Agent Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <AgentTrustCard
                  agent={property.agent}
                  {...(property.isDemo !== undefined ? { isDemo: property.isDemo } : {})}
                  onLineClick={handleAgentLineClick}
                  onCallClick={handleAgentCallClick}
                  onBookingClick={handleAgentBookingClick}
                />

                {/* FE-2: 安心留痕徽章（僅當房仲開啟服務時顯示） */}
                {isTrustEnabled && <TrustBadge />}
              </div>
            </div>
          </div>
        </main>

        {/* 📱 30秒回電浮動按鈕 - 高轉換 */}
        <button
          onClick={() => openContactModal('booking')}
          className="fixed bottom-28 right-4 z-40 flex size-16 animate-bounce flex-col items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-2xl transition-transform hover:scale-110 hover:bg-orange-600 lg:bottom-8"
          style={{ animationDuration: '2s' }}
        >
          <Phone size={22} />
          <span className="mt-0.5 text-[10px]">30秒回電</span>
        </button>

        {/* 優化方案 1: 使用拆分的 MobileActionBar 組件 */}
        <MobileActionBar
          onLineClick={() => openContactModal('mobile_bar')}
          onBookingClick={() => openContactModal('booking')}
          socialProof={socialProof}
        />

        {/* 統一聯絡入口 Modal */}
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          propertyId={property.publicId}
          propertyTitle={property.title}
          agentId={agentId}
          agentName={property.agent?.name || '專屬業務'}
          source={contactSource}
        />

        {/* 優化方案 1: 使用拆分的 VipModal 組件 */}
        <VipModal
          isOpen={showVipModal}
          onClose={() => setShowVipModal(false)}
          onLineClick={() => {
            propertyTracker.trackLineClick();
            openContactModal('mobile_bar');
          }}
          onBookingClick={() => {
            propertyTracker.trackCallClick();
            openContactModal('booking');
          }}
          reason={vipReason}
        />

        {/* 報告生成 FAB 按鈕 */}
        <button
          onClick={() => setShowReportGenerator(true)}
          className="group fixed bottom-24 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[#003366] to-[#00A8E8] text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          title="生成物件報告"
        >
          <FileText size={24} />
          <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            生成報告
          </span>
        </button>

        {/* 報告生成器 Modal */}
        <ReportGenerator
          property={{
            id: property.id,
            publicId: property.publicId,
            title: property.title,
            price: property.price,
            address: property.address,
            description: property.description,
            images: property.images,
            agent: {
              id: property.agent.id,
              name: property.agent.name,
              avatarUrl: property.agent.avatarUrl,
              company: property.agent.company,
              trustScore: property.agent.trustScore,
              reviewCount: property.agent.encouragementCount,
            },
          }}
          isOpen={showReportGenerator}
          onClose={() => setShowReportGenerator(false)}
        />
      </div>
    </ErrorBoundary>
  );
};
