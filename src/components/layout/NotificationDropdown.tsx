/**
 * NotificationDropdown Component
 *
 * MSG-2: 鈴鐺通知下拉選單
 * 顯示未讀私訊列表，點擊項目跳轉到對話頁面
 */

import { useRef, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import type { ConversationListItem } from '../../types/messaging.types';

interface NotificationDropdownProps {
  notifications: ConversationListItem[];
  isLoading: boolean;
  onClose: () => void;
  onNotificationClick: (conversationId: string) => void;
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
 * 訊息預覽截斷
 */
function truncateMessage(content: string, maxLength = 40): string {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength)}...`;
}

const MAX_NOTIFICATIONS_DISPLAY = 20; // 最多顯示 20 筆，防止 DOM 爆炸

export function NotificationDropdown({
  notifications,
  isLoading,
  onClose,
  onNotificationClick
}: NotificationDropdownProps) {
  // 限制顯示數量
  const displayNotifications = notifications.slice(0, MAX_NOTIFICATIONS_DISPLAY);
  const hasMore = notifications.length > MAX_NOTIFICATIONS_DISPLAY;

  // Focus 管理
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 初始 focus 到關閉按鈕 + 鍵盤事件處理
  useEffect(() => {
    closeButtonRef.current?.focus();

    // Escape 鍵關閉
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      role="presentation"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dropdownRef}
        className="animate-in fade-in zoom-in-95 absolute right-0 top-full mt-2 w-[380px] origin-top-right rounded-xl border border-brand-100 bg-white shadow-xl ring-1 ring-black/5 duration-100"
        role="dialog"
        aria-modal="true"
        aria-label="通知列表"
      >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
        <h3 className="text-brand-900 text-sm font-bold">私訊通知</h3>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="關閉"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          // Loading State
          <div className="p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-3 flex animate-pulse gap-3">
                <div className="size-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-brand-50 p-4">
              <MessageCircle size={32} className="text-brand-400" />
            </div>
            <h4 className="mb-1 text-sm font-bold text-gray-900">沒有新訊息</h4>
            <p className="text-xs text-gray-500">您目前沒有未讀的私訊</p>
          </div>
        ) : (
          // Notification List
          <div className="divide-y divide-gray-100">
            {displayNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => onNotificationClick(notification.id)}
                className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50"
                role="menuitem"
              >
                {/* Avatar */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {notification.counterpart.name.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  {/* Name & Property */}
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-brand-900 font-bold">
                      {notification.counterpart.name}
                    </span>
                    {notification.property && (
                      <span className="truncate text-xs text-gray-500">
                        · {notification.property.title}
                      </span>
                    )}
                  </div>

                  {/* Message Preview */}
                  {notification.last_message && (
                    <p className="mb-1 truncate text-sm text-gray-700">
                      {truncateMessage(notification.last_message.content)}
                    </p>
                  )}

                  {/* Time & Unread Badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {notification.last_message
                        ? formatRelativeTime(notification.last_message.created_at)
                        : '尚無訊息'}
                    </span>
                    {notification.unread_count > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                        {notification.unread_count > 99 ? '99+' : notification.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {hasMore && (
              <div className="px-4 py-3 text-center text-xs text-gray-500">
                還有 {notifications.length - MAX_NOTIFICATIONS_DISPLAY} 則未讀訊息
              </div>
            )}
          </div>
        )}
      </div>

        {/* Footer (Optional) */}
        {notifications.length > 0 && (
          <div className="border-t border-brand-100 px-4 py-2 text-center">
            <a
              href="/maihouses/chat"
              className="text-xs font-bold text-brand-700 hover:text-brand-600"
            >
              查看所有訊息
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
