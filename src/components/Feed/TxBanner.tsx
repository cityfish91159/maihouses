/**
 * TxBanner Component
 *
 * 進行中交易橫幅
 * 當用戶有進行中的交易時顯示，引導進入交易戰情室
 */

import { memo } from 'react';
import { Home, ChevronRight } from 'lucide-react';
import type { ActiveTransaction } from '../../types/feed';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';

const S = STRINGS.FEED.TX_BANNER;

interface TxBannerProps {
  transaction: ActiveTransaction;
  className?: string;
}

/** 取得交易階段顯示名稱 */
function getStageLabel(stage: ActiveTransaction['stage']): string {
  switch (stage) {
    case 'negotiation':
      return '斡旋階段';
    case 'contract':
      return '簽約階段';
    case 'loan':
      return '貸款階段';
    case 'closing':
      return '交屋階段';
    default:
      return '進行中';
  }
}

export const TxBanner = memo(function TxBanner({
  transaction,
  className = '',
}: TxBannerProps) {
  if (!transaction.hasActive) {
    return null;
  }

  const stageLabel = getStageLabel(transaction.stage);

  return (
    <div
      className={`mx-4 flex items-center gap-3 rounded-xl border border-cyan-300 bg-gradient-to-r from-cyan-50 to-cyan-100 p-3 shadow-sm ${className}`}
      role="region"
      aria-label={S.TITLE}
    >
      {/* Icon */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-xl shadow-sm">
        <Home className="size-5 text-cyan-600" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-cyan-800">{S.TITLE}</p>
        <p className="truncate text-xs text-cyan-700">
          {transaction.propertyName || '物件'}
          <span className="mx-1">·</span>
          {stageLabel}
        </p>
      </div>

      {/* Action */}
      <a
        href={ROUTES.ASSURE}
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-cyan-700 active:scale-95"
      >
        {S.ENTER_BTN}
        <ChevronRight size={14} />
      </a>
    </div>
  );
});

export default TxBanner;
