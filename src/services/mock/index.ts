/**
 * Mock API Handler
 *
 * [NASA TypeScript Safety] 此檔案中的 `as T` 類型斷言是 Mock 實作的預期行為。
 * 這些斷言用於將已知結構的 mock 資料轉換為泛型回傳類型。
 * 由於 mock 資料是由 fixtures 生成的已知結構，這些轉換是安全的。
 */
import { getConfig } from '../../app/config';
import {
  makePropertiesDeterministic,
  makeProperties,
  makeReview,
  makeCommunities,
  COMMUNITY_REVIEWS,
} from './fixtures';
import type { ApiResponse, Paginated, PropertyCard, AiAskRes } from '../../types';

const idempotent = new Map<string, ApiResponse<AiAskRes>>();
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const maybeFail = (rate: number) => {
  if (rate > 0 && Math.random() < rate) throw new Error('Mock 網路失敗');
};

function header(options: RequestInit, key: string) {
  const h = options.headers;
  if (!h) return;
  if (h instanceof Headers) return h.get(key) || undefined;
  if (Array.isArray(h)) return h.find(([k]) => k.toLowerCase() === key.toLowerCase())?.[1];
  const o = h;
  return o[key] ?? o[key.toLowerCase()];
}

export async function mockHandler(
  endpoint: '/api/v1/communities/preview',
  options: RequestInit
): Promise<ApiResponse<import('../../types').CommunityPreview[]>>;
export async function mockHandler<T = unknown>(
  endpoint: string,
  options: RequestInit
): Promise<ApiResponse<T>>;
export async function mockHandler<T = unknown>(
  endpoint: string,
  options: RequestInit
): Promise<ApiResponse<T>> {
  const cfg = await getConfig();
  await delay(cfg.latency ?? 0);
  maybeFail(cfg.error ?? 0);

  if (endpoint === '/api/v1/uag/events') return { ok: true, data: null as T };

  if (/^\/api\/v1\/meta$/.test(endpoint))
    return {
      ok: true,
      data: {
        backendVersion: '1.0.7',
        apiVersion: 'v1',
        maintenance: false,
      } as T,
    };

  if (endpoint.startsWith('/api/v1/properties?')) {
    const sp = new URLSearchParams(endpoint.split('?')[1] || '');
    const page = +sp.get('page')! || 1;
    const pageSize = +sp.get('pageSize')! || 8;
    const keyword = sp.get('q') || '';
    const key = `${cfg.mockSeed ?? ''}|${keyword}|${page}`;

    let items = makePropertiesDeterministic(key, 24);
    if (keyword)
      items = items.filter((p) => p.title.includes(keyword) || p.communityName.includes(keyword));

    const data: Paginated<PropertyCard> = {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: items.length,
    };
    return { ok: true, data: data as T };
  }

  if (/^\/api\/v1\/properties\/[^/?]+$/.test(endpoint)) {
    const id = endpoint.split('/').pop()!;
    const p = makeProperties(24).find((x) => x.id === id);
    return p
      ? { ok: true, data: p as T }
      : { ok: false, error: { code: 'NOT_FOUND', message: '物件不存在' } };
  }

  if (/^\/api\/v1\/communities\/.+\/reviews\?/.test(endpoint)) {
    // 解析 communityId
    const m = /^\/api\/v1\/communities\/([^/?]+)\/reviews\?/.exec(endpoint)!;
    const communityId = m?.[1] ?? '';
    const sp = new URLSearchParams(endpoint.split('?')[1] || '');
    const limit = +sp.get('limit')! || 2;
    const offset = +sp.get('offset')! || 0;

    const fixed = COMMUNITY_REVIEWS[communityId];
    if (fixed && fixed.length > 0) {
      const sliced = fixed.slice(offset, offset + limit);
      return { ok: true, data: sliced as T };
    }

    // fallback：舊隨機生成
    const reviews = Array.from({ length: limit }, (_, i) => makeReview(i + offset));
    return { ok: true, data: reviews as T };
  }

  if (/^\/api\/v1\/communities\/preview$/.test(endpoint)) {
    return { ok: true, data: makeCommunities(6) as T };
  }

  // AI 助理已接 OpenAI API，不使用 mock
  if (endpoint === '/api/v1/ai/ask') {
    return {
      ok: false,
      error: { code: 'USE_REAL_API', message: 'AI 助理使用真實 OpenAI API' },
    };
  }

  return { ok: false, error: { code: 'NOT_FOUND', message: '端點不存在' } };
}
