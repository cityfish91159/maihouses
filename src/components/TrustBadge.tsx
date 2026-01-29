import React from 'react';
import { Shield, CheckCircle } from 'lucide-react';

const ICON_SIZE_MD = 16;
const ICON_SIZE_SM = 14;
const ICON_SIZE_XS = 12;

interface TrustBadgeProps {
  /** 徽章變體：default（詳細版）或 compact（精簡版） */
  variant?: 'default' | 'compact';
  /** 自訂 CSS class（用於覆寫樣式或間距） */
  className?: string;
}

/**
 * FE-2: 安心留痕徽章
 * WHY: 消費者在詳情頁需要一眼看出該物件是否支援安心留痕服務
 *      房仲開啟服務後，徽章提供信任背書，提升成交機率
 */
export const TrustBadge: React.FC<TrustBadgeProps> = ({ variant = 'default', className = '' }) => {
  if (variant === 'default') {
    return (
      <div
        role="region"
        aria-label="安心留痕服務資訊"
        className={`rounded-xl border border-blue-200 bg-blue-50 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${className}`}
      >
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-900">
          <Shield size={ICON_SIZE_MD} aria-hidden="true" />
          安心留痕
        </h4>
        <p className="mb-3 text-xs leading-relaxed text-blue-800">本物件支援安心交易留痕服務</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-xs text-blue-700">
            <CheckCircle size={ICON_SIZE_SM} className="shrink-0" aria-hidden="true" />
            六階段交易追蹤
          </li>
          <li className="flex items-center gap-2 text-xs text-blue-700">
            <CheckCircle size={ICON_SIZE_SM} className="shrink-0" aria-hidden="true" />
            每步驟數位留痕
          </li>
          <li className="flex items-center gap-2 text-xs text-blue-700">
            <CheckCircle size={ICON_SIZE_SM} className="shrink-0" aria-hidden="true" />
            雙方確認機制
          </li>
        </ul>
      </div>
    );
  }

  // compact 變體：單行徽章（未來列表頁使用）
  return (
    <div
      role="status"
      aria-label="安心留痕"
      className={`inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${className}`}
    >
      <Shield size={ICON_SIZE_XS} aria-hidden="true" />
      安心留痕
    </div>
  );
};
