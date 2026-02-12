import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, createMockResponse } from '../__test-utils__/mockRequest';

const MUSE_ENDPOINTS = [
  { name: 'muse-chat', modulePath: '../muse-chat.ts' },
  { name: 'muse-voice', modulePath: '../muse-voice.ts' },
  { name: 'muse-speak', modulePath: '../muse-speak.ts' },
] as const;

describe('muse endpoints CORS hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it.each(MUSE_ENDPOINTS)(
    '$name rejects non-allowlisted origin with 403',
    async ({ modulePath }) => {
      const handler = (await import(modulePath)).default;
      const req = createMockRequest({
        method: 'POST',
        body: {},
        headers: {
          origin: 'https://evil.example',
        },
      });
      const res = createMockResponse();

      await handler(req as never, res as never);

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res._json)).toEqual({ error: 'Origin not allowed' });
    },
    15000
  );

  it.each(MUSE_ENDPOINTS)(
    '$name handles CORS preflight with 200 and exits early',
    async ({ modulePath }) => {
      const handler = (await import(modulePath)).default;
      const req = createMockRequest({
        method: 'OPTIONS',
      });
      const res = createMockResponse();

      await handler(req as never, res as never);

      expect(res.statusCode).toBe(200);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(res.json).not.toHaveBeenCalled();
    },
    15000
  );
});
