/**
 * 設計 Token - 集中管理可用樣式
 * 減少隨意新增 Tailwind class
 */
export const TOKENS = {
  radius: {
    card: 'rounded-2xl',
    pill: 'rounded-full',
    lg: 'rounded-[var(--r-lg)]',
  },
  gap: {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
  },
  font: {
    pill: 'text-base md:text-lg',
    sm: 'text-sm',
    base: 'text-base',
  },
  shadow: {
    card: 'shadow-[10px_10px_24px_rgba(9,15,30,.16),_-10px_-10px_24px_rgba(255,255,255,.9)]',
    inner: 'shadow-inner',
  },
} as const
