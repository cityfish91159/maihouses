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

async function fetchJson(url: string) {
  const r = await fetch(url)
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
  try {
    const cache = localStorage.getItem(LS)
    if (cache) {
      const parsed = JSON.parse(cache)
      if (isValidConfig(parsed)) return { ...parsed, ...pickParams() }
    }
  } catch {}
  
  const url = new URL('app.config.json', import.meta.env.BASE_URL).toString()
  return fetchJson(url)
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
  const base = await readBase()
  const o = pickParams()
  const merged: AppConfig & RuntimeOverrides = {
    ...base,
    ...o,
    mock: o.mock ?? (base as any).mock ?? true,
    latency: o.latency ?? (base as any).latency ?? 0,
    error: o.error ?? (base as any).error ?? 0
  }
  
  try {
    localStorage.setItem(LS, JSON.stringify(merged))
  } catch {}
  
  return merged
}
