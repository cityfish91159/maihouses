/**
 * VersionBadge
 *
 * 顯示目前部署版本與建置時間，方便 QA 追蹤環境。
 */

import { APP_VERSION, BUILD_TIME_TW, VERSION_LABEL, VERSION_TOOLTIP } from '../../../lib/version';

interface VersionBadgeProps {
  variant?: 'floating' | 'inline';
  className?: string;
}

const baseClasses = 'inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/90 px-4 py-2 text-[11px] font-medium text-ink-600 shadow-md backdrop-blur';

export function VersionBadge({ variant = 'floating', className = '' }: VersionBadgeProps) {
  const content = (
    <>
      <span className="uppercase tracking-wider text-[10px] text-ink-400">版本</span>
      <span className="font-mono text-sm text-ink-900" aria-label="build-version">
        {VERSION_LABEL}
      </span>
      <span className="text-[10px] text-ink-500" aria-label="build-time">
        {BUILD_TIME_TW}
      </span>
    </>
  );

  if (variant === 'inline') {
    return (
      <div className={`${baseClasses} ${className}`} title={VERSION_TOOLTIP}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} pointer-events-auto fixed bottom-5 right-5 z-40 ${className}`}
      title={VERSION_TOOLTIP}
    >
      {content}
    </div>
  );
}
