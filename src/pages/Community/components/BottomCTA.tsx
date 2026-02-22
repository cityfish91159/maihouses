/**
 * BottomCTA Component
 *
 * 底部 CTA 區塊
 */

import { useCallback } from 'react';
import { notify } from '../../../lib/notify';
import { getCurrentPath, navigateToAuth } from '../../../lib/authUtils';
import { useModeAwareAction } from '../../../hooks/useModeAwareAction';
import type { Role } from '../types';
import { getPermissions } from '../types';
import { canPerformAction } from '../lib';

interface BottomCTAProps {
  viewerRole: Role;
}

const DEMO_SIGNUP_GUIDE_TITLE = '示範模式提示';
const DEMO_SIGNUP_GUIDE_DESCRIPTION = '示範模式不會導向註冊頁，請切換正式模式後再註冊。';
const SIGNUP_ACTION_ERROR_TITLE = '操作失敗';

export function BottomCTA({ viewerRole }: BottomCTAProps) {
  const perm = getPermissions(viewerRole);
  const isMember = perm.isMember;

  const navigateToSignup = useCallback((_payload: undefined) => {
    navigateToAuth('signup', getCurrentPath());
  }, []);

  const showDemoSignupGuide = useCallback((_payload: undefined) => {
    notify.info(DEMO_SIGNUP_GUIDE_TITLE, DEMO_SIGNUP_GUIDE_DESCRIPTION);
  }, []);

  const dispatchSignup = useModeAwareAction<undefined>({
    visitor: navigateToSignup,
    demo: showDemoSignupGuide,
    live: navigateToSignup,
  });

  const handleSignupClick = useCallback(() => {
    void dispatchSignup(undefined).then((result) => {
      if (!result.ok) {
        notify.error(SIGNUP_ACTION_ERROR_TITLE, result.error);
      }
    });
  }, [dispatchSignup]);

  // 住戶與房仲已可查看完整內容，不顯示 CTA。
  if (canPerformAction(perm, 'view_private')) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-overlay flex items-center justify-center gap-3 border-t border-[var(--border)] bg-white/95 px-4 py-3 backdrop-blur-md">
      <p className="text-xs text-[var(--text-secondary)]">
        {isMember ? '驗證住戶身分，解鎖私密版' : '免費註冊查看完整社區牆'}
      </p>
      <button
        type="button"
        onClick={handleSignupClick}
        className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] px-5 py-2.5 text-[13px] font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:brightness-90"
      >
        {isMember ? '驗證住戶' : '免費註冊'}
      </button>
    </div>
  );
}
