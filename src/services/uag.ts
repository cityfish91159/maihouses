import { apiFetch, getSessionId } from './api'

type Uag = {
  event: string
  page: string
  targetId?: string
  sessionId: string
  userId: string | null
  ts: string
  meta: Record<string, unknown>
  requestId: string
}

const KEY = 'uag_queue'
const CAP = 10000

declare global {
  interface Window {
    __UAG__?: { queue: Uag[]; timer?: number; backoff: number; attempts: number }
  }
}

const G = window.__UAG__ || (window.__UAG__ = { queue: [], backoff: 10_000, attempts: 0 })

try {
  G.queue = JSON.parse(localStorage.getItem(KEY) || '[]')
} catch {
  G.queue = []
}

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(G.queue.slice(-CAP)))
  } catch {}
}

const MAX = 300_000

async function flush(batch: Uag[]) {
  const r = await apiFetch<{ retryAfterMs?: number } | null>('/api/v1/uag/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(batch)
  })

  if (r.ok) {
    const ids = new Set(batch.map((b) => b.requestId))
    G.queue = G.queue.filter((x) => !ids.has(x.requestId))
    save()
    G.attempts = 0
    G.backoff = 10_000
  } else {
    G.attempts++
    const ra = (r as any)?.data?.retryAfterMs
    G.backoff = Math.min(ra ? ra : G.backoff * 2, MAX)
  }
}

function schedule() {
  if (G.timer) clearTimeout(G.timer)
  G.timer = setTimeout(tick, G.backoff) as unknown as number
}

function tick() {
  if (G.queue.length) {
    flush(G.queue.slice())
      .catch(() => {
        G.attempts++
        G.backoff = Math.min(G.backoff * 2, MAX)
      })
      .finally(schedule)
  } else {
    schedule()
  }
}

schedule()

export function trackEvent(event: string, page: string, targetId?: string) {
  const ev: Uag = {
    event,
    page,
    targetId,
    sessionId: getSessionId(),
    userId: null,
    ts: new Date().toISOString(),
    meta: { origin: 'gh-pages' },
    requestId: crypto.randomUUID()
  }
  
  G.queue.push(ev)
  if (G.queue.length > CAP) G.queue = G.queue.slice(-CAP)
  save()
  
  flush([ev]).catch(() => {
    G.attempts++
    G.backoff = Math.min(G.backoff * 2, MAX)
    schedule()
  })
}
