import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const cmp = (a: string, b: string) => {
  const pa = a.split(".").map((n) => +n || 0);
  const pb = b.split(".").map((n) => +n || 0);
  for (let i = 0; i < 3; i++) {
    const paVal = pa[i] ?? 0;
    const pbVal = pb[i] ?? 0;
    if (paVal < pbVal) return -1;
    if (paVal > pbVal) return 1;
  }
  return 0;
};

// 台北時區 (UTC+8) 格式化工具
const TAIPEI_TZ = "Asia/Taipei";

export function formatTaipeiTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("zh-TW", {
    timeZone: TAIPEI_TZ,
    ...options,
  });
}

export function formatTaipeiDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-TW", {
    timeZone: TAIPEI_TZ,
    ...options,
  });
}

export function formatTaipeiDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-TW", {
    timeZone: TAIPEI_TZ,
    ...options,
  });
}
