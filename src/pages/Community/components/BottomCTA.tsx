/**
 * BottomCTA Component
 *
 * 底部 CTA 區塊
 */

import type { Role } from '../types';
import { getPermissions } from '../types';
import { canPerformAction } from '../lib';

interface BottomCTAProps {
  viewerRole: Role;
}

// AUDIT-01 Phase 7: 使用統一權限檢查函數
export function BottomCTA({ viewerRole }: BottomCTAProps) {
  const perm = getPermissions(viewerRole);

  // 住戶和房仲不顯示 CTA（他們已有私密牆存取權限）
  if (canPerformAction(perm, 'view_private')) return null;

  // 根據身份決定顯示內容
  const isGuest = perm.isGuest;
  const isMember = perm.isMember;

  return (
    <div className="fixed inset-x-0 bottom-0 z-overlay flex items-center justify-center gap-3 border-t border-[var(--border)] bg-[rgba(255,255,255,0.95)] px-4 py-3 backdrop-blur-md">
      <p className="text-xs text-[var(--text-secondary)]">
        {isMember ? '🏠 驗證住戶身份，解鎖私密牆' : '🔓 登入解鎖完整評價 + 更多功能'}
      </p>
      <button
        onClick={() => (window.location.href = '/maihouses/auth.html')}
        className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[#005282] px-5 py-2.5 text-[13px] font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isMember ? '驗證住戶' : '免費註冊'}
      </button>
    </div>
  );
}
