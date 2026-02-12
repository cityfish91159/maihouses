import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, createMockResponse } from '../__test-utils__/mockRequest';

const mockRpc = vi.fn();
const mockCreateClient = vi.fn(() => ({
  rpc: mockRpc,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

describe('archive-handler security hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    delete process.env.CRON_SECRET;
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it(
    'fails closed when CRON_SECRET is missing',
    async () => {
      process.env.SUPABASE_URL = 'https://example.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

      const handler = (await import('../archive-handler.js')).default;
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await handler(req as never, res as never);

      expect(res.statusCode).toBe(503);
      expect(JSON.parse(res._json)).toEqual({
        error: 'CRON_SECRET is not configured',
      });
      expect(mockCreateClient).not.toHaveBeenCalled();
      expect(mockRpc).not.toHaveBeenCalled();
    },
    15000
  );

  it('rejects non-allowlisted origin with 403 before business logic', async () => {
    const handler = (await import('../archive-handler.js')).default;
    const req = createMockRequest({
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res._json)).toEqual({ error: 'Origin not allowed' });
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('handles CORS preflight with 200 and exits early', async () => {
    const handler = (await import('../archive-handler.js')).default;
    const req = createMockRequest({ method: 'OPTIONS' });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
