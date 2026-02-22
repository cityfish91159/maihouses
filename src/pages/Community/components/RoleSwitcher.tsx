/**
 * RoleSwitcher Component
 *
 * 身份切換器（Mock 測試用）
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { User, Users, Home, Building, Shield, Key, Glasses, ChevronDown } from 'lucide-react';
import type { Role } from '../types';

interface RoleSwitcherProps {
  role: Role;
  onRoleChange: (role: Role) => void;
}

const roleNames: Record<Role, string> = {
  guest: '訪客模式',
  member: '會員模式',
  resident: '住戶模式',
  agent: '房仲模式',
  official: '官方模式',
  admin: '管理員',
};

const roleIcons: Record<Role, ReactNode> = {
  guest: <User size={14} aria-hidden="true" />,
  member: <Users size={14} aria-hidden="true" />,
  resident: <Home size={14} aria-hidden="true" />,
  agent: <Building size={14} aria-hidden="true" />,
  official: <Shield size={14} aria-hidden="true" />,
  admin: <Key size={14} aria-hidden="true" />,
};

const roleLabelTexts: Record<Role, string> = {
  guest: '訪客（未登入）',
  member: '一般會員',
  resident: '已驗證住戶',
  agent: '認證房仲',
  official: '官方代表',
  admin: '系統管理員',
};

export function RoleSwitcher({ role, onRoleChange }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[1000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--mh-color-1a1a2e)] to-[var(--mh-color-16213e)] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_20px_var(--mh-shadow-overlay)]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`目前身份：${roleNames[role]}，點擊切換`}
      >
        <Glasses size={14} aria-hidden="true" /> <span>{roleNames[role]}</span> <ChevronDown size={12} aria-hidden="true" />
      </button>
      {isOpen && (
        <div
          className="absolute bottom-[50px] right-0 min-w-[180px] rounded-xl border border-[var(--border)] bg-white p-2 shadow-[0_8px_30px_var(--mh-shadow-dropdown)]"
          role="listbox"
          aria-label="選擇身份"
        >
          {/* [NASA TypeScript Safety] 定義具體的 role 陣列避免 as Role[] */}
          {(['guest', 'member', 'resident', 'agent', 'official', 'admin'] satisfies Role[]).map(
            (r) => (
              <button
                key={r}
                role="option"
                aria-selected={role === r}
                onClick={() => {
                  onRoleChange(r);
                  setIsOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-2.5 text-left text-xs ${role === r ? 'bg-brand-700/10 font-bold text-[var(--primary)]' : 'text-[var(--text-primary)] hover:bg-[var(--mh-color-f6f9ff)]'}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {roleIcons[r]}
                  {roleLabelTexts[r]}
                </span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
