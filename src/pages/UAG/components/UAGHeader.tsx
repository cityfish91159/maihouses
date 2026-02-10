import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  BadgeCheck,
  ChevronDown,
  Footprints,
  LogOut,
  ShieldCheck,
  ThumbsUp,
  User as UserIcon,
} from 'lucide-react';
import { Logo } from '../../../components/Logo/Logo';
import { ROUTES } from '../../../constants/routes';
import styles from '../UAG.module.css';
import type { AgentProfile } from '../types/uag.types';

interface UAGHeaderProps {
  user?: User | null;
  agentProfile?: AgentProfile | null;
  isLoading?: boolean;
  error?: Error | null;
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  useMock?: boolean;
}

const HeaderSkeleton = () => (
  <header className={styles['uag-header']}>
    <div className={`${styles['uag-header-inner']} ${styles['uag-header-skeleton']}`}>
      <div className={styles['uag-skeleton-block']} />
      <div className={styles['uag-skeleton-block']} />
      <div className={styles['uag-skeleton-block']} />
    </div>
  </header>
);

const HeaderError = () => (
  <header className={styles['uag-header']}>
    <div className={`${styles['uag-header-inner']} ${styles['uag-header-error']}`}>
      <span>Header 載入失敗，請稍後再試</span>
      <a href={ROUTES.HOME} className={styles['uag-home-link']} aria-label="返回邁房子首頁">
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
  useMock = false,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userMenuOpen) return;

    const handlePointerDownOutside = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest('#uag-user-menu-btn') && !target.closest('#uag-user-menu-dropdown')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [userMenuOpen]);

  const handleDropdownKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setUserMenuOpen(false);
      userMenuButtonRef.current?.focus();
      return;
    }

    if (e.key === 'Tab' && menuDropdownRef.current) {
      const focusable = menuDropdownRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a:not([disabled])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  if (error) return <HeaderError />;
  if (isLoading) return <HeaderSkeleton />;

  const displayName = useMock
    ? '游杰倫'
    : agentProfile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || '訪客';
  const email = useMock ? null : (user?.email ?? null);
  const company = agentProfile?.company ?? null;
  const showSignOut = Boolean(user);
  const profileHref = useMock ? `${ROUTES.UAG_PROFILE}?mock=true` : ROUTES.UAG_PROFILE;

  const handleUserMenuKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setUserMenuOpen((prev) => !prev);
    }
  };

  const handleSignOutClick = async () => {
    setUserMenuOpen(false);
    await onSignOut?.();
  };

  const trustScore = agentProfile?.trustScore ?? 80;
  const visitCount = agentProfile?.visitCount ?? 0;
  const dealCount = agentProfile?.dealCount ?? 0;
  const encouragementCount = agentProfile?.encouragementCount ?? 0;
  const internalCode = agentProfile?.internalCode;

  return (
    <header className={styles['uag-header']}>
      <div className={styles['uag-header-inner']}>
        <div className={styles['uag-logo-wrap']}>
          <Logo showSlogan={false} showBadge={true} href={ROUTES.HOME} />
        </div>
        <div className={styles['uag-breadcrumb']}>
          <span>UAG 客戶雷達</span>
          {company && <span className={styles['uag-company']}>{company}</span>}
          <span className={`${styles['uag-badge']} ${styles['uag-badge--pro']}`}>專業版 PRO</span>
        </div>
        <div className={styles['uag-header-actions']}>
          <div className={styles['uag-notification']} />

          {(user || useMock) && (
            <div className={styles['uag-user']}>
              <button
                ref={userMenuButtonRef}
                id="uag-user-menu-btn"
                className={styles['uag-user-button']}
                onClick={() => setUserMenuOpen((prev) => !prev)}
                onKeyDown={handleUserMenuKeyDown}
                aria-label={`用戶選單：${displayName}`}
                aria-haspopup="menu"
                aria-controls="uag-user-menu-dropdown"
                aria-expanded={userMenuOpen}
              >
                <div className={styles['uag-user-avatar']} aria-hidden="true">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className={styles['uag-user-info']}>
                  <span className={styles['uag-user-name']}>{displayName}</span>
                  {email && <span className={styles['uag-user-email']}>{email}</span>}
                </div>
                <ChevronDown size={14} className={styles['uag-user-chevron']} />
              </button>

              {userMenuOpen && (
                <div
                  ref={menuDropdownRef}
                  id="uag-user-menu-dropdown"
                  className={`${styles['uag-user-menu']} animate-in fade-in slide-in-from-top-2 duration-200`}
                  role="menu"
                  tabIndex={-1}
                  aria-hidden={!userMenuOpen}
                  onKeyDown={handleDropdownKeyDown}
                >
                  <div className={styles['uag-user-menu-meta']}>
                    <span className={styles['uag-user-menu-name']}>{displayName}</span>
                    {email && <span className={styles['uag-user-menu-email']}>{email}</span>}
                  </div>
                  <div className={styles['uag-user-menu-divider']} />
                  <button
                    className={styles['uag-user-menu-item']}
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      window.location.href = profileHref;
                    }}
                  >
                    <UserIcon size={16} />
                    個人資料
                  </button>
                  {showSignOut && (
                    <button
                      className={styles['uag-user-menu-item']}
                      role="menuitem"
                      onClick={handleSignOutClick}
                      disabled={isSigningOut}
                      aria-label={isSigningOut ? '正在登出' : '登出'}
                    >
                      <LogOut size={16} />
                      {isSigningOut ? '登出中...' : '登出'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {agentProfile && (
        <div className={styles['agent-kpi-wrap']}>
          <div className={styles['agent-kpi-header']}>
            <div className={styles['agent-kpi-avatar']} aria-hidden="true">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className={styles['agent-kpi-identity']}>
              <div className={styles['agent-kpi-name-row']}>
                <span>{displayName}</span>
                {internalCode !== undefined && (
                  <span className={styles['agent-kpi-code']}>#{internalCode}</span>
                )}
              </div>
              {company && <div className={styles['agent-kpi-company']}>{company}</div>}
            </div>
          </div>

          {/* 桌面版：橫向 inline 統計 */}
          <div className={styles['agent-kpi-inline']} aria-label="房仲關鍵指標（桌面版）">
            <span className={styles['agent-kpi-inline-item']}>
              <strong>{trustScore}</strong> 信任分
            </span>
            <span className={styles['agent-kpi-inline-item']}>
              <strong>{visitCount}</strong> 帶看組數
            </span>
            <span className={styles['agent-kpi-inline-item']}>
              <strong>{dealCount}</strong> 成交案件
            </span>
            <span className={styles['agent-kpi-inline-item']}>
              <strong>{encouragementCount}</strong> 獲得鼓勵
            </span>
          </div>

          {/* 手機版：2x2 KPI Grid */}
          <div className={styles['agent-kpi-grid']} role="list" aria-label="房仲關鍵指標">
            <div
              className={`${styles['agent-kpi-card']} ${styles['agent-kpi-card-trust']}`}
              role="listitem"
            >
              <ShieldCheck size={16} className={styles['agent-kpi-icon']} aria-hidden="true" />
              <span className={styles['agent-kpi-value']}>{trustScore}</span>
              <span className={styles['agent-kpi-label']}>信任分</span>
            </div>

            <div
              className={`${styles['agent-kpi-card']} ${styles['agent-kpi-card-visit']}`}
              role="listitem"
            >
              <Footprints size={16} className={styles['agent-kpi-icon']} aria-hidden="true" />
              <span className={styles['agent-kpi-value']}>{visitCount}</span>
              <span className={styles['agent-kpi-label']}>帶看組數</span>
            </div>

            <div
              className={`${styles['agent-kpi-card']} ${styles['agent-kpi-card-deal']}`}
              role="listitem"
            >
              <BadgeCheck size={16} className={styles['agent-kpi-icon']} aria-hidden="true" />
              <span className={styles['agent-kpi-value']}>{dealCount}</span>
              <span className={styles['agent-kpi-label']}>成交案件</span>
            </div>

            <div
              className={`${styles['agent-kpi-card']} ${styles['agent-kpi-card-encourage']}`}
              role="listitem"
            >
              <ThumbsUp size={16} className={styles['agent-kpi-icon']} aria-hidden="true" />
              <span className={styles['agent-kpi-value']}>{encouragementCount}</span>
              <span className={styles['agent-kpi-label']}>獲得鼓勵</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
