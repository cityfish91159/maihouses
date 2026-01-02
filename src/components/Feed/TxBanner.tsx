/**
 * TxBanner Component
 *
 * 進行中交易橫幅 / 私訊提醒橫幅
 * MSG-3: 擴展支援私訊通知，優先級高於交易橫幅
 */

import { memo } from 'react';
import { Home, MessageCircle, ChevronRight } from 'lucide-react';
import type { ActiveTransaction } from '../../types/feed';
import type { ConversationListItem } from '../../types/messaging.types';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';
import { notify } from '../../lib/notify';

const S_TX = STRINGS.FEED.TX_BANNER;
const S_MSG = STRINGS.FEED.MSG_BANNER;

// MSG-3: 擴展 Props 支援交易或私訊兩種模式
interface TxBannerProps {
  transaction: ActiveTransaction;
  messageNotification?: ConversationListItem | null;
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

/**
 * 格式化時間為相對時間
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '剛剛';
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return time.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

/**
 * MSG-3: 處理查看私訊點擊
 * 由於 MSG-4 尚未完成，點擊時顯示 toast 提示
 */
function handleMessageClick(e: React.MouseEvent<HTMLButtonElement>): void {
  e.preventDefault();
  notify.info(S_MSG.COMING_SOON, S_MSG.COMING_SOON_DESC);
}

export const TxBanner = memo(function TxBanner({
  transaction,
  messageNotification,
  className = '',
}: TxBannerProps) {
  // MSG-3: 私訊優先級高於交易
  if (messageNotification) {
    const timeLabel = messageNotification.last_message
      ? formatRelativeTime(messageNotification.last_message.created_at)
      : '';

    return (
      <div className={`mx-auto max-w-[1120px] px-4 ${className}`}>
        <div
          className="flex items-center gap-3 rounded-xl border border-brand-300 bg-gradient-to-r from-brand-50 to-brand-100 p-3 shadow-sm"
          role="region"
          aria-label={S_MSG.TITLE}
        >
          {/* Icon */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-xl shadow-sm">
            <MessageCircle className="size-5 text-brand-600" />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-800">{S_MSG.TITLE}</p>
            <p className="truncate text-xs text-brand-700">
              {messageNotification.property?.title || S_MSG.PROPERTY_FALLBACK}
              <span className="mx-1">·</span>
              {messageNotification.counterpart.name}
              {timeLabel && (
                <>
                  <span className="mx-1">·</span>
                  {timeLabel}
                </>
              )}
            </p>
          </div>

          {/* Action - MSG-4 未完成，使用 button + toast */}
          <button
            type="button"
            onClick={handleMessageClick}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95"
          >
            {S_MSG.VIEW_BTN}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // 原本的交易橫幅邏輯
  if (!transaction.hasActive) {
    return null;
  }

  const stageLabel = getStageLabel(transaction.stage);

  return (
    <div
      className={`mx-auto max-w-[1120px] px-4 ${className}`}
    >
    <div
      className="flex items-center gap-3 rounded-xl border border-cyan-300 bg-gradient-to-r from-cyan-50 to-cyan-100 p-3 shadow-sm"
      role="region"
      aria-label={S_TX.TITLE}
    >
      {/* Icon */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-xl shadow-sm">
        <Home className="size-5 text-cyan-600" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-cyan-800">{S_TX.TITLE}</p>
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
        {S_TX.ENTER_BTN}
        <ChevronRight size={14} />
      </a>
    </div>
    </div>
  );
});

export default TxBanner;
