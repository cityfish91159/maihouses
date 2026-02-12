import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, createMockResponse } from '../__test-utils__/mockRequest';
import { resetRateLimit } from '../lib/rateLimiter';

describe('chat endpoint security guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllGlobals();

    delete process.env.ENFORCE_HIGH_COST_SYSTEM_KEY;
    delete process.env.SYSTEM_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.RATE_LIMIT_CHAT_MAX;
    delete process.env.RATE_LIMIT_CHAT_WINDOW_MS;

    resetRateLimit('127.0.0.1');
  });

  it('rejects unauthorized requests when system key enforcement is enabled', async () => {
    process.env.ENFORCE_HIGH_COST_SYSTEM_KEY = 'true';
    process.env.SYSTEM_API_KEY = 'expected-system-key';
    process.env.OPENAI_API_KEY = 'openai-key';

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const handler = (await import('../chat.ts')).default;
    const req = createMockRequest({
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'hello' }],
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._json)).toEqual({ error: 'Unauthorized' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limit is exceeded', async () => {
    process.env.OPENAI_API_KEY = 'openai-key';
    process.env.RATE_LIMIT_CHAT_MAX = '1';
    process.env.RATE_LIMIT_CHAT_WINDOW_MS = '60000';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'ok' } }],
      }),
      text: vi.fn().mockResolvedValue(''),
    });
    vi.stubGlobal('fetch', fetchMock);

    const handler = (await import('../chat.ts')).default;

    const firstReq = createMockRequest({
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'hello' }],
      },
    });
    const firstRes = createMockResponse();
    await handler(firstReq as never, firstRes as never);

    const secondReq = createMockRequest({
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'hello again' }],
      },
    });
    const secondRes = createMockResponse();
    await handler(secondReq as never, secondRes as never);

    expect(firstRes.statusCode).toBe(200);
    expect(secondRes.statusCode).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(secondRes._json).error).toBe('Too many requests, please try again later.');
  });
});

