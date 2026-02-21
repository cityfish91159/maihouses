const WIDTH_CLASS_BY_PERCENT: Record<number, string> = {
  0: 'w-0',
  5: 'w-[5%]',
  10: 'w-[10%]',
  15: 'w-[15%]',
  20: 'w-[20%]',
  25: 'w-[25%]',
  30: 'w-[30%]',
  35: 'w-[35%]',
  40: 'w-[40%]',
  45: 'w-[45%]',
  50: 'w-1/2',
  55: 'w-[55%]',
  60: 'w-[60%]',
  65: 'w-[65%]',
  70: 'w-[70%]',
  75: 'w-3/4',
  80: 'w-[80%]',
  85: 'w-[85%]',
  90: 'w-[90%]',
  95: 'w-[95%]',
  100: 'w-full',
};

const HEIGHT_CLASS_BY_PERCENT: Record<number, string> = {
  0: 'h-0',
  5: 'h-[5%]',
  10: 'h-[10%]',
  15: 'h-[15%]',
  20: 'h-[20%]',
  25: 'h-1/4',
  30: 'h-[30%]',
  35: 'h-[35%]',
  40: 'h-[40%]',
  45: 'h-[45%]',
  50: 'h-1/2',
  55: 'h-[55%]',
  60: 'h-[60%]',
  65: 'h-[65%]',
  70: 'h-[70%]',
  75: 'h-3/4',
  80: 'h-[80%]',
  85: 'h-[85%]',
  90: 'h-[90%]',
  95: 'h-[95%]',
  100: 'h-full',
};

function clampPercent(percent: number): number {
  if (Number.isNaN(percent)) return 0;
  return Math.max(0, Math.min(100, percent));
}

function getPercentBucket(percent: number): number {
  const clamped = clampPercent(percent);
  return Math.round(clamped / 5) * 5;
}

export function getPercentWidthClass(percent: number): string {
  const bucket = getPercentBucket(percent);
  return WIDTH_CLASS_BY_PERCENT[bucket] ?? 'w-0';
}

export function getPercentHeightClass(percent: number): string {
  const bucket = getPercentBucket(percent);
  return HEIGHT_CLASS_BY_PERCENT[bucket] ?? 'h-0';
}
