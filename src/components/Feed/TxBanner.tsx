/**
 * TxBanner Component
 *
 * 進行中交易橫幅 / 私訊提醒橫幅
 * MSG-3: 擴展支援私訊通知，優先級高於交易橫幅
 */

import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MessageCircle, ChevronRight } from 'lucide-react';
import type { ActiveTransaction } from '../../types/feed';
import type { ConversationListItem } from '../../types/messaging.types';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';
import { logger } from '../../lib/logger';

const S_TX = STRINGS.FEED.TX_BANNER;
const S_MSG = STRINGS.FEED.MSG_BANNER;

// MSG-3: 擴展 Props 支援交易或私訊兩種模式
interface TxBannerProps {
  transaction: ActiveTransaction;
  messageNotification?: ConversationListItem | null;
  className?: string;
}

/**
 * 取得交易階段顯示名稱
 * @param stage - 交易階段
 * @returns 階段的中文顯示名稱
 */
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
 *
 * @param timestamp - ISO 8601 時間戳字串
 * @returns 相對時間字串（剛剛、5分鐘前、1小時前、3天前 等）
 *
 * @example
 * formatRelativeTime('2026-01-02T10:00:00Z') // '5 分鐘前'
 * formatRelativeTime('invalid') // '時間未知'
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);

  // 驗證日期有效性
  if (isNaN(time.getTime())) {
    logger.warn('TxBanner.formatRelativeTime.invalidTimestamp', { timestamp });
    return '時間未知';
  }

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
 * 截斷過長的名字
 * @param name - 原始名字
 * @param maxLength - 最大長度（預設 12）
 * @returns 截斷後的名字（如果超過長度會加上 ...）
 */
function truncateName(name: string, maxLength = 12): string {
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength)}...`;
}

/**
 * TxBanner 組件
 *
 * 顯示進行中的交易或未讀私訊通知的橫幅
 * 優先級：私訊通知 > 交易橫幅
 */
export const TxBanner = memo(function TxBanner({
  transaction,
  messageNotification,
  className = '',
}: TxBannerProps) {
  const navigate = useNavigate();
  // MSG-3: 私訊優先級高於交易
  // 使用 useMemo 優化性能，只在相關資料變化時重新計算
  const messageContent = useMemo(() => {
    if (!messageNotification) return null;

    // 使用 optional chaining 確保類型安全
    const timeLabel = messageNotification.last_message?.created_at
      ? formatRelativeTime(messageNotification.last_message.created_at)
      : '';

    // 截斷過長的名字
    const displayName = truncateName(messageNotification.counterpart.name);

    return {
      conversationId: messageNotification.id,
      propertyTitle: messageNotification.property?.title || S_MSG.PROPERTY_FALLBACK,
      counterpartName: displayName,
      timeLabel,
    };
  }, [messageNotification]);

  if (messageContent) {
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
            <p className="text-brand-800 text-sm font-bold">{S_MSG.TITLE}</p>
            <p className="truncate text-xs text-brand-700">
              {messageContent.propertyTitle}
              <span className="mx-1">·</span>
              {messageContent.counterpartName}
              {messageContent.timeLabel && (
                <>
                  <span className="mx-1">·</span>
                  {messageContent.timeLabel}
                </>
              )}
            </p>
          </div>

          {/* Action - 導航至對話頁面 */}
          <button
            type="button"
            onClick={() => navigate(`/maihouses/chat/${messageContent.conversationId}`)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95"
            aria-label="查看房仲私訊"
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
        aria-label="進入交易戰情室"
      >
        {S_TX.ENTER_BTN}
        <ChevronRight size={14} />
      </a>
    </div>
    </div>
  );
});

export default TxBanner;
