/**
 * NotificationButton Component
 *
 * GlobalHeader 的通知按鈕子組件
 */

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { HEADER_STRINGS } from '../../../constants/header';
import { MESSAGING_CONFIG } from '../../../constants/messaging';
import { NotificationDropdown } from '../NotificationDropdown';
import { NotificationErrorBoundary } from '../NotificationErrorBoundary';
import type { ConversationListItem } from '../../../types/messaging.types';

interface NotificationButtonProps {
  notificationCount: number;
  notifications: ConversationListItem[];
  isLoading: boolean;
  isStale: boolean;
  onNotificationClick: (conversationId: string) => void;
  onRefresh: () => void;
}

export function NotificationButton({
  notificationCount,
  notifications,
  isLoading,
  isStale,
  onNotificationClick,
  onRefresh,
}: NotificationButtonProps) {
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);

  // 點擊外部關閉選單
  useEffect(() => {
    if (!notificationMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      if (
        !target.closest('#gh-notification-btn') &&
        !target.closest('#gh-notification-dropdown')
      ) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [notificationMenuOpen]);

  return (
    <div className="relative">
      <button
        id="gh-notification-btn"
        onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
        className="relative inline-flex items-center justify-center rounded-xl border border-brand-100 bg-white p-2 text-brand-700 transition-all hover:bg-brand-50 active:scale-95"
        aria-label={HEADER_STRINGS.LABEL_NOTIFICATIONS}
        aria-expanded={notificationMenuOpen}
      >
        <Bell size={18} strokeWidth={2.5} />
        {notificationCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-600 text-[10px] font-bold text-white shadow-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            {notificationCount > MESSAGING_CONFIG.UNREAD_BADGE_MAX
              ? `${MESSAGING_CONFIG.UNREAD_BADGE_MAX}+`
              : notificationCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {notificationMenuOpen && (
        <div id="gh-notification-dropdown">
          <NotificationErrorBoundary onClose={() => setNotificationMenuOpen(false)}>
            <NotificationDropdown
              notifications={notifications}
              isLoading={isLoading}
              isStale={isStale}
              onClose={() => setNotificationMenuOpen(false)}
              onNotificationClick={onNotificationClick}
              onRefresh={onRefresh}
            />
          </NotificationErrorBoundary>
        </div>
      )}
    </div>
  );
}
