import { useMemo, useId } from 'react';
import { Shield, Info, ChevronRight } from 'lucide-react';

interface TrustServiceBannerProps {
  trustEnabled: boolean;
  propertyId: string;
  className?: string;
  onLearnMore?: () => void;
  onRequestEnable?: () => void;
}

export const TrustServiceBanner: React.FC<TrustServiceBannerProps> = ({
  trustEnabled,
  propertyId,
  className = '',
  onLearnMore,
  onRequestEnable,
}) => {
  // 生成唯一 ID 用於 ARIA 關聯
  const titleId = useId();
  const subtitleId = useId();

  const bannerConfig = useMemo(() => {
    if (trustEnabled) {
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        subtitleColor: 'text-blue-700',
        buttonBg: 'bg-blue-600',
        buttonHover: 'hover:bg-blue-700',
        buttonFocus:
          'focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600',
        icon: Shield,
        title: '本物件已開啟安心留痕服務',
        subtitle: '六階段交易追蹤 · 每步驟數位留痕 · 雙方確認機制',
        buttonText: '了解更多',
        buttonAriaLabel: '了解更多關於安心留痕服務的資訊',
        onButtonClick: onLearnMore,
      };
    }
    return {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-900',
      subtitleColor: 'text-amber-700',
      buttonBg: 'bg-amber-600',
      buttonHover: 'hover:bg-amber-700',
      buttonFocus:
        'focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-amber-600',
      icon: Info,
      title: '本物件尚未開啟安心留痕服務',
      subtitle: '讓房仲開啟六階段交易追蹤,保障您的購屋權益',
      buttonText: '要求房仲開啟',
      buttonAriaLabel: '要求房仲開啟安心留痕服務',
      onButtonClick: onRequestEnable,
    };
  }, [trustEnabled, onLearnMore, onRequestEnable]);

  const Icon = bannerConfig.icon;

  return (
    <div className={`mx-auto max-w-4xl px-4 ${className}`}>
      <section
        className={`flex flex-col gap-2 rounded-xl border lg:flex-row lg:items-center lg:justify-between lg:gap-3 ${bannerConfig.borderColor} ${bannerConfig.bgColor} p-3 shadow-sm`}
        role="region"
        aria-labelledby={titleId}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm"
            role="img"
            aria-label={trustEnabled ? '已啟用安心服務' : '未啟用安心服務'}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className={`text-sm font-bold ${bannerConfig.textColor}`}>
              {bannerConfig.title}
            </h3>
            <p id={subtitleId} className={`text-xs ${bannerConfig.subtitleColor}`}>
              {bannerConfig.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={bannerConfig.onButtonClick}
          aria-label={bannerConfig.buttonAriaLabel}
          aria-describedby={subtitleId}
          className={`inline-flex shrink-0 items-center justify-center gap-1 rounded-full ${bannerConfig.buttonBg} ${bannerConfig.buttonHover} ${bannerConfig.buttonFocus} w-full px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95 lg:w-auto`}
        >
          <span>{bannerConfig.buttonText}</span>
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
};
