import { safeLocalStorage } from '../lib/safeStorage';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { getErrorMessage } from '../lib/error';

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

const LS = 'maihouse_config_v2'; // v2: 修復 API 路徑問題，強制清除舊快取

const DEFAULT_CONFIG: AppConfig & Partial<RuntimeOverrides> = {
  apiBaseUrl: '/api',
  appVersion: 'local',
  minBackend: '0',
  features: {},
  mock: true,
  latency: 0,
  error: 0,
};

const AppConfigSchema = z
  .object({
    apiBaseUrl: z.string(),
    appVersion: z.string(),
    minBackend: z.string(),
    features: z.record(z.string(), z.boolean()),
  })
  .passthrough();

async function fetchJson(url: string): Promise<unknown> {
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`取得 ${url} 失敗: ${r.status}`);
  }
  const data: unknown = await r.json();
  return data;
}

function isValidConfig(obj: unknown): obj is AppConfig & Partial<RuntimeOverrides> {
  return AppConfigSchema.safeParse(obj).success;
}

async function readBase(): Promise<AppConfig & Partial<RuntimeOverrides>> {
  // 1) localStorage cache
  try {
    const cache = safeLocalStorage.getItem(LS);
    if (cache) {
      const parsed = JSON.parse(cache);
      if (isValidConfig(parsed)) return parsed;
    }
  } catch (err) {
    logger.warn('[config] 讀取快取設定失敗，改用遠端設定', {
      error: getErrorMessage(err),
    });
  }

  // 2) remote app.config.json
  const baseUrl = import.meta.env.BASE_URL || '/';
  const url = `${window.location.origin}${baseUrl}app.config.json`;
  try {
    const remote = await fetchJson(url);
    if (isValidConfig(remote)) return remote;
  } catch (err) {
    logger.warn('[config] 取得 app.config.json 失敗，改用預設設定', {
      error: getErrorMessage(err),
    });
  }

  // 3) hardcoded default to prevent white screen
  return DEFAULT_CONFIG;
}

function getParamFromBoth(key: string): string | undefined {
  const search = new URLSearchParams(window.location.search).get(key);
  const i = window.location.hash.indexOf('?');
  const hash = i > -1 ? new URLSearchParams(window.location.hash.slice(i)).get(key) : null;
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
    const merged: AppConfig & RuntimeOverrides = {
      ...base,
      ...o,
      mock: o.mock ?? base.mock ?? true,
      latency: o.latency ?? base.latency ?? 0,
      error: o.error ?? base.error ?? 0,
    };

    try {
      safeLocalStorage.setItem(LS, JSON.stringify(merged));
    } catch (err) {
      logger.warn('[config] 寫入合併設定到 localStorage 失敗', {
        error: getErrorMessage(err),
      });
    }

    return merged;
  } catch (err) {
    logger.error('[config] getConfig 失敗，改用預設設定', {
      error: getErrorMessage(err),
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
