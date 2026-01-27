import { Shield, Info, ChevronRight, Loader2 } from 'lucide-react';

interface TrustServiceBannerProps {
  trustEnabled: boolean;

  /**
   * 物件的 public ID (例如: MH-100001)
   *
   * @remarks
   * Phase 1: 目前未使用,保留供 Phase 2 API 整合使用
   * Phase 2: 將用於呼叫 /api/property/request-trust-enable API
   *
   * @see {@link https://maihouses.vercel.app/maihouses/docs/trust-flow-implementation.md}
   */
  propertyId: string;

  className?: string;
  onLearnMore?: () => void;
  onRequestEnable?: () => void;

  /**
   * 是否正在處理要求開啟信任服務的請求
   * 用於顯示 Loading 狀態，防止重複提交
   */
  isRequesting?: boolean;
}

/**
 * 安心留痕服務狀態橫幅組件
 *
 * 根據物件的 trustEnabled 狀態顯示不同樣式的提示橫幅:
 * - 已開啟: 藍色系橫幅 + "了解更多" CTA
 * - 未開啟: 琥珀色系橫幅 + "要求房仲開啟" CTA
 *
 * @param props - 組件 Props
 * @param props.trustEnabled - 是否已開啟安心留痕服務
 * @param props.propertyId - 物件 public ID (例如: MH-100001)
 * @param props.className - 自訂 CSS class
 * @param props.onLearnMore - 「了解更多」點擊回調
 * @param props.onRequestEnable - 「要求房仲開啟」點擊回調
 * @param props.isRequesting - 是否正在提交要求 (顯示 loading 狀態)
 *
 * @returns React 組件
 *
 * @example
 * ```tsx
 * // 已開啟安心留痕的物件
 * <TrustServiceBanner
 *   trustEnabled={true}
 *   propertyId="MH-100001"
 *   onLearnMore={() => navigate('/trust-room')}
 * />
 *
 * // 未開啟安心留痕的物件 (with loading)
 * <TrustServiceBanner
 *   trustEnabled={false}
 *   propertyId="MH-100002"
 *   onRequestEnable={() => requestTrustService('MH-100002')}
 *   isRequesting={isRequesting}
 * />
 * ```
 *
 * @remarks
 * 此組件位於 PropertyDetailPage Header 下方,主內容區之前。
 * 參考 TxBanner 的橫幅設計模式。
 * 使用專案既定的 badge-trust-* 和 badge-warning-* 色彩系統。
 *
 * @see {@link TrustServiceBannerProps} Props 介面定義
 */
export const TrustServiceBanner: React.FC<TrustServiceBannerProps> = ({
  trustEnabled,
  propertyId,
  className = '',
  onLearnMore,
  onRequestEnable,
  isRequesting = false,
}) => {

  // 直接條件判斷,避免 useMemo 過度優化
  // 物件字面量建立成本極低,useMemo 的記憶化開銷反而更大
  const bannerConfig = trustEnabled
    ? {
        bgColor: 'bg-badge-trust-bg',
        borderColor: 'border-badge-trust-border',
        textColor: 'text-badge-trust-text',
        subtitleColor: 'text-badge-trust-text',
        buttonBg: 'bg-badge-trust-text',
        buttonHover: 'hover:bg-badge-trust-hover',
        icon: Shield,
        title: '本物件已開啟安心留痕服務',
        subtitle: '六階段交易追蹤 · 每步驟數位留痕 · 雙方確認機制',
        buttonText: '了解更多',
        onButtonClick: onLearnMore,
      }
    : {
        bgColor: 'bg-badge-warning-bg',
        borderColor: 'border-badge-warning-border',
        textColor: 'text-badge-warning-text',
        subtitleColor: 'text-badge-warning-text',
        buttonBg: 'bg-badge-warning-text',
        buttonHover: 'hover:bg-badge-warning-hover',
        icon: Info,
        title: '本物件尚未開啟安心留痕服務',
        subtitle: '讓房仲開啟六階段交易追蹤,保障您的購屋權益',
        buttonText: '要求房仲開啟',
        onButtonClick: onRequestEnable,
      };

  const Icon = bannerConfig.icon;

  return (
    <div className={`mx-auto max-w-4xl px-4 ${className}`}>
      <div
        className={`flex flex-col gap-2 rounded-xl border p-4 shadow-sm md:flex-row md:items-center md:justify-between md:gap-4 ${bannerConfig.borderColor} ${bannerConfig.bgColor} dark:backdrop-blur-sm`}
        role="region"
        aria-label={trustEnabled ? '安心留痕服務已啟用通知' : '安心留痕服務未啟用提醒'}
      >
        {/* Live Region 狀態通知 */}
        <div role="status" aria-live="polite" className="sr-only">
          {isRequesting && '正在處理您的要求,請稍候...'}
        </div>
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-800">
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold ${bannerConfig.textColor}`}>
              {bannerConfig.title}
            </p>
            <p className={`text-xs ${bannerConfig.subtitleColor}`}>
              {bannerConfig.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => bannerConfig.onButtonClick?.()}
          disabled={isRequesting}
          aria-disabled={isRequesting}
          aria-busy={isRequesting}
          aria-label={
            trustEnabled
              ? '開啟安心留痕說明頁面'
              : '要求房仲開啟安心留痕服務'
          }
          title={
            trustEnabled
              ? '在新分頁查看詳細說明'
              : '向房仲提出開啟服務的要求'
          }
          className={`inline-flex min-h-[48px] w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-bold text-white shadow-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto lg:w-auto ${bannerConfig.buttonBg} ${bannerConfig.buttonHover}`}
        >
          {isRequesting ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span className="sr-only">正在處理</span>
              處理中...
            </>
          ) : (
            <>
              {bannerConfig.buttonText}
              <ChevronRight className="size-5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
