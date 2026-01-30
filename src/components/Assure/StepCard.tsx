import type { ReactNode } from 'react';
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

export function StepCard({
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
      className={`relative py-3 pl-14 ${isFuture ? 'opacity-50 grayscale' : ''}`}
      data-step={stepKey}
    >
      <div
        className={`absolute left-0 top-3 z-10 flex size-11 items-center justify-center rounded-full border-4 border-white shadow-sm transition-colors ${iconBg}`}
      >
        <StepIcon stepKey={stepKey} />
      </div>
      {stepKey !== '6' && (
        <div className="absolute bottom-[-20px] left-[24px] top-[50px] z-0 w-[2px] bg-border"></div>
      )}
      <div className={cardClass}>{children}</div>
    </div>
  );
}
