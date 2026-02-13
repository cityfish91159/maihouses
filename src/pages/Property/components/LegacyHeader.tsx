/**
 * LegacyHeader Component
 *
 * PropertyListPage 的 Legacy 風格頁首
 * 使用共用 Logo 元件（含紅點徽章）
 */

import { Logo } from '../../../components/Logo/Logo';
import { getLoginUrl, getCurrentPath } from '../../../lib/authUtils';

export function LegacyHeader() {
  const loginUrl = getLoginUrl(getCurrentPath());

  return (
    <header className="legacy-header">
      <Logo showSlogan={true} showBadge={true} />
      <a href={loginUrl} className="auth-btn no-underline">
        登入/註冊
      </a>
    </header>
  );
}
