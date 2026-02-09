vi.mock('../../config/env', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://mock.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'mock-key',
  },
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { createLead } from '../leadService';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockCreateLeadSuccess() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        leadId: 'lead-001',
        agentId: 'agent-001',
      },
    }),
  });
}

function getRequestBody() {
  const call = mockFetch.mock.calls[0] as [string, RequestInit];
  const body = call[1]?.body;
  return JSON.parse(String(body)) as {
    needsDescription?: string;
  };
}

describe('leadService createLead preferredChannel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('line + needsDescription 時，應加上 [偏好聯絡：LINE] 前綴', async () => {
    mockCreateLeadSuccess();

    const result = await createLead({
      customerName: '王小明',
      customerPhone: '0912345678',
      agentId: 'agent-001',
      propertyId: 'MH-100001',
      source: 'sidebar',
      preferredChannel: 'line',
      needsDescription: '希望本週看屋',
    });

    expect(result.success).toBe(true);
    expect(getRequestBody().needsDescription).toBe('[偏好聯絡：LINE] 希望本週看屋');
  });

  it('phone 且無 needsDescription 時，應只送出 [偏好聯絡：電話]', async () => {
    mockCreateLeadSuccess();

    const result = await createLead({
      customerName: '王小明',
      customerPhone: '0912345678',
      agentId: 'agent-001',
      propertyId: 'MH-100001',
      source: 'sidebar',
      preferredChannel: 'phone',
    });

    expect(result.success).toBe(true);
    expect(getRequestBody().needsDescription).toBe('[偏好聯絡：電話]');
  });

  it('message + needsDescription 時，應加上 [偏好聯絡：站內訊息] 前綴', async () => {
    mockCreateLeadSuccess();

    const result = await createLead({
      customerName: '王小明',
      customerPhone: '0912345678',
      agentId: 'agent-001',
      propertyId: 'MH-100001',
      source: 'sidebar',
      preferredChannel: 'message',
      needsDescription: '請先站內留言',
    });

    expect(result.success).toBe(true);
    expect(getRequestBody().needsDescription).toBe('[偏好聯絡：站內訊息] 請先站內留言');
  });

  it('未提供 preferredChannel 時，should 保留原 needsDescription', async () => {
    mockCreateLeadSuccess();

    const result = await createLead({
      customerName: '王小明',
      customerPhone: '0912345678',
      agentId: 'agent-001',
      propertyId: 'MH-100001',
      source: 'sidebar',
      needsDescription: '只想了解管理費',
    });

    expect(result.success).toBe(true);
    expect(getRequestBody().needsDescription).toBe('只想了解管理費');
  });
});
