import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ConversationListItem } from '../../types/messaging.types';
import { ROUTES } from '../../constants/routes';

const MS_PER_MINUTE = 60000;

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / MS_PER_MINUTE);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '剛剛';
  if (diffMins < 60) return `${diffMins}分鐘前`;
  if (diffHours < 24) return `${diffHours}小時前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return time.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

function getStatusLabel(status: ConversationListItem['status']): {
  text: string;
  color: string;
} {
  switch (status) {
    case 'pending':
      return { text: '等待回覆', color: 'text-amber-600 bg-amber-50' };
    case 'active':
      return { text: '對話中', color: 'text-green-600 bg-green-50' };
    case 'closed':
      return { text: '已結束', color: 'text-gray-500 bg-gray-100' };
    default:
      return { text: '未知', color: 'text-gray-500 bg-gray-100' };
  }
}

export const ConversationItem = memo(function ConversationItem({
  conv,
}: {
  conv: ConversationListItem;
}) {
  const statusInfo = getStatusLabel(conv.status);
  const timeLabel = conv.last_message ? formatRelativeTime(conv.last_message.created_at) : '';

  return (
    <Link
      to={ROUTES.CHAT(conv.id)}
      className="group flex min-h-[44px] items-center gap-2 rounded-lg p-2 text-[13px] transition-colors hover:bg-gray-50 hover:shadow-sm"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
        {conv.counterpart.name.slice(0, 1)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium text-gray-900">{conv.counterpart.name}</span>
          {conv.unread_count > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {conv.unread_count > 9 ? '9+' : conv.unread_count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <span className="truncate">{conv.property?.title || '物件諮詢'}</span>
          <span>·</span>
          <span className={`rounded px-1 py-0.5 text-[10px] ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 text-[10px] text-gray-400">
        {timeLabel && <span>{timeLabel}</span>}
        <ChevronRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
});
