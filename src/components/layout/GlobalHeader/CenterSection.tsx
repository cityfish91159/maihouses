/**
 * CenterSection Component
 *
 * GlobalHeader 中間區域（社區牆標題）
 */

import { HEADER_STRINGS, GlobalHeaderMode } from '../../../constants/header';

interface CenterSectionProps {
  mode: GlobalHeaderMode;
  title?: string | undefined;
}

export function CenterSection({ mode, title }: CenterSectionProps) {
  if (mode === 'community' && title) {
    return (
      <div className="flex-1 text-center">
        <h1 className="text-brand-900 m-0 text-base font-extrabold">{title}</h1>
        <p className="text-ink-500 m-0 text-[11px]">{HEADER_STRINGS.SUBTITLE_WALL}</p>
      </div>
    );
  }
  return <div className="flex-1" />;
}
