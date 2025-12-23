export interface AppConfig {
  apiBaseUrl: string
  appVersion: string
  minBackend: string
  features: Record<string, boolean>
}

export type RuntimeOverrides = {
  mock?: boolean
  latency?: number
  error?: number
  q?: string
  devtools?: '1' | '0'
  features?: Record<string, boolean>
  apiBaseUrl?: string
  mockSeed?: string
}

const LS = 'maihouse_config'

const DEFAULT_CONFIG: AppConfig & Partial<RuntimeOverrides> = {
  apiBaseUrl: '/api',
  appVersion: 'local',
  minBackend: '0',
  features: {},
  mock: true,
  latency: 0,
  error: 0,
}

async function fetchJson(url: string) {
  const r = await fetch(url)
  if (!r.ok) {
    throw new Error(`Failed to fetch ${url}: ${r.status}`)
  }
  return r.json()
}

function isValidConfig(obj: any): obj is AppConfig {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.apiBaseUrl === 'string' &&
    typeof obj.appVersion === 'string' &&
    typeof obj.minBackend === 'string' &&
    typeof obj.features === 'object'
  )
}

async function readBase(): Promise<AppConfig & Partial<RuntimeOverrides>> {
  // 1) localStorage cache
  try {
    const cache = localStorage.getItem(LS)
    if (cache) {
      const parsed = JSON.parse(cache)
      if (isValidConfig(parsed)) return parsed
    }
  } catch {}

  // 2) remote app.config.json
  const baseUrl = import.meta.env.BASE_URL || '/'
  const url = `${window.location.origin}${baseUrl}app.config.json`
  try {
    const remote = await fetchJson(url)
    if (isValidConfig(remote)) return remote
  } catch (err) {
    console.warn('[config] fetch app.config.json failed, fallback to DEFAULT_CONFIG', err)
  }

  // 3) hardcoded default to prevent white screen
  return DEFAULT_CONFIG
}

function getParamFromBoth(key: string): string | undefined {
  const search = new URLSearchParams(location.search).get(key)
  const i = location.hash.indexOf('?')
  const hash = i > -1 ? new URLSearchParams(location.hash.slice(i)).get(key) : null
  return (hash ?? search) ?? undefined
}

function pickParams() {
  const slots = getParamFromBoth('slots')
  const features = slots
    ? slots.split(',').reduce<Record<string, boolean>>((a, s) => ((a[s.trim()] = true), a), {})
    : undefined
  
  return {
    apiBaseUrl: getParamFromBoth('api'),
    features,
    mock: getParamFromBoth('mock') ? getParamFromBoth('mock') === '1' : undefined,
    latency: getParamFromBoth('latency') ? +getParamFromBoth('latency')! : undefined,
    error: getParamFromBoth('error') ? +getParamFromBoth('error')! : undefined,
    q: getParamFromBoth('q'),
    devtools: getParamFromBoth('devtools') as '1' | '0' | undefined,
    mockSeed: getParamFromBoth('seed')
  } as RuntimeOverrides
}

export async function getConfig(): Promise<AppConfig & RuntimeOverrides> {
  try {
    const base = await readBase()
    const o = pickParams()
    const merged: AppConfig & RuntimeOverrides = {
      ...base,
      ...o,
      mock: o.mock ?? (base as any).mock ?? true,
      latency: o.latency ?? (base as any).latency ?? 0,
      error: o.error ?? (base as any).error ?? 0,
    }

    try {
      localStorage.setItem(LS, JSON.stringify(merged))
    } catch {}

    return merged
  } catch (err) {
    console.error('[config] getConfig failed, using DEFAULT_CONFIG', err)
    const merged: AppConfig & RuntimeOverrides = {
      ...DEFAULT_CONFIG,
      ...pickParams(),
      mock: true,
      latency: 0,
      error: 0,
    }
    return merged
  }
}
