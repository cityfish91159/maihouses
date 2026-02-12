import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, createMockResponse } from '../__test-utils__/mockRequest';

describe('high-cost endpoint security guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllGlobals();

    delete process.env.ENFORCE_HIGH_COST_SYSTEM_KEY;
    delete process.env.SYSTEM_API_KEY;
  });

  it(
    'claude rejects unauthorized request when enforcement is enabled',
    async () => {
      process.env.ENFORCE_HIGH_COST_SYSTEM_KEY = 'true';
      process.env.SYSTEM_API_KEY = 'expected-system-key';

      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const handler = (await import('../claude.ts')).default;
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
    },
    15000
  );

  it('replicate-generate rejects unauthorized request when enforcement is enabled', async () => {
    process.env.ENFORCE_HIGH_COST_SYSTEM_KEY = 'true';
    process.env.SYSTEM_API_KEY = 'expected-system-key';

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const handler = (await import('../replicate-generate.js')).default;
    const req = createMockRequest({
      method: 'POST',
      body: { prompt: 'test prompt' },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._json)).toEqual({ error: 'Unauthorized' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('x-raymike rejects unauthorized request when enforcement is enabled', async () => {
    process.env.ENFORCE_HIGH_COST_SYSTEM_KEY = 'true';
    process.env.SYSTEM_API_KEY = 'expected-system-key';

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const handler = (await import('../x-raymike.js')).default;
    const req = createMockRequest({
      method: 'POST',
      body: { image: 'https://example.com/image.jpg' },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res._json)).toEqual({ error: 'Unauthorized' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
