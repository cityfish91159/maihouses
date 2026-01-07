import { STRINGS } from "../constants/strings";

/**
 * Format ISO string to relative time
 * e.g. "Just now", "5 mins ago", "2 hours ago", "3 days ago"
 */
export function formatRelativeTime(isoTime: string): string {
  const now = Date.now();
  const time = new Date(isoTime).getTime();
  const diffMs = now - time;

  // Handle future dates or invalid dates safely
  if (isNaN(time)) return "";
  if (diffMs < 0) return STRINGS.FEED.POST.TIME_JUST_NOW;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return STRINGS.FEED.POST.TIME_JUST_NOW;
  if (diffMinutes < 60) return STRINGS.FEED.POST.TIME_MINUTES_AGO(diffMinutes);
  if (diffHours < 24) return STRINGS.FEED.POST.TIME_HOURS_AGO(diffHours);
  return STRINGS.FEED.POST.TIME_DAYS_AGO(diffDays);
}
