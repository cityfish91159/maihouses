/**
 * MSG-5: AgentConversationList
 * 
 * 房仲側欄的客戶對話列表
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ChevronRight } from 'lucide-react';
import type { ConversationListItem } from '../../types/messaging.types';
import { ROUTES } from '../../constants/routes';

interface AgentConversationListProps {
  conversations: ConversationListItem[];
  className?: string;
}

/**
 * 格式化相對時間
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '剛剛';
  if (diffMins < 60) return `${diffMins}分鐘前`;
  if (diffHours < 24) return `${diffHours}小時前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return time.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

/**
 * 取得狀態標籤
 */
function getStatusLabel(status: ConversationListItem['status']): { text: string; color: string } {
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

export function AgentConversationList({
  conversations,
  className = '',
}: AgentConversationListProps): React.ReactElement {
  if (conversations.length === 0) {
    return (
      <div className={`rounded-[14px] border border-brand-100 bg-white p-[14px] shadow-card ${className}`}>
        <div className="mb-2.5 flex items-center gap-2">
          <MessageCircle className="size-4 text-brand-600" />
          <h4 className="m-0 text-[14px] font-bold text-brand-700">我的客戶</h4>
        </div>
        <p className="text-xs text-gray-400">尚無客戶對話</p>
      </div>
    );
  }

  return (
    <div className={`rounded-[14px] border border-brand-100 bg-white p-[14px] shadow-card ${className}`}>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-brand-600" />
          <h4 className="m-0 text-[14px] font-bold text-brand-700">我的客戶</h4>
        </div>
        {conversations.length > 0 && (
          <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-600">
            {conversations.length}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {conversations.slice(0, 5).map((conv) => {
          const statusInfo = getStatusLabel(conv.status);
          const timeLabel = conv.last_message
            ? formatRelativeTime(conv.last_message.created_at)
            : '';

          return (
            <Link
              key={conv.id}
              to={ROUTES.CHAT(conv.id)}
              className="group flex items-center gap-2 rounded-lg p-2 text-[13px] transition-colors hover:bg-gray-50"
            >
              {/* Avatar */}
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-600">
                {conv.counterpart.name.slice(0, 1)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium text-gray-900">
                    {conv.counterpart.name}
                  </span>
                  {conv.unread_count > 0 && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <span className="truncate">
                    {conv.property?.title || '物件諮詢'}
                  </span>
                  <span>·</span>
                  <span className={`rounded px-1 py-0.5 text-[10px] ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>
              </div>

              {/* Time & Arrow */}
              <div className="flex shrink-0 items-center gap-1 text-[10px] text-gray-400">
                {timeLabel && <span>{timeLabel}</span>}
                <ChevronRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          );
        })}

        {conversations.length > 5 && (
          <Link
            to={`${ROUTES.FEED_AGENT}#conversations`}
            className="mt-1 text-center text-[12px] text-brand-600 hover:underline"
          >
            查看全部 {conversations.length} 位客戶
          </Link>
        )}
      </div>
    </div>
  );
}

export default AgentConversationList;
