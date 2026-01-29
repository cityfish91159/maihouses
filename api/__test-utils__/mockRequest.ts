/**
 * [Team 8 第六位修復] 測試工具 - Mock Request/Response
 *
 * 為 Phase 1.5 整合測試提供 mock 工具。
 * 這是第四位開發者建立的正確工具，第五位錯誤刪除。
 */

import { vi } from 'vitest';

export interface MockRequest {
  method: string;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
}

export interface MockResponse {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
  statusCode: number;
  _json: string;
}

export function createMockRequest(options: {
  method?: string;
  body?: unknown;
  authToken?: string;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
}): MockRequest {
  return {
    method: options.method ?? 'POST',
    body: options.body ?? {},
    query: options.query,
    headers: {
      authorization: options.authToken ? `Bearer ${options.authToken}` : undefined,
      origin: 'https://maihouses.com',
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'vitest-test-agent',
      ...options.headers,
    },
  };
}

export function createMockResponse(): MockResponse {
  const res = {
    statusCode: 0,
    _json: '',
    status: vi.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn().mockImplementation((data: unknown) => {
      res._json = JSON.stringify(data);
      return res;
    }),
    end: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };

  return res;
}
