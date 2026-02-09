import { memo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getTrustAssureCopy, getTrustScenario } from './trustAssure';

interface TrustAssureHintProps {
  isLoggedIn: boolean;
  trustEnabled: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const TrustAssureHint = memo(function TrustAssureHint({
  isLoggedIn,
  trustEnabled,
  checked,
  onCheckedChange,
  className,
}: TrustAssureHintProps) {
  const scenario = getTrustScenario(isLoggedIn, trustEnabled);
  const copy = getTrustAssureCopy(scenario);
  const checkboxId = `trust-assure-${scenario}`;

  return (
    <div
      className={cn(
        'mt-4 rounded-lg border p-3',
        copy.tone === 'brand' ? 'border-brand-200 bg-brand-50' : 'border-amber-200 bg-amber-50',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <label
          htmlFor={checkboxId}
          className="mt-0.5 flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center"
        >
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            aria-labelledby={`${checkboxId}-label-text`}
            className="size-4 cursor-pointer rounded border-gray-300 text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
          />
          <span className="sr-only">{copy.label}</span>
        </label>
        <label htmlFor={checkboxId} className="flex cursor-pointer flex-col">
          <span id={`${checkboxId}-label-text`} className="text-sm font-medium text-text-primary">
            {copy.label}
          </span>
          <span className="mt-0.5 text-xs text-text-muted">{copy.description}</span>
        </label>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        <span>安心留痕：交易過程全程記錄，保障雙方權益。</span>
      </div>
    </div>
  );
});
