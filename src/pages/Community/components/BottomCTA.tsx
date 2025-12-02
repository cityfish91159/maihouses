/**
 * BottomCTA Component
 * 
 * 底部 CTA 區塊
 */

import type { Role } from '../types';
import { getPermissions } from '../types';

interface BottomCTAProps {
  role: Role;
}

export function BottomCTA({ role }: BottomCTAProps) {
  const perm = getPermissions(role);

  // 住戶和房仲不顯示 CTA
  if (perm.canAccessPrivate) return null;

  // 根據身份決定顯示內容
  const isGuest = perm.isGuest;
  const isMember = perm.isMember;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 border-t border-[var(--border)] bg-[rgba(255,255,255,0.95)] px-4 py-3 backdrop-blur-[12px]">
      <p className="text-xs text-[var(--text-secondary)]">
        {isMember ? '🏠 驗證住戶身份，解鎖私密牆' : '🔓 登入解鎖完整評價 + 更多功能'}
      </p>
      <button className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[#005282] px-5 py-2.5 text-[13px] font-bold text-white">
        {isMember ? '驗證住戶' : '免費註冊'}
      </button>
    </div>
  );
}
