import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Home,
  Heart,
  Phone,
  MessageCircle,
  Hash,
  MapPin,
  ArrowLeft,
  Shield,
  Eye,
  Users,
  Calendar,
  Flame,
  Star,
  Lock,
  ChevronRight,
  CheckCircle,
  FileText,
} from "lucide-react";
import { AgentTrustCard } from "../components/AgentTrustCard";
import { TrustBadge } from "../components/TrustBadge";
import { TrustServiceBanner } from "../components/TrustServiceBanner";
import ErrorBoundary from "../app/ErrorBoundary";
import {
  propertyService,
  DEFAULT_PROPERTY,
  PropertyData,
} from "../services/propertyService";
import { ContactModal } from "../components/ContactModal";
import { ReportGenerator } from "./Report";
import { LineShareAction } from "../components/social/LineShareAction";
import {
  buildKeyCapsuleTags,
  formatArea,
  formatLayout,
  formatFloor,
} from "../utils/keyCapsules";
import { track } from "../analytics/track";
import { logger } from "../lib/logger";
import { supabase } from "../lib/supabase";
import { notify } from "../lib/notify";
import { z } from "zod";
import { secureStorage, migrateLegacyData } from "../lib/secureStorage";
import { SkeletonBanner } from "../components/SkeletonScreen";
import { useTrustActions } from "../hooks/useTrustActions";
import { usePropertyTracker } from "../hooks/usePropertyTracker";
import { TOAST_DURATION } from "../constants/toast";


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
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  // 優先使用 error.code（更可靠）
  if (errorCode === "RATE_LIMIT_EXCEEDED") {
    return {
      title: "操作過於頻繁",
      description: "請稍後再試（約 1 分鐘）",
    };
  }

  if (errorCode === "UNAUTHORIZED") {
    return {
      title: "權限不足",
      description: "請登入後再試",
    };
  }

  if (errorCode === "NOT_FOUND") {
    return {
      title: "物件不存在",
      description: "此物件可能已下架",
    };
  }

  // Timeout 錯誤
  if (
    errorMessage.includes("timed out") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("Timeout")
  ) {
    return {
      title: "請求超時",
      description: "伺服器回應時間過長，請稍後再試",
    };
  }

  // CORS 錯誤
  if (
    errorMessage.includes("CORS") ||
    errorMessage.includes("Cross-Origin") ||
    errorCode === "ERR_BLOCKED_BY_CLIENT"
  ) {
    return {
      title: "連線被阻擋",
      description: "請檢查瀏覽器設定或網路環境",
    };
  }

  // 網路連線錯誤
  if (
    errorMessage.includes("NetworkError") ||
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("網路") ||
    errorCode === "ERR_NETWORK"
  ) {
    return {
      title: "網路連線異常",
      description: "請檢查網路連線後重試",
    };
  }

  // 速率限制（字串匹配作為 fallback）
  if (errorMessage.includes("429") || errorMessage.includes("請求過於頻繁")) {
    return {
      title: "操作過於頻繁",
      description: "請稍後再試（約 1 分鐘）",
    };
  }

  // 權限錯誤（字串匹配作為 fallback）
  if (
    errorMessage.includes("401") ||
    errorMessage.includes("403") ||
    errorMessage.includes("未授權")
  ) {
    return {
      title: "權限不足",
      description: "請登入後再試",
    };
  }

  // 資源不存在（字串匹配作為 fallback）
  if (errorMessage.includes("404") || errorMessage.includes("not found")) {
    return {
      title: "物件不存在",
      description: "此物件可能已下架",
    };
  }

  // 伺服器錯誤（字串匹配作為 fallback）
  if (errorMessage.includes("500") || errorMessage.includes("系統錯誤")) {
    return {
      title: "伺服器異常",
      description: "請稍後再試，或聯繫客服",
    };
  }

  // 預設錯誤
  return {
    title: "無法進入服務",
    description: "請稍後再試",
  };
}

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

  // 圖片瀏覽狀態
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ContactModal 狀態
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSource, setContactSource] = useState<
    "sidebar" | "mobile_bar" | "booking"
  >("sidebar");

  // S 級 VIP 攔截 Modal
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipReason, setVipReason] = useState<string>("");

  // 報告生成器 Modal
  const [showReportGenerator, setShowReportGenerator] = useState(false);

  // 安心留痕要求處理狀態
  const [isRequestingTrust, setIsRequestingTrust] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // 開發測試：trustEnabled 狀態切換 (僅 Mock 頁面)
  const [mockTrustEnabled, setMockTrustEnabled] = useState<boolean | null>(null);

  // 初始化直接使用 DEFAULT_PROPERTY，確保第一幀就有畫面，絕不留白
  const [property, setProperty] = useState<PropertyData>(DEFAULT_PROPERTY);

  // 取得 agent_id (從 URL 參數或 localStorage)
  const getAgentId = () => {
    let aid = searchParams.get("aid");
    if (!aid) aid = localStorage.getItem("uag_last_aid");
    if (aid && aid !== "unknown") localStorage.setItem("uag_last_aid", aid);
    return aid || "unknown";
  };

  // S 級客戶即時攔截回調
  const handleGradeUpgrade = useCallback((grade: string, reason?: string) => {
    if (grade === "S") {
      if (reason) setVipReason(reason);
      // 延遲 500ms 顯示，避免太突兀
      setTimeout(() => setShowVipModal(true), 500);
    }
  }, []);

  // 從 address 提取行政區 (例如 "台北市信義區..." -> "信義區")
  const extractDistrict = (address: string): string => {
    const match = address.match(/[市縣](.{2,3}[區鄉鎮市])/);
    return match?.[1] ?? "unknown";
  };

  // 初始化追蹤器 (傳入 district + S級回調)
  const propertyTracker = usePropertyTracker(
    id || "",
    getAgentId(),
    extractDistrict(property.address),
    handleGradeUpgrade,
  );

  // 開啟聯絡 Modal 的處理函數
  const openContactModal = (source: "sidebar" | "mobile_bar" | "booking") => {
    setContactSource(source);
    setShowContactModal(true);
    // 同時追蹤點擊事件
    if (source === "mobile_bar") {
      propertyTracker.trackLineClick();
    } else {
      propertyTracker.trackCallClick();
    }
  };

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
    setIsRequesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch('/api/trust/auto-create-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.publicId,
          userId: user?.id,
          userName: user?.user_metadata?.name
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: '系統錯誤' }));
        throw new Error(errorData.error || 'Failed to create case');
      }

      // [Team 4 修復] 加入 API 回應驗證
      const responseSchema = z.object({
        data: z.object({
          token: z.string().uuid(),
          case_id: z.string().uuid(),
          buyer_name: z.string(),
        }),
      });

      const json = await res.json();
      const parseResult = responseSchema.safeParse(json);

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
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'trust_service_enter', {
          event_category: 'trust_flow',
          event_label: property.publicId,
          value: 1,
        });
      }

      // [Team 5 修復] Security: 不透過 URL 傳遞 Token
      // Token 已安全存儲在 secureStorage，Assure 頁面會自動從 localStorage 讀取
      // 避免 Token 洩漏到瀏覽器歷史、Server logs 或 Referrer header
      window.location.href = '/maihouses/assure';
    } catch (error) {
      // [Team 8 第五位修復] 使用提取的錯誤分類函數
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: unknown }).code)
          : "";

      logger.error("handleEnterService error", {
        error: errorMessage,
        code: errorCode,
        propertyId: property.publicId,
      });

      const { title, description } = classifyTrustServiceError(error);
      notify.error(title, description);
    } finally {
      setIsRequesting(false);
    }
  }, [property.publicId]);

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

  // 當 mockTrustEnabled 改變時，更新 property
  useEffect(() => {
    if (id === 'MH-100001' && mockTrustEnabled !== null) {
      setProperty(prev => ({ ...prev, trustEnabled: mockTrustEnabled }));
    }
  }, [mockTrustEnabled, id]);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;

      try {
        const data = await propertyService.getPropertyByPublicId(id);
        if (data) {
          // 如果是 Mock 頁面且有開發測試狀態，覆寫 trustEnabled
          if (id === 'MH-100001' && mockTrustEnabled !== null) {
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

        logger.error("Failed to load property details", {
          error,
          propertyId: id,
          errorMessage,
          errorType: error instanceof Error ? error.constructor.name : typeof error
        });

        toast.error('載入失敗', {
          description,
          action: {
            label: '重新載入',
            onClick: () => window.location.reload()
          },
          duration: TOAST_DURATION.ERROR
        });
      }
    };
    fetchProperty();
    // mockTrustEnabled 由獨立 useEffect 處理，不需加入依賴
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // [Safety] 確保有圖片可顯示，防止空陣列導致破圖
  const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  let displayImage =
    property.images && property.images.length > 0 && property.images[0]
      ? property.images[0]
      : FALLBACK_IMAGE;

  // [Double Safety] 前端攔截 picsum
  if (displayImage && displayImage.includes("picsum")) {
    displayImage = FALLBACK_IMAGE;
  }

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
          <span className="ml-1 font-bold text-[#003366]">
            {property.publicId}
          </span>
        </div>
      </nav>

      {/* 開發測試按鈕 - 僅 MH-100001 Mock 頁面顯示 */}
      {id === 'MH-100001' && (
        <div className="mx-auto max-w-4xl px-4 pt-4">
          <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-3">
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-900">
                🧪 開發測試模式 (僅 Mock 頁面)
              </p>
              <p className="text-[10px] text-amber-700">
                切換安心留痕狀態查看不同 UI 效果
              </p>
            </div>
            <button
              onClick={() => setMockTrustEnabled(prev => {
                const newValue = prev === null ? true : !prev;
                toast.info(`切換為：${newValue ? '已開啟' : '未開啟'}`, {
                  duration: 1500,
                });
                return newValue;
              })}
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
            trustEnabled={property.trustEnabled ?? false}
            propertyId={property.publicId}
            className="my-4"
            onEnterService={handleEnterService}
            onRequestEnable={async () => {
              setIsRequestingTrust(true);
              try {
                await trustActions.requestEnable();
              } catch (error) {
                logger.error('Failed to request trust enable', {
                  error,
                  propertyId: property.publicId,
                });
                toast.error('要求失敗', {
                  description: '無法送出開啟要求,請稍後再試',
                  duration: TOAST_DURATION.ERROR,
                });
              } finally {
                setIsRequestingTrust(false);
              }
            }}
            isRequesting={isRequesting}
          />
      )}

      <main className="mx-auto max-w-4xl p-4 pb-24">
        {/* Image Gallery - 橫向滾動多圖 */}
        <div className="mb-4">
          {/* 主圖 */}
          <div className="group relative aspect-video overflow-hidden rounded-2xl bg-slate-200">
            <img
              src={property.images?.[currentImageIndex] || displayImage}
              alt={property.title}
              onError={(e) => {
                if (e.currentTarget.src !== FALLBACK_IMAGE) {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }
              }}
              className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur-md">
              <Home size={12} />
              <span>
                {currentImageIndex + 1} / {property.images?.length || 1}
              </span>
            </div>
          </div>

          {/* 縮圖橫向滾動 */}
          {property.images && property.images.length > 1 && (
            <div className="scrollbar-hide -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2">
              {property.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentImageIndex(i);
                    propertyTracker.trackPhotoClick();
                  }}
                  className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    i === currentImageIndex
                      ? "border-[#003366] ring-2 ring-[#003366]/20"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`照片 ${i + 1}`}
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 📱 行動端首屏 CTA - 高轉換設計 */}
        <div className="mb-6 lg:hidden">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-lg">
            <div className="flex gap-3">
              <button
                onClick={() => openContactModal("mobile_bar")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#003366] py-4 text-base font-bold text-white shadow-lg"
              >
                <Phone size={20} />
                立即聯絡經紀人
              </button>
              <button
                onClick={() => openContactModal("mobile_bar")}
                className="flex w-14 items-center justify-center rounded-xl bg-[#06C755] text-white shadow-lg"
              >
                <MessageCircle size={22} />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-500">
              🔥 本物件 {socialProof.weeklyBookings} 組預約中，把握機會！
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold leading-tight text-slate-900">
                  {property.title}
                </h1>
                {/* 分享 + 收藏按鈕群組 */}
                <div className="flex items-center gap-2">
                  <LineShareAction
                    url={`${window.location.origin}/maihouses/property/${property.publicId}`}
                    title={`【邁房子推薦】${property.title} | 總價 ${property.price} 萬`}
                    onShareClick={() => propertyTracker.trackLineClick()}
                    className="rounded-full bg-[#06C755] p-2 text-white transition-all hover:bg-[#05a847] hover:shadow-md"
                    showIcon={true}
                    btnText=""
                  />
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`rounded-full p-2 transition-all ${isFavorite ? "bg-red-50 text-red-500" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                  >
                    <Heart
                      size={24}
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={16} />
                <span>{property.address}</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={propertyTracker.trackMapClick}
                  className="ml-2 flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                >
                  <MapPin size={12} />
                  查看地圖
                </a>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#003366]">
                  {property.price}
                </span>
                <span className="text-lg font-medium text-slate-500">萬</span>
                <span className="ml-2 text-sm font-medium text-red-500">
                  可議價
                </span>
              </div>

              {/* 社會證明提示 - FOMO */}
              <div className="mt-3 flex flex-wrap gap-2">
                {socialProof.isHot && (
                  <div className="inline-flex animate-pulse items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-xs font-medium text-orange-600">
                    <Flame size={12} />
                    熱門物件
                  </div>
                )}
                <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  <Eye size={12} className="text-blue-500" />
                  {socialProof.currentViewers} 人正在瀏覽
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-600">
                  <Users size={12} className="text-green-500" />
                  本週 {socialProof.weeklyBookings} 組預約看屋
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {capsuleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#003366]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 物件基本資訊 (Phase 2: 消除 hardcode) */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-4">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">建案坪數</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatArea(property.size ?? DEFAULT_PROPERTY.size) || "--"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">格局</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatLayout(
                    property.rooms ?? DEFAULT_PROPERTY.rooms,
                    property.halls ?? DEFAULT_PROPERTY.halls,
                  ) || "--"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">樓層</span>
                <span className="text-sm font-bold text-slate-800">
                  {formatFloor(
                    property.floorCurrent ?? DEFAULT_PROPERTY.floorCurrent,
                    property.floorTotal ?? DEFAULT_PROPERTY.floorTotal,
                  ) || "--"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">編號</span>
                <span className="text-sm font-bold text-slate-800">
                  {property.publicId}
                </span>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Description */}
            <div className="prose prose-slate max-w-none">
              <h3 className="mb-3 text-lg font-bold text-slate-900">
                物件特色
              </h3>
              <p className="whitespace-pre-line leading-relaxed text-slate-600">
                {property.description}
              </p>
            </div>

            {/* 🏠 社區評價 - 兩好一公道 */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Star
                    size={18}
                    className="text-yellow-500"
                    fill="currentColor"
                  />
                  社區評價
                </h3>
                <span className="rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-500">
                  88 位住戶加入
                </span>
              </div>

              {/* 前兩則評價（公開顯示） */}
              <div className="space-y-3">
                <div className="flex gap-3 rounded-xl bg-slate-50 p-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#003366] text-lg font-bold text-white">
                    J
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        J***
                      </span>
                      <span className="text-xs text-slate-500">B棟住戶</span>
                      <span className="text-xs text-yellow-500">★★★★★</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                      公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-xl bg-slate-50 p-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#00A8E8] text-lg font-bold text-white">
                    W
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        W***
                      </span>
                      <span className="text-xs text-slate-500">12F住戶</span>
                      <span className="text-xs text-yellow-500">★★★★☆</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                      住起來整體舒服，但面向上路的低樓層在上下班尖峰車聲明顯，喜靜的買家可考慮中高樓層。
                    </p>
                  </div>
                </div>
              </div>

              {/* 第三則（未登入時模糊隱藏，登入後正常顯示） */}
              <div className="relative mt-3 overflow-hidden rounded-xl">
                <div
                  className={`flex gap-3 bg-slate-50 p-3 ${!isLoggedIn ? "select-none blur-sm" : ""}`}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-lg font-bold text-white">
                    L
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">
                        L***
                      </span>
                      <span className="text-xs text-slate-500">C棟住戶</span>
                      {isLoggedIn && (
                        <span className="text-xs text-yellow-500">★★★★★</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {isLoggedIn
                        ? "頂樓排水設計不錯，颱風天也沒有積水問題。管委會有固定請人清理排水孔，很放心。"
                        : "頂樓排水設計不錯，颱風天也沒有積水問題..."}
                    </p>
                  </div>
                </div>

                {/* 遮罩層 - 已登入則直接看到，未登入顯示註冊按鈕 */}
                {!isLoggedIn && (
                  <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-b from-transparent via-white/80 to-white pb-3">
                    <button
                      onClick={() => {
                        window.location.href = "/auth.html?redirect=community";
                      }}
                      className="flex items-center gap-2 rounded-full bg-[#003366] px-4 py-2 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#004488]"
                    >
                      <Lock size={14} />
                      註冊查看全部 6 則評價
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* 社區牆入口提示 */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-500">
                  💬 加入社區牆，與現任住戶交流
                </p>
                <button
                  onClick={() =>
                    (window.location.href =
                      "/maihouses/community-wall_mvp.html")
                  }
                  className="flex items-center gap-1 text-xs font-bold text-[#003366] hover:underline"
                >
                  前往社區牆
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar / Agent Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <AgentTrustCard
                agent={property.agent}
                onLineClick={() => openContactModal("sidebar")}
                onCallClick={() => openContactModal("sidebar")}
                onBookingClick={() => openContactModal("booking")}
              />

              {/* FE-2: 安心留痕徽章（僅當房仲開啟服務時顯示） */}
              {property.trustEnabled && <TrustBadge />}

            </div>
          </div>
        </div>
      </main>

      {/* 📱 30秒回電浮動按鈕 - 高轉換 */}
      <button
        onClick={() => openContactModal("booking")}
        className="fixed bottom-28 right-4 z-40 flex size-16 animate-bounce flex-col items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow-2xl transition-transform hover:scale-110 hover:bg-orange-600 lg:bottom-8"
        style={{ animationDuration: "2s" }}
      >
        <Phone size={22} />
        <span className="mt-0.5 text-[10px]">30秒回電</span>
      </button>

      {/* Mobile Bottom Bar - 雙主按鈕設計 */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-overlay border-t border-slate-100 bg-white p-3 lg:hidden">
        {/* 經紀人驗證資訊 */}
        <div className="mb-2 flex items-center justify-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Shield size={10} className="text-green-500" />
            認證經紀人
          </span>
          <span className="flex items-center gap-1">
            <Eye size={10} className="text-blue-500" />
            {socialProof.currentViewers} 人瀏覽中
          </span>
          {socialProof.isHot && (
            <span className="flex items-center gap-1 font-medium text-orange-500">
              <Flame size={10} />
              熱門
            </span>
          )}
        </div>

        {/* 雙主按鈕 */}
        <div className="flex gap-2">
          {/* 左按鈕：加 LINE（低門檻）*/}
          <button
            onClick={() => openContactModal("mobile_bar")}
            className="flex flex-[4] items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3 font-bold text-white shadow-lg shadow-green-500/20"
          >
            <MessageCircle size={20} />加 LINE 諮詢
          </button>

          {/* 右按鈕：預約看屋（高意圖）*/}
          <button
            onClick={() => openContactModal("booking")}
            className="flex flex-[6] items-center justify-center gap-2 rounded-xl bg-[#003366] py-3 font-bold text-white shadow-lg shadow-blue-900/20"
          >
            <Calendar size={20} />
            預約看屋
          </button>
        </div>
      </div>

      {/* 統一聯絡入口 Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        propertyId={property.publicId}
        propertyTitle={property.title}
        agentId={getAgentId()}
        agentName={property.agent?.name || "專屬業務"}
        source={contactSource}
      />

      {/* VIP 高意願客戶攔截彈窗 (S-Grade) */}
      {showVipModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowVipModal(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setShowVipModal(false);
          }}
          role="button"
          tabIndex={0}
          aria-label="關閉 VIP 彈窗"
        >
          <div
            className="animate-in zoom-in-95 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl duration-300"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            {/* Header */}
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500">
                <Flame size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                發現您對此物件很有興趣！
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {vipReason || "專屬 VIP 服務為您優先安排"}
              </p>
            </div>

            {/* Benefits */}
            <div className="mb-4 space-y-2 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={16} className="shrink-0 text-green-500" />
                <span>優先安排專人帶看</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={16} className="shrink-0 text-green-500" />
                <span>獨家議價空間資訊</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={16} className="shrink-0 text-green-500" />
                <span>相似物件即時通知</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  propertyTracker.trackLineClick();
                  setShowVipModal(false);
                  openContactModal("mobile_bar");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3 font-bold text-white shadow-lg"
              >
                <MessageCircle size={20} />
                立即加 LINE 諮詢
              </button>
              <button
                onClick={() => {
                  propertyTracker.trackCallClick();
                  setShowVipModal(false);
                  openContactModal("booking");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#003366] py-3 font-bold text-white"
              >
                <Calendar size={20} />
                VIP 預約看屋
              </button>
              <button
                onClick={() => setShowVipModal(false)}
                className="w-full py-2 text-sm text-slate-400 hover:text-slate-600"
              >
                稍後再說
              </button>
            </div>
          </div>
        </div>
      )}

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
