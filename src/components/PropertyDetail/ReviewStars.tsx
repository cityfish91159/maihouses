import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

const STAR_COUNT = 5;
const FILLED_STAR_COUNT = 4;

export function ReviewStars({ className }: { className?: string }) {
  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`${FILLED_STAR_COUNT} 星評價`}
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => (
        <Star
          key={index}
          size={12}
          className={cn(
            index < FILLED_STAR_COUNT ? 'fill-current text-amber-500' : 'text-slate-300'
          )}
        />
      ))}
    </div>
  );
}
