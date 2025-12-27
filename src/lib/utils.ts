import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const cmp = (a: string, b: string) => {
  const pa = a.split('.').map((n) => +n || 0)
  const pb = b.split('.').map((n) => +n || 0)
  for (let i = 0; i < 3; i++) {
    const paVal = pa[i] ?? 0
    const pbVal = pb[i] ?? 0
    if (paVal < pbVal) return -1
    if (paVal > pbVal) return 1
  }
  return 0
}
