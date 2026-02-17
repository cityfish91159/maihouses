/**
 * BottomCTA Component
 *
 * 底部 CTA 區塊
 */

import { useCallback } from 'react';
import type { PageMode } from '../../../hooks/usePageMode';
import { notify } from '../../../lib/notify';
import { getCurrentPath, navigateToAuth } from '../../../lib/authUtils';
import type { Role } from '../types';
import { getPermissions } from '../types';
import { canPerformAction } from '../lib';

interface BottomCTAProps {
  viewerRole: Role;
  mode: PageMode;
}

export function BottomCTA({ viewerRole, mode }: BottomCTAProps) {
  const perm = getPermissions(viewerRole);
  const isMember = perm.isMember;

  const handleSignupClick = useCallback(() => {
    if (mode === 'demo') {
      notify.info('示範模式提示', '示範模式不會導向註冊頁，請切換正式模式後再註冊。');
      return;
    }

    navigateToAuth('signup', getCurrentPath());
  }, [mode]);

  // 住戶與房仲已可查看完整內容，不顯示 CTA。
  if (canPerformAction(perm, 'view_private')) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-overlay flex items-center justify-center gap-3 border-t border-[var(--border)] bg-[rgba(255,255,255,0.95)] px-4 py-3 backdrop-blur-md">
      <p className="text-xs text-[var(--text-secondary)]">
        {isMember ? '驗證住戶身分，解鎖私密版' : '免費註冊查看完整社區牆'}
      </p>
      <button
        type="button"
        onClick={handleSignupClick}
        className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[#005282] px-5 py-2.5 text-[13px] font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isMember ? '驗證住戶' : '免費註冊'}
      </button>
    </div>
  );
}
