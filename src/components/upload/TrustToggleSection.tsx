import React, { useCallback } from "react";
import { Shield, Info } from "lucide-react";
import { useUploadForm } from "./UploadContext";

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

  const isEnabled = form.trustEnabled === true;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-maihouses-dark mb-5 flex items-center gap-2 text-lg font-bold">
        <Shield size={20} className="text-emerald-500" /> 安心留痕服務
      </h2>

      <div className="rounded-xl border border-emerald-100/50 bg-emerald-50/30 p-5">
        {/* Toggle Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isEnabled}
              aria-label="開啟安心留痕服務"
              onClick={handleToggle}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                isEnabled ? "bg-emerald-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block size-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-bold text-slate-700">
              {isEnabled ? "已開啟安心留痕" : "開啟安心留痕"}
            </span>
          </div>

          {isEnabled && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              已啟用
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          為消費者提供六階段交易追蹤，從接洽到交屋全程留痕，增加交易信任度。
        </p>

        {/* Info Tip */}
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-700">
            僅在成交時收取服務費，其他階段完全免費
          </p>
        </div>
      </div>
    </section>
  );
};
