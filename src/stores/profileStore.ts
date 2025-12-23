import { safeLocalStorage } from "../lib/safeStorage";

export type UserMilestones = {
  birthday?: string;      // YYYY-MM-DD
  move_in_date?: string;  // YYYY-MM-DD
};
export type UserProfile = {
  tags: string[];
  milestones?: UserMilestones;
  lastSeenAt?: number;
  lastMood?: "neutral" | "stress" | "rest";
};

const STORAGE_KEY = "mai-user-profile-v1";
const FIRST_SEEN_KEY = "mai-first-seen-ts";
const WARM_DISMISS_KEY = "mai-warmbar-dismissed-date"; // YYYY-MM-DD

export function loadProfile(): UserProfile {
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY);
    if (!raw) return { tags: [] };
    return JSON.parse(raw) as UserProfile;
  } catch {
    return { tags: [] };
  }
}
export function saveProfile(p: UserProfile) {
  try {
    safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch { }
}
export function upsertTags(newTags: string[]) {
  const p = loadProfile();
  const set = new Set([...(p.tags || []), ...newTags].filter(Boolean));
  p.tags = Array.from(set).slice(0, 8);
  saveProfile(p);
}
export function setMilestones(ms: UserMilestones) {
  const p = loadProfile();
  p.milestones = { ...(p.milestones || {}), ...ms };
  saveProfile(p);
}
export function setLastMood(mood: "neutral" | "stress" | "rest") {
  const p = loadProfile();
  p.lastMood = mood;
  saveProfile(p);
}
export function touchVisit() {
  const p = loadProfile();
  p.lastSeenAt = Date.now();
  saveProfile(p);
}
export function ensureFirstSeen(): { isFirstVisit: boolean } {
  const exist = safeLocalStorage.getItem(FIRST_SEEN_KEY);
  if (exist) return { isFirstVisit: false };
  safeLocalStorage.setItem(FIRST_SEEN_KEY, String(Date.now()));
  return { isFirstVisit: true };
}
export function dismissWarmbarToday() {
  safeLocalStorage.setItem(WARM_DISMISS_KEY, todayStr());
}
export function isWarmbarDismissedToday() {
  return safeLocalStorage.getItem(WARM_DISMISS_KEY) === todayStr();
}
export function getWarmTags(max = 3): string[] {
  const p = loadProfile();
  return (p.tags || []).slice(0, max);
}
function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function diffDays(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  const ad = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bd = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((ad - bd) / MS);
}
export function getMilestoneHint(ms?: UserMilestones): string | null {
  if (!ms) return null;
  const now = new Date();
  if (ms.birthday) {
    const hint = nearAnnual(ms.birthday, now, 7);
    if (hint) return hint;
  }
  if (ms.move_in_date) {
    const hint = nearAnnual(ms.move_in_date, now, 7, "搬家");
    if (hint) return hint;
  }
  return null;
}
function nearAnnual(dateStr: string, now: Date, days = 7, label?: string): string | null {
  const [y, m, d] = dateStr.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  const thisYear = new Date(now.getFullYear(), m - 1, d);
  const delta = Math.abs(diffDays(thisYear, now));
  if (delta <= days) {
    if (label === "搬家") return "搬家一週年！";
    return "生日快樂！";
  }
  return null;
}
