import { apiFetch, getSessionId } from "./api";
import { safeLocalStorage } from "../lib/safeStorage";
import { logger } from "../lib/logger";

type Uag = {
  event: string;
  page: string;
  targetId?: string;
  sessionId: string;
  userId: string | null;
  ts: string;
  meta: Record<string, unknown>;
  requestId: string;
};

const KEY = "uag_queue";
const CAP = 10000;
const MAX_BATCH = 200;

/** UAG 全域狀態類型 */
type UagGlobalState = {
  queue: Uag[];
  timer?: number;
  backoff: number;
  attempts: number;
};

const _global = (
  typeof globalThis !== "undefined"
    ? globalThis
    : typeof window !== "undefined"
      ? window
      : typeof self !== "undefined"
        ? self
        : {}
) as typeof globalThis & { __UAG__?: UagGlobalState };
const G =
  _global.__UAG__ ||
  (_global.__UAG__ = { queue: [], backoff: 10000, attempts: 0 });

try {
  const stored = safeLocalStorage.getItem(KEY);
  G.queue = JSON.parse(stored || "[]");
} catch {
  G.queue = [];
}

const save = () => {
  try {
    safeLocalStorage.setItem(KEY, JSON.stringify(G.queue.slice(-CAP)));
  } catch {}
};

const MAX = 300000;

async function flush(batch: Uag[]) {
  const r = await apiFetch<{ retryAfterMs?: number } | null>(
    "/api/v1/uag/events",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    },
  );

  if (r.ok) {
    const ids = new Set(batch.map((b) => b.requestId));
    G.queue = G.queue.filter((x: Uag) => !ids.has(x.requestId));
    save();
    G.attempts = 0;
    G.backoff = 10000;
  } else {
    G.attempts++;
    const responseData = r as { data?: { retryAfterMs?: number } };
    const ra = responseData.data?.retryAfterMs;
    G.backoff = Math.min(ra ?? G.backoff * 2, MAX);
  }
}

function schedule() {
  if (G.timer) clearTimeout(G.timer);
  G.timer = setTimeout(tick, G.backoff) as unknown as number;
}

function tick() {
  if (G.queue.length) {
    const batch = G.queue.slice(0, MAX_BATCH);
    flush(batch)
      .catch(() => {
        G.attempts++;
        G.backoff = Math.min(G.backoff * 2, MAX);
      })
      .finally(schedule);
  } else {
    schedule();
  }
}

schedule();

function uuidv4() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (c: string) => {
      const r = Math.floor(Math.random() * 16);
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    },
  );
}

export function trackEvent(event: string, page: string, targetId?: string) {
  if (!event?.trim() || !page?.trim()) {
    logger.warn("[UAG] 無效的事件或頁面名稱，已忽略上報");
    return;
  }

  const ev: Uag = {
    event,
    page,
    sessionId: getSessionId(),
    userId: null,
    ts: new Date().toISOString(),
    meta: { origin: "gh-pages" },
    requestId: uuidv4(),
  };

  if (targetId) ev.targetId = targetId;

  G.queue.push(ev);
  if (G.queue.length > CAP) G.queue = G.queue.slice(-CAP);
  save();

  flush([ev]).catch(() => {
    G.attempts++;
    G.backoff = Math.min(G.backoff * 2, MAX);
    schedule();
  });
}
