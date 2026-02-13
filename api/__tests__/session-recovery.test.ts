import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, createMockResponse } from '../__test-utils__/mockRequest';
import type { SessionRecoveryResponse } from '../session-recovery';

interface SessionData {
  session_id: string;
  last_active: string;
  grade: string;
}

interface QueryMock {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
}

interface SupabaseSingleResult {
  data: SessionData | null;
  error: { code?: string; message?: string } | null;
}

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('/api/session-recovery', () => {
  let handler: typeof import('../session-recovery').default;
  let singleResult: SupabaseSingleResult;
  let latestQuery: QueryMock | null;
  let originalEnv: NodeJS.ProcessEnv;

  function createQueryMock(): QueryMock {
    const query = {} as QueryMock;
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.gte = vi.fn(() => query);
    query.order = vi.fn(() => query);
    query.limit = vi.fn(() => query);
    query.single = vi.fn(async () => singleResult);
    return query;
  }

  async function invokeHandler(
    body: unknown,
    ipAddress: string
  ): Promise<{ statusCode: number; payload: SessionRecoveryResponse }> {
    const req = createMockRequest({
      method: 'POST',
      body,
      headers: {
        'x-forwarded-for': ipAddress,
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    return {
      statusCode: res.statusCode,
      payload: JSON.parse(res._json) as SessionRecoveryResponse,
    };
  }

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    originalEnv = { ...process.env };
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.SESSION_RECOVERY_TOKEN_SECRET = 'test-session-recovery-secret';
    process.env.SESSION_RECOVERY_TOKEN_TTL_MS = '300000';
    delete process.env.RATE_LIMIT_SESSION_RECOVERY_LOOKUP_MAX;
    delete process.env.RATE_LIMIT_SESSION_RECOVERY_LOOKUP_WINDOW_MS;
    delete process.env.RATE_LIMIT_SESSION_RECOVERY_REDEEM_MAX;
    delete process.env.RATE_LIMIT_SESSION_RECOVERY_REDEEM_WINDOW_MS;

    singleResult = {
      data: null,
      error: { code: 'PGRST116', message: 'Row not found' },
    };
    latestQuery = null;

    const mockFrom = vi.fn(() => {
      latestQuery = createQueryMock();
      return latestQuery;
    });

    mockCreateClient.mockReturnValue({
      from: mockFrom,
    });

    handler = (await import('../session-recovery')).default;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns recovery_token instead of session_id for lookup and supports one-time redemption', async () => {
    singleResult = {
      data: {
        session_id: 'u_test123',
        grade: 'S',
        last_active: '2026-02-13T10:00:00Z',
      },
      error: null,
    };

    const lookup = await invokeHandler({ fingerprint: 'fp-test-001' }, '10.0.0.1');

    expect(lookup.statusCode).toBe(200);
    expect(lookup.payload.recovered).toBe(true);
    expect(lookup.payload.recovery_token).toEqual(expect.any(String));
    expect(lookup.payload.session_id).toBeUndefined();

    const token = lookup.payload.recovery_token;
    expect(token).toBeDefined();

    const redeem = await invokeHandler({ recoveryToken: token }, '10.0.0.1');
    expect(redeem.statusCode).toBe(200);
    expect(redeem.payload.recovered).toBe(true);
    expect(redeem.payload.session_id).toBe('u_test123');
    expect(redeem.payload.grade).toBe('S');

    const replay = await invokeHandler({ recoveryToken: token }, '10.0.0.1');
    expect(replay.statusCode).toBe(200);
    expect(replay.payload.recovered).toBe(false);
    expect(replay.payload.error).toBe('Invalid or expired recovery token');
  });

  it('returns 400 for invalid request body', async () => {
    const result = await invokeHandler({}, '10.0.0.2');

    expect(result.statusCode).toBe(400);
    expect(result.payload.recovered).toBe(false);
    expect(result.payload.error).toBe('Invalid request body');
  });

  it('applies lookup rate limit', async () => {
    process.env.RATE_LIMIT_SESSION_RECOVERY_LOOKUP_MAX = '1';
    process.env.RATE_LIMIT_SESSION_RECOVERY_LOOKUP_WINDOW_MS = '60000';

    const first = await invokeHandler({ fingerprint: 'fp-rate-limit-lookup' }, '10.0.0.3');
    const second = await invokeHandler({ fingerprint: 'fp-rate-limit-lookup' }, '10.0.0.3');

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(429);
    expect(second.payload.recovered).toBe(false);
    expect(second.payload.error).toBe('Too many requests, please try again later.');
  });

  it('applies redeem rate limit', async () => {
    process.env.RATE_LIMIT_SESSION_RECOVERY_REDEEM_MAX = '1';
    process.env.RATE_LIMIT_SESSION_RECOVERY_REDEEM_WINDOW_MS = '60000';

    const first = await invokeHandler({ recoveryToken: 'invalid.token' }, '10.0.0.4');
    const second = await invokeHandler({ recoveryToken: 'invalid.token' }, '10.0.0.4');

    expect(first.statusCode).toBe(200);
    expect(first.payload.recovered).toBe(false);

    expect(second.statusCode).toBe(429);
    expect(second.payload.recovered).toBe(false);
    expect(second.payload.error).toBe('Too many requests, please try again later.');
  });

  it('adds agent_id filter when agentId is provided', async () => {
    await invokeHandler(
      {
        fingerprint: 'fp-with-agent',
        agentId: 'agent-123',
      },
      '10.0.0.5'
    );

    expect(latestQuery).not.toBeNull();
    expect(latestQuery?.eq).toHaveBeenCalledWith('agent_id', 'agent-123');
  });

  it('returns recovered false on supabase unexpected error without throwing to caller', async () => {
    singleResult = {
      data: null,
      error: { code: 'XX000', message: 'database down' },
    };

    const result = await invokeHandler({ fingerprint: 'fp-db-error' }, '10.0.0.6');

    expect(result.statusCode).toBe(200);
    expect(result.payload.recovered).toBe(false);
    expect(result.payload.error).toBe('Internal server error');
  });

  it('stress test: concurrent redeem on same token allows exactly one success', async () => {
    process.env.RATE_LIMIT_SESSION_RECOVERY_REDEEM_MAX = '500';
    process.env.RATE_LIMIT_SESSION_RECOVERY_REDEEM_WINDOW_MS = '60000';

    singleResult = {
      data: {
        session_id: 'u_extreme_case',
        grade: 'A',
        last_active: '2026-02-13T11:00:00Z',
      },
      error: null,
    };

    const lookup = await invokeHandler({ fingerprint: 'fp-extreme' }, '10.0.0.7');
    const token = lookup.payload.recovery_token;
    expect(token).toBeDefined();

    const concurrentCount = 50;
    const results = await Promise.all(
      Array.from({ length: concurrentCount }, () =>
        invokeHandler({ recoveryToken: token }, '10.0.0.7')
      )
    );

    const successCount = results.filter((result) => result.payload.recovered).length;
    const rejectedCount = results.filter(
      (result) => !result.payload.recovered && result.payload.error === 'Invalid or expired recovery token'
    ).length;

    expect(successCount).toBe(1);
    expect(rejectedCount).toBe(concurrentCount - 1);
  });
});

