import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../app/config';
import { postLLM } from './ai';
import { getErrorMessage, safeAsync, safeSync, UNKNOWN_ERROR_MESSAGE } from '../lib/error';
import { logger } from '../lib/logger';
import type {
  ApiResponse,
  Paginated,
  PropertyCard,
  ReviewSnippet,
  AiAskReq,
  AiAskRes,
  CommunityPreview,
} from '../types';

let sessionId = uuidv4();
export const getSessionId = () => sessionId;

const REQUEST_TIMEOUT_MS = 8000;
const API_REQUEST_FAILED_MESSAGE = 'API 請求失敗';
const API_RESPONSE_PARSE_FAILED_MESSAGE = 'API 回應解析失敗';
const NETWORK_ERROR_FALLBACK_MESSAGE = 'Network error';
const AI_UNAVAILABLE_MESSAGE = 'AI 暫時無法使用';

function normalizeUserHeaders(headers: RequestInit['headers']): Record<string, string> {
  if (!headers) return {};

  if (headers instanceof Headers) {
    const normalized: Record<string, string> = {};
    for (const [k, v] of headers) {
      normalized[k] = v;
    }
    return normalized;
  }

  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers;
}

function resolveNetworkErrorMessage(error: unknown): string {
  const message = getErrorMessage(error);
  return message === UNKNOWN_ERROR_MESSAGE ? NETWORK_ERROR_FALLBACK_MESSAGE : message;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const cfg = await getConfig();
  const url = `${cfg.apiBaseUrl}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  const baseHeaders: Record<string, string> = {
    Accept: 'application/json',
    'X-API-Version': 'v1',
    'X-App-Version': cfg.appVersion,
    'X-Session-Id': sessionId,
    'X-Request-Id': uuidv4(),
    'Accept-Language': 'zh-Hant-TW',
  };

  const userHeadersResult = safeSync(() => normalizeUserHeaders(options.headers));
  const userHeaders = userHeadersResult.ok ? userHeadersResult.data : {};

  if (!userHeadersResult.ok) {
    logger.warn('[apiFetch] Failed to normalize user headers', {
      endpoint,
      error: userHeadersResult.error,
    });
  }

  if (method === 'POST' && !userHeaders['Idempotency-Key'] && !userHeaders['idempotency-key']) {
    userHeaders['Idempotency-Key'] = uuidv4();
  }

  const headers = { ...baseHeaders, ...userHeaders };

  if (cfg.mock) {
    const { mockHandler } = await import('./mock');
    return mockHandler<T>(endpoint, { ...options, headers });
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        error: { code: 'API_ERROR', message: API_REQUEST_FAILED_MESSAGE },
      };
    }
    const parseResult = await safeAsync(() => res.json());
    if (!parseResult.ok) {
      logger.warn('[apiFetch] Failed to parse response JSON', {
        endpoint,
        error: parseResult.error,
      });
      return {
        ok: false,
        error: { code: 'API_ERROR', message: API_RESPONSE_PARSE_FAILED_MESSAGE },
      };
    }
    return { ok: true, data: parseResult.data };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError')
      return {
        ok: false,
        error: { code: 'NETWORK_TIMEOUT', message: '請求超時' },
      };
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: resolveNetworkErrorMessage(e),
      },
    };
  } finally {
    clearTimeout(id);
  }
}

export const getMeta = () =>
  apiFetch<{
    backendVersion: string;
    apiVersion: string;
    maintenance: boolean;
  }>('/meta');

export const getProperties = (page: number, pageSize: number, q?: string) =>
  apiFetch<Paginated<PropertyCard>>(
    `/properties?${new URLSearchParams({ page: String(page), pageSize: String(pageSize), ...(q ? { q } : {}) })}`
  );

export const getProperty = (id: string) => apiFetch<PropertyCard>(`/properties/${id}`);

export const getReviews = (communityId: string, limit = 2, offset = 0) =>
  apiFetch<ReviewSnippet[]>(
    `/communities/${communityId}/reviews?${new URLSearchParams({ limit: String(limit), offset: String(offset) })}`
  );

export const getCommunities = () => apiFetch<CommunityPreview[]>('/communities/preview');

export const aiAsk = async (
  req: AiAskReq,
  onChunk?: (chunk: string) => void
): Promise<ApiResponse<AiAskRes>> => {
  const messages = req.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const askResult = await safeAsync(() => postLLM(messages, onChunk));
  if (!askResult.ok) {
    logger.error('AI Ask failed', { error: askResult.error });
    return {
      ok: false,
      error: {
        code: 'AI_ERROR',
        message: askResult.error === UNKNOWN_ERROR_MESSAGE ? AI_UNAVAILABLE_MESSAGE : askResult.error,
      },
    };
  }

  const aiResult: AiAskRes = { answers: [askResult.data], recommends: [] };
  return { ok: true, data: aiResult };
};
