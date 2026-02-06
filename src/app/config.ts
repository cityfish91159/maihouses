import { safeLocalStorage } from '../lib/safeStorage';
import { logger } from '../lib/logger';

export interface AppConfig {
  apiBaseUrl: string;
  appVersion: string;
  minBackend: string;
  features: Record<string, boolean>;
}

export type RuntimeOverrides = {
  mock?: boolean;
  latency?: number;
  error?: number;
  q?: string;
  devtools?: '1' | '0';
  features?: Record<string, boolean>;
  apiBaseUrl?: string;
  mockSeed?: string;
};

const LS = 'maihouse_config';

const DEFAULT_CONFIG: AppConfig & Partial<RuntimeOverrides> = {
  apiBaseUrl: '/api',
  appVersion: 'local',
  minBackend: '0',
  features: {},
  mock: true,
  latency: 0,
  error: 0,
};

async function fetchJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`Failed to fetch ${url}: ${r.status}`);
  }
  return r.json();
}

// [NASA TypeScript Safety] 使用類型守衛取代 as Record<string, unknown>
function isValidConfig(obj: unknown): obj is AppConfig {
  if (obj === null || typeof obj !== 'object') return false;
  const record = obj as Record<string, unknown>;
  return (
    'apiBaseUrl' in record &&
    typeof record.apiBaseUrl === 'string' &&
    'appVersion' in record &&
    typeof record.appVersion === 'string' &&
    'minBackend' in record &&
    typeof record.minBackend === 'string' &&
    'features' in record &&
    typeof record.features === 'object'
  );
}

async function readBase(): Promise<AppConfig & Partial<RuntimeOverrides>> {
  // 1) localStorage cache
  try {
    const cache = safeLocalStorage.getItem(LS);
    if (cache) {
      const parsed = JSON.parse(cache);
      if (isValidConfig(parsed)) return parsed;
    }
  } catch {}

  // 2) remote app.config.json
  const baseUrl = import.meta.env.BASE_URL || '/';
  const url = `${window.location.origin}${baseUrl}app.config.json`;
  try {
    const remote = await fetchJson(url);
    if (isValidConfig(remote)) return remote;
  } catch (err) {
    logger.warn('[config] fetch app.config.json failed, fallback to DEFAULT_CONFIG', {
      error: err,
    });
  }

  // 3) hardcoded default to prevent white screen
  return DEFAULT_CONFIG;
}

function getParamFromBoth(key: string): string | undefined {
  const search = new URLSearchParams(location.search).get(key);
  const i = location.hash.indexOf('?');
  const hash = i > -1 ? new URLSearchParams(location.hash.slice(i)).get(key) : null;
  return hash ?? search ?? undefined;
}

function pickParams() {
  const slots = getParamFromBoth('slots');
  const features = slots
    ? slots.split(',').reduce<Record<string, boolean>>((a, s) => ((a[s.trim()] = true), a), {})
    : undefined;

  // [NASA TypeScript Safety] 構建類型安全的 RuntimeOverrides
  const devtoolsParam = getParamFromBoth('devtools');
  const devtools: '1' | '0' | undefined =
    devtoolsParam === '1' ? '1' : devtoolsParam === '0' ? '0' : undefined;
  const latencyParam = getParamFromBoth('latency');
  const errorParam = getParamFromBoth('error');

  // [NASA TypeScript Safety] exactOptionalPropertyTypes 要求不能賦值 undefined
  // 使用 Object spread 來建構物件，只包含有值的屬性
  const result: RuntimeOverrides = {};

  const apiBaseUrl = getParamFromBoth('api');
  if (apiBaseUrl !== undefined) result.apiBaseUrl = apiBaseUrl;

  if (features !== undefined) result.features = features;

  const mockParam = getParamFromBoth('mock');
  if (mockParam !== undefined) result.mock = mockParam === '1';

  if (latencyParam !== undefined) result.latency = +latencyParam;

  if (errorParam !== undefined) result.error = +errorParam;

  const q = getParamFromBoth('q');
  if (q !== undefined) result.q = q;

  if (devtools !== undefined) result.devtools = devtools;

  const mockSeed = getParamFromBoth('seed');
  if (mockSeed !== undefined) result.mockSeed = mockSeed;

  return result;
}

export async function getConfig(): Promise<AppConfig & RuntimeOverrides> {
  try {
    const base = await readBase();
    const o = pickParams();
    const baseWithOverrides = base as AppConfig & Partial<RuntimeOverrides>;
    const merged: AppConfig & RuntimeOverrides = {
      ...base,
      ...o,
      mock: o.mock ?? baseWithOverrides.mock ?? true,
      latency: o.latency ?? baseWithOverrides.latency ?? 0,
      error: o.error ?? baseWithOverrides.error ?? 0,
    };

    try {
      safeLocalStorage.setItem(LS, JSON.stringify(merged));
    } catch {}

    return merged;
  } catch (err) {
    logger.error('[config] getConfig failed, using DEFAULT_CONFIG', {
      error: err,
    });
    const merged: AppConfig & RuntimeOverrides = {
      ...DEFAULT_CONFIG,
      ...pickParams(),
      mock: true,
      latency: 0,
      error: 0,
    };
    return merged;
  }
}
