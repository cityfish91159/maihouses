import { memo, type ReactNode } from 'react';
import type { Step } from '../../types/trust';
import { StepIcon } from './StepIcon';

interface StepCardProps {
  stepKey: string;
  step: Step;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  children: ReactNode;
}

export const StepCard = memo(function StepCard({
  stepKey,
  step,
  isCurrent,
  isPast,
  isFuture,
  children,
}: StepCardProps) {
  const getIconBgClass = (past: boolean, locked: boolean, current: boolean) => {
    if (past || locked) return 'bg-success border-success text-white';
    if (current) return 'bg-brand-700 border-brand-700 text-white';
    return 'bg-border border-border text-text-muted';
  };
  const iconBg = getIconBgClass(isPast, step.locked, isCurrent);

  let cardClass = 'rounded-xl border bg-bg-card p-4 shadow-card transition-all';
  if (isCurrent)
    cardClass += ' border-brand-500 bg-brand-50/30 ring-2 ring-brand-100 shadow-brand-sm';
  else if (isPast || step.locked) cardClass += ' border-success/30 bg-success/5';
  else cardClass += ' border-border';

  return (
    <div
      className={`relative py-3 pl-14 ${isFuture ? 'opacity-60 grayscale' : ''}`}
      data-step={stepKey}
    >
      <div
        className={`absolute left-0 top-3 z-10 flex size-11 items-center justify-center rounded-full border-4 border-white shadow-sm transition-colors ${iconBg}`}
      >
        <StepIcon stepKey={stepKey} />
      </div>
      {/* 時間軸連接線：連接上下步驟圖示中心，最後一步不需要 */}
      {/* bottom-[-20px]: 延伸到下一步驟的間距; left-[24px]: 對齊 44px 圓形中心; top-[50px]: 從圖示底部開始; w-[2px]: 細線 */}
      {stepKey !== '6' && (
        <div className="absolute bottom-[-20px] left-[24px] top-[50px] z-0 w-[2px] bg-border"></div>
      )}
      <div className={cardClass}>{children}</div>
    </div>
  );
});
