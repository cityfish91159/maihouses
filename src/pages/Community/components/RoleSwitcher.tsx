/**
 * RoleSwitcher Component
 * 
 * 身份切換器（Mock 測試用）
 */

import { useState } from 'react';
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

const roleLabels: Record<Role, string> = {
  guest: '👤 訪客（未登入）',
  member: '👥 一般會員',
  resident: '🏠 已驗證住戶',
  agent: '🏢 認證房仲',
  official: '⚖️ 官方代表',
  admin: '🔑 系統管理員',
};

export function RoleSwitcher({ role, onRoleChange }: RoleSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[1000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`目前身份：${roleNames[role]}，點擊切換`}
      >
        🕶️ <span>{roleNames[role]}</span> ▾
      </button>
      {isOpen && (
        <div
          className="absolute bottom-[50px] right-0 min-w-[180px] rounded-xl border border-[var(--border)] bg-white p-2 shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
          role="listbox"
          aria-label="選擇身份"
        >
          {(Object.keys(roleLabels) as Role[]).map(r => (
            <button
              key={r}
              role="option"
              aria-selected={role === r}
              onClick={() => { onRoleChange(r); setIsOpen(false); }}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-xs ${role === r ? 'bg-brand-700/10 font-bold text-[var(--primary)]' : 'text-[var(--text-primary)] hover:bg-[#f6f9ff]'}`}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
