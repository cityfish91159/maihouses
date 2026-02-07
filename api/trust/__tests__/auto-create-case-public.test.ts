import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRequest, createMockResponse } from '../../__test-utils__/mockRequest';

const mockAutoCreateCaseHandler = vi.fn();

vi.mock('../_utils', () => ({
  SYSTEM_API_KEY: 'test-system-key',
}));

vi.mock('../auto-create-case', () => ({
  default: mockAutoCreateCaseHandler,
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('POST /api/trust/auto-create-case-public', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('非 POST/OPTIONS 應回傳 405，且不透傳到內部 handler', async () => {
    const handler = (await import('../auto-create-case-public')).default;
    const req = createMockRequest({
      method: 'GET',
      headers: { origin: 'https://maihouses.vercel.app' },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(405);
    expect(mockAutoCreateCaseHandler).not.toHaveBeenCalled();
  });

  it('不在白名單的 origin 應回傳 403', async () => {
    const handler = (await import('../auto-create-case-public')).default;
    const req = createMockRequest({
      method: 'POST',
      headers: { origin: 'https://evil-app.vercel.app' },
      body: { propertyId: 'MH-100001' },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(403);
    expect(mockAutoCreateCaseHandler).not.toHaveBeenCalled();
  });

  it('body 不合法時應回傳 400', async () => {
    const handler = (await import('../auto-create-case-public')).default;
    const req = createMockRequest({
      method: 'POST',
      headers: { origin: 'https://maihouses.vercel.app' },
      body: { propertyId: 'BAD_ID' },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect(mockAutoCreateCaseHandler).not.toHaveBeenCalled();
  });

  it('合法 POST 應注入 x-system-key 並透傳', async () => {
    const handler = (await import('../auto-create-case-public')).default;
    const req = createMockRequest({
      method: 'POST',
      headers: { origin: 'https://maihouses.vercel.app' },
      body: { propertyId: 'MH-100001' },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(req.headers['x-system-key']).toBe('test-system-key');
    expect(mockAutoCreateCaseHandler).toHaveBeenCalledTimes(1);
  });

  it('OPTIONS 應透傳到內部 handler', async () => {
    const handler = (await import('../auto-create-case-public')).default;
    const req = createMockRequest({
      method: 'OPTIONS',
      headers: { origin: 'https://maihouses.vercel.app' },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(mockAutoCreateCaseHandler).toHaveBeenCalledTimes(1);
  });
});
