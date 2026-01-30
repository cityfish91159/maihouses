/** 進度條寬度 Tailwind class 映射（0-6 步驟） */
export const PROGRESS_WIDTH_CLASS: Record<number, string> = {
  0: 'w-0',
  1: 'w-1/6',
  2: 'w-1/3',
  3: 'w-1/2',
  4: 'w-2/3',
  5: 'w-5/6',
  6: 'w-full',
};

export const PROGRESS_MAX_STEP = 6;

/** 預設進度條寬度 class */
const DEFAULT_WIDTH = 'w-0';

export const calcProgressWidthClass = (value: number, total?: number): string => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeTotal = Number.isFinite(total) ? total : undefined;
  const progressValue =
    typeof safeTotal === 'number' && safeTotal > 0
      ? Math.round((safeValue / safeTotal) * PROGRESS_MAX_STEP)
      : safeValue;
  const normalized = Math.max(0, Math.min(PROGRESS_MAX_STEP, Math.round(progressValue)));
  return PROGRESS_WIDTH_CLASS[normalized] ?? DEFAULT_WIDTH;
};
