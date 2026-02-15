/**
 * UserMenu Component
 *
 * GlobalHeader 的使用者選單子組件
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { notify } from '../../../lib/notify';
import { logger } from '../../../lib/logger';
import { HEADER_STRINGS } from '../../../constants/header';
import { ROUTES, RouteUtils } from '../../../constants/routes';
import type { Role } from '../../../types/community';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserMenuProps {
  user: SupabaseUser | null;
  role: Role | undefined;
  signOut: () => Promise<void>;
}

/** 取得角色標籤文字（使用 Early Return Pattern） */
const getRoleLabel = (role: Role | undefined): string => {
  if (role === 'resident') return HEADER_STRINGS.ROLE_RESIDENT;
  if (role === 'agent') return HEADER_STRINGS.ROLE_AGENT;
  if (role === 'official') return HEADER_STRINGS.ROLE_OFFICIAL;
  if (role === 'guest') return HEADER_STRINGS.ROLE_GUEST;
  return HEADER_STRINGS.ROLE_MEMBER;
};

export function UserMenu({ user, role, signOut }: UserMenuProps) {
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 處理登出
  const handleSignOut = async () => {
    try {
      await signOut();
      notify.success(HEADER_STRINGS.MSG_LOGOUT_SUCCESS, HEADER_STRINGS.MSG_LOGOUT_DESC);
      setUserMenuOpen(false);
      navigate(RouteUtils.toNavigatePath(ROUTES.HOME));
    } catch (error) {
      logger.error('UserMenu.handleSignOut.failed', {
        error,
        userId: user?.id,
      });
      notify.error(HEADER_STRINGS.MSG_LOGOUT_ERROR, HEADER_STRINGS.MSG_LOGOUT_RETRY);
    }
  };

  // 點擊外部關閉選單
  useEffect(() => {
    if (!userMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      if (!target.closest('#gh-user-menu-btn') && !target.closest('#gh-user-menu-dropdown')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  return (
    <div className="relative">
      <button
        id="gh-user-menu-btn"
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="flex items-center gap-1.5 rounded-xl border border-brand-100 bg-white py-1 pl-1 pr-2.5 transition-all hover:bg-brand-50 hover:shadow-sm active:scale-95"
        aria-label={HEADER_STRINGS.LABEL_AVATAR}
        aria-expanded={userMenuOpen}
      >
        <div className="flex size-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="hidden max-w-[80px] truncate text-xs font-bold text-brand-700 md:block">
          {user?.user_metadata?.name || '我的'}
        </span>
        <ChevronDown
          size={14}
          className={clsx('text-brand-400 transition-transform', userMenuOpen && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {userMenuOpen && (
        <div
          id="gh-user-menu-dropdown"
          className="animate-in fade-in zoom-in-95 absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl border border-brand-100 bg-white p-1 shadow-xl ring-1 ring-black/5 duration-100 focus:outline-none"
          role="menu"
        >
          <div className="mb-1 border-b border-gray-50 px-3 py-2">
            <p className="text-brand-900 truncate text-xs font-bold">{user?.email}</p>
            <p className="text-[10px] text-gray-500">{getRoleLabel(role)}</p>
          </div>

          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
            role="menuitem"
            onClick={() => {
              navigate(RouteUtils.toNavigatePath(ROUTES.HOME));
              setUserMenuOpen(false);
            }}
          >
            <User size={16} />
            {HEADER_STRINGS.MENU_PROFILE}
          </button>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
            role="menuitem"
          >
            <LogOut size={16} />
            {HEADER_STRINGS.BTN_LOGOUT}
          </button>
        </div>
      )}
    </div>
  );
}
