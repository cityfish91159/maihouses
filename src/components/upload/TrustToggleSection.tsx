import React, { useCallback } from 'react';
import { Shield, Info } from 'lucide-react';
import { useUploadForm } from './UploadContext';

// T1: 圖標尺寸常數化
const ICON_SIZE_MD = 20;
const ICON_SIZE_SM = 16;

/**
 * FE-1: 安心留痕服務開關
 * WHY: 房仲上傳物件時可選擇是否開啟安心留痕服務
 *      消費者在詳情頁看到徽章才知道這物件有交易追蹤
 */
export const TrustToggleSection: React.FC = () => {
  const { form, setForm } = useUploadForm();

  const handleToggle = useCallback(() => {
    setForm((prev) => ({ ...prev, trustEnabled: !prev.trustEnabled }));
  }, [setForm]);

  // T2: 改進命名清晰度
  const isTrustEnabled = form.trustEnabled;

  // T3: Tailwind class 常數化，避免過長
  const toggleBaseClass =
    'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2';
  const toggleActiveClass = isTrustEnabled ? 'hover:bg-brand/90 bg-brand' : 'bg-slate-200';

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-maihouses-dark">
        <Shield size={ICON_SIZE_MD} className="text-brand-light" aria-hidden="true" /> 安心留痕服務
      </h2>

      <div className="border-brand-100/50 bg-brand-50/50 rounded-xl border p-5">
        {/* Toggle Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isTrustEnabled}
              aria-label={isTrustEnabled ? '關閉安心留痕服務' : '開啟安心留痕服務'}
              onClick={handleToggle}
              className={`${toggleBaseClass} ${toggleActiveClass}`}
            >
              <span
                className={`inline-block size-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isTrustEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-bold text-slate-700">
              {isTrustEnabled ? '已開啟安心留痕' : '開啟安心留痕'}
            </span>
          </div>

          {isTrustEnabled && (
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand">
              已啟用
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          為消費者提供六階段交易追蹤，從接洽到交屋全程留痕，增加交易信任度。
        </p>

        {/* Info Tip */}
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-brand-50 p-3">
          <Info size={ICON_SIZE_SM} className="mt-0.5 shrink-0 text-brand-600" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-brand-600">
            僅在成交時收取服務費，其他階段完全免費
          </p>
        </div>
      </div>
    </section>
  );
};
