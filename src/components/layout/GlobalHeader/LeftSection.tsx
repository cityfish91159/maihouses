/**
 * LeftSection Component
 *
 * GlobalHeader 左側區域（Logo + 房仲徽章）
 */

import { Logo } from '../../Logo/Logo';
import { HEADER_STRINGS, GlobalHeaderMode } from '../../../constants/header';
import { ROUTES } from '../../../constants/routes';

interface LeftSectionProps {
  mode: GlobalHeaderMode;
}

export function LeftSection({ mode }: LeftSectionProps) {
  return (
    <div className="flex items-center gap-2">
      <Logo showSlogan={false} href={ROUTES.HOME} showBadge={true} />
      {mode === 'agent' && (
        <span className="rounded bg-gradient-to-br from-amber-400 to-amber-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
          {HEADER_STRINGS.AGENT_BADGE}
        </span>
      )}
    </div>
  );
}
