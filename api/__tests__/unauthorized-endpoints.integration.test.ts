import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, createMockResponse } from '../__test-utils__/mockRequest';

const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_FORBIDDEN = 403;
const UNAUTHORIZED_STATUS_CODES = [HTTP_STATUS_UNAUTHORIZED, HTTP_STATUS_FORBIDDEN] as const;
const ALLOWLISTED_ORIGIN = 'https://maihouses.com';
const DISALLOWED_ORIGIN = 'https://evil.example';

const VALID_CASE_ID = '550e8400-e29b-41d4-a716-446655440000';

const AI_ENDPOINTS = [
  {
    endpointName: 'chat',
    modulePath: '../chat.ts',
    requestBody: { messages: [{ role: 'user', content: 'hello' }] },
  },
  {
    endpointName: 'claude',
    modulePath: '../claude.ts',
    requestBody: { messages: [{ role: 'user', content: 'hello' }] },
  },
  {
    endpointName: 'replicate-detect',
    modulePath: '../replicate-detect.js',
    requestBody: { image: 'https://example.com/sample.jpg' },
  },
] as const;

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

vi.mock('../trust/_utils', () => ({
  supabase: {
    from: vi.fn(),
  },
  SYSTEM_API_KEY: 'expected-system-key',
}));

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../lib/sentry', () => ({
  withSentryHandler: (handler: unknown) => handler,
  captureError: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

function assertUnauthorizedStatus(statusCode: number): void {
  expect(UNAUTHORIZED_STATUS_CODES).toContain(
    statusCode as (typeof UNAUTHORIZED_STATUS_CODES)[number]
  );
}

describe('unauthorized endpoint integration coverage', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllGlobals();

    process.env.ENFORCE_HIGH_COST_SYSTEM_KEY = 'true';
    process.env.SYSTEM_API_KEY = 'expected-system-key';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.SESSION_RECOVERY_TOKEN_SECRET = 'test-session-recovery-secret';
    process.env.SESSION_RECOVERY_TOKEN_TTL_MS = '300000';

    mockCreateClient.mockReturnValue({
      from: vi.fn(),
      rpc: vi.fn(),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each(AI_ENDPOINTS)(
    'AI endpoint $endpointName should return unauthorized status without system key',
    async ({ modulePath, requestBody }) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      const handler = (await import(modulePath)).default;
      const req = createMockRequest({
        method: 'POST',
        body: requestBody,
        headers: {
          origin: ALLOWLISTED_ORIGIN,
        },
      });
      const res = createMockResponse();

      await handler(req as never, res as never);

      assertUnauthorizedStatus(res.statusCode);
      expect(res.statusCode).toBe(HTTP_STATUS_UNAUTHORIZED);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('notification endpoint trust/notify should return unauthorized status without x-system-key', async () => {
    const handler = (await import('../trust/notify')).default;
    const req = createMockRequest({
      method: 'GET',
      query: {
        caseId: VALID_CASE_ID,
      },
      headers: {
        origin: ALLOWLISTED_ORIGIN,
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    assertUnauthorizedStatus(res.statusCode);
    expect(res.statusCode).toBe(HTTP_STATUS_UNAUTHORIZED);
  });

  it('notification endpoint line-notify should reject disallowed origin with unauthorized status', async () => {
    const handler = (await import('../line-notify.ts')).default;
    const req = createMockRequest({
      method: 'POST',
      body: { message: 'test', type: 'default' },
      headers: {
        origin: DISALLOWED_ORIGIN,
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    assertUnauthorizedStatus(res.statusCode);
    expect(res.statusCode).toBe(HTTP_STATUS_FORBIDDEN);
    expect(JSON.parse(res._json)).toEqual({ error: 'Origin not allowed' });
  });

  it('tracking endpoint uag/track should reject disallowed origin with unauthorized status', async () => {
    const handler = (await import('../uag/track')).default;
    const req = createMockRequest({
      method: 'POST',
      body: {
        session_id: 'session-001',
        event: {
          property_id: 'MH-100001',
        },
      },
      headers: {
        origin: DISALLOWED_ORIGIN,
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    assertUnauthorizedStatus(res.statusCode);
    expect(res.statusCode).toBe(HTTP_STATUS_FORBIDDEN);
    expect(JSON.parse(res._json)).toEqual({ error: 'Origin not allowed' });
  });

  it('session recovery endpoint should reject disallowed origin with unauthorized status', async () => {
    const handler = (await import('../session-recovery')).default;
    const req = createMockRequest({
      method: 'POST',
      body: {
        fingerprint: 'fp-unauthorized',
      },
      headers: {
        origin: DISALLOWED_ORIGIN,
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    assertUnauthorizedStatus(res.statusCode);
    expect(res.statusCode).toBe(HTTP_STATUS_FORBIDDEN);
    expect(JSON.parse(res._json)).toEqual({ error: 'Origin not allowed' });
  });
});
