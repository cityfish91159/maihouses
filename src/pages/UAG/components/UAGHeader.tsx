import React, { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, LogOut } from "lucide-react";
// import { useNotifications } from '../../../hooks/useNotifications';
// import { useNotificationDropdown } from '../../../hooks/useNotificationDropdown';
// import { NotificationBell } from '../../../components/common/NotificationBell';
// import { NotificationDropdown } from '../../../components/layout/NotificationDropdown';
// import { NotificationErrorBoundary } from '../../../components/layout/NotificationErrorBoundary';
import { Logo } from "../../../components/Logo/Logo";
import { ROUTES } from "../../../constants/routes";
import styles from "../UAG.module.css";
import type { AgentProfile } from "../types/uag.types";

interface UAGHeaderProps {
  user?: User | null;
  agentProfile?: AgentProfile | null;
  isLoading?: boolean;
  error?: Error | null;
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
}

const HeaderSkeleton = () => (
  <header className={styles["uag-header"]}>
    <div
      className={`${styles["uag-header-inner"]} ${styles["uag-header-skeleton"]}`}
    >
      <div className={styles["uag-skeleton-block"]} />
      <div className={styles["uag-skeleton-block"]} />
      <div className={styles["uag-skeleton-block"]} />
    </div>
  </header>
);

const HeaderError = () => (
  <header className={styles["uag-header"]}>
    <div
      className={`${styles["uag-header-inner"]} ${styles["uag-header-error"]}`}
    >
      <span>Header 載入失敗，請稍後再試</span>
      <a
        href={ROUTES.HOME}
        className={styles["uag-home-link"]}
        aria-label="返回邁房子首頁"
      >
        返回首頁
      </a>
    </div>
  </header>
);

export const UAGHeader: React.FC<UAGHeaderProps> = ({
  user,
  agentProfile,
  isLoading = false,
  error = null,
  onSignOut,
  isSigningOut = false,
}) => {
  // const { count, notifications, isLoading: notificationsLoading, error: notificationsError, isStale, refresh } = useNotifications();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  // 使用共用 Hook 管理通知下拉選單
  // const {
  //   isOpen: notificationMenuOpen,
  //   toggle: toggleNotificationMenu,
  //   close: closeNotificationMenu,
  //   triggerRef: notificationTriggerRef,
  //   dropdownRef: notificationDropdownRef,
  // } = useNotificationDropdown();

  // 點擊外部關閉用戶選單（通知選單由 Hook 處理）
  // ⚠️ useEffect 必須在所有 early return 之前調用
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest("#uag-user-menu-btn") &&
        !target.closest("#uag-user-menu-dropdown")
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (error) return <HeaderError />;
  if (isLoading) return <HeaderSkeleton />;

  const displayName =
    agentProfile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "訪客";
  const email = user?.email ?? null;
  const company = agentProfile?.company ?? null;

  const handleUserMenuKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setUserMenuOpen((prev) => !prev);
    }
  };

  const handleNotificationClick = (conversationId: string) => {
    // closeNotificationMenu();
    window.location.href = ROUTES.CHAT(conversationId);
  };

  const handleSignOutClick = async () => {
    setUserMenuOpen(false);
    await onSignOut?.();
  };

  // 從 AgentProfile 取得統計數據
  const trustScore = agentProfile?.trustScore ?? 80;
  const visitCount = agentProfile?.visitCount ?? 0;
  const dealCount = agentProfile?.dealCount ?? 0;
  const internalCode = agentProfile?.internalCode;

  return (
    <header className={styles["uag-header"]}>
      <div className={styles["uag-header-inner"]}>
        <Logo showSlogan={false} showBadge={true} href={ROUTES.HOME} />
        <div className={styles["uag-breadcrumb"]}>
          <span>UAG 客戶雷達</span>
          {company && <span className={styles["uag-company"]}>{company}</span>}
          <span
            className={`${styles["uag-badge"]} ${styles["uag-badge--pro"]}`}
          >
            專業版 PRO
          </span>
        </div>
        <div className={styles["uag-header-actions"]}>
          <div className={styles["uag-notification"]}>
            {/* Notification components temporarily disabled due to missing files */}
            {/* <NotificationBell
              ref={notificationTriggerRef}
              unreadCount={count}
              isLoading={notificationsLoading}
              hasError={!!notificationsError}
              isOpen={notificationMenuOpen}
              onClick={toggleNotificationMenu}
              ariaLabel="通知"
              className={styles['uag-notification-btn'] || ''}
            />

            {notificationMenuOpen && (
              <div ref={notificationDropdownRef}>
                <NotificationErrorBoundary onClose={closeNotificationMenu}>
                  <NotificationDropdown
                    notifications={notifications}
                    isLoading={notificationsLoading}
                    isStale={isStale}
                    onClose={closeNotificationMenu}
                    onNotificationClick={handleNotificationClick}
                    onRefresh={refresh}
                  />
                </NotificationErrorBoundary>
              </div>
            )} */}
          </div>
          {user && (
            <div className={styles["uag-user"]}>
              <button
                ref={userMenuButtonRef}
                id="uag-user-menu-btn"
                className={styles["uag-user-button"]}
                onClick={() => setUserMenuOpen((prev) => !prev)}
                onKeyDown={handleUserMenuKeyDown}
                aria-label={`用戶選單：${displayName}`}
                aria-expanded={userMenuOpen}
              >
                <div
                  className={styles["uag-user-avatar"]}
                  aria-label={`用戶頭像：${displayName}`}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className={styles["uag-user-info"]}>
                  <span className={styles["uag-user-name"]}>{displayName}</span>
                  {email && (
                    <span className={styles["uag-user-email"]}>{email}</span>
                  )}
                </div>
                <ChevronDown size={14} className={styles["uag-user-chevron"]} />
              </button>

              {userMenuOpen && (
                <div
                  id="uag-user-menu-dropdown"
                  className={styles["uag-user-menu"]}
                  role="menu"
                >
                  <div className={styles["uag-user-menu-meta"]}>
                    <span className={styles["uag-user-menu-name"]}>
                      {displayName}
                    </span>
                    {email && (
                      <span className={styles["uag-user-menu-email"]}>
                        {email}
                      </span>
                    )}
                  </div>
                  <div className={styles["uag-user-menu-divider"]} />
                  <button
                    className={styles["uag-user-menu-item"]}
                    role="menuitem"
                    onClick={handleSignOutClick}
                    disabled={isSigningOut}
                    aria-label={isSigningOut ? "正在登出" : "登出"}
                  >
                    <LogOut size={16} />
                    {isSigningOut ? "登出中..." : "登出"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 房仲資訊條：只要有 agentProfile 就顯示（支援 mock 模式） */}
      {agentProfile && (
        <div className={styles["agent-bar"]}>
          <div className={styles["agent-bar-avatar"]}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className={styles["agent-bar-info"]}>
            <div className={styles["agent-bar-name-row"]}>
              <span>{displayName}</span>
              {internalCode && (
                <span className={styles["agent-bar-code"]}>
                  #{internalCode}
                </span>
              )}
            </div>
            <div className={styles["agent-bar-stats"]}>
              <span
                className={`${styles["agent-bar-stat"]} ${styles["trust"]}`}
              >
                <strong>{trustScore}</strong> 信任分
              </span>
              <span className={styles["agent-bar-stat"]}>
                <strong>{visitCount}</strong> 帶看
              </span>
              <span className={styles["agent-bar-stat"]}>
                <strong>{dealCount}</strong> 成交
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
