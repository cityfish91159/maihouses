/** 進度條寬度 Tailwind class 映射（0-6 步驟） */
export const PROGRESS_WIDTH_CLASS = [
  'w-0',
  'w-1/6',
  'w-1/3',
  'w-1/2',
  'w-2/3',
  'w-5/6',
  'w-full',
] as const;

export type ProgressWidthClass = (typeof PROGRESS_WIDTH_CLASS)[number];

export const PROGRESS_MAX_STEP = 6;

/** 預設進度條寬度 class */
const DEFAULT_WIDTH = PROGRESS_WIDTH_CLASS[0];

/**
 * 計算進度條寬度 class
 * @param value - 當前步驟（0-6）或完成數量
 * @param total - 可選，總步驟數，用於比例計算
 * @returns Tailwind 寬度 class
 */
export const calcProgressWidthClass = (value: number, total?: number): ProgressWidthClass => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const safeTotal = Number.isFinite(total) ? total : undefined;
  const progressValue =
    typeof safeTotal === 'number' && safeTotal > 0
      ? Math.round((safeValue / safeTotal) * PROGRESS_MAX_STEP)
      : safeValue;
  const normalized = Math.max(0, Math.min(PROGRESS_MAX_STEP, Math.round(progressValue)));
  return PROGRESS_WIDTH_CLASS[normalized] ?? DEFAULT_WIDTH;
};
