const relativeTimeFormatter = new Intl.RelativeTimeFormat("zh-TW", {
  numeric: "auto",
});

const MS_IN_MINUTE = 60 * 1000;
const MS_IN_HOUR = 60 * MS_IN_MINUTE;
const MS_IN_DAY = 24 * MS_IN_HOUR;
const MS_IN_WEEK = 7 * MS_IN_DAY;
const MS_IN_MONTH = 30 * MS_IN_DAY;
const MS_IN_YEAR = 365 * MS_IN_DAY;

const parseDateValue = (value: string | number | Date): Date | null => {
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function formatRelativeTimeLabel(value: string | number | Date): string {
  const parsed = parseDateValue(value);
  if (!parsed) {
    return typeof value === "string" && value.trim() ? value : "剛剛";
  }

  const diff = Date.now() - parsed.getTime();
  if (diff < 0) {
    return parsed.toLocaleDateString("zh-TW");
  }

  if (diff < MS_IN_MINUTE) return "剛剛";
  if (diff < MS_IN_HOUR) {
    const minutes = Math.round(diff / MS_IN_MINUTE);
    return relativeTimeFormatter.format(-minutes, "minute");
  }
  if (diff < MS_IN_DAY) {
    const hours = Math.round(diff / MS_IN_HOUR);
    return relativeTimeFormatter.format(-hours, "hour");
  }
  if (diff < MS_IN_WEEK) {
    const days = Math.round(diff / MS_IN_DAY);
    return relativeTimeFormatter.format(-days, "day");
  }
  if (diff < MS_IN_MONTH) {
    const weeks = Math.round(diff / MS_IN_WEEK);
    return relativeTimeFormatter.format(-weeks, "week");
  }
  if (diff < MS_IN_YEAR) {
    const months = Math.round(diff / MS_IN_MONTH);
    return relativeTimeFormatter.format(-months, "month");
  }
  const years = Math.round(diff / MS_IN_YEAR);
  return relativeTimeFormatter.format(-years, "year");
}

export function mockTimestampMinutesAgo(minutesAgo: number): string {
  const baseline = Date.now() - minutesAgo * MS_IN_MINUTE;
  return new Date(baseline).toISOString();
}
