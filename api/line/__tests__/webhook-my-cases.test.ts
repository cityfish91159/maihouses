/**
 * BE-4 | LINE webhook「我的交易」處理測試
 *
 * 測試 webhook 整合邏輯
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 3.4: 使用共用常數
import {
  TEST_LINE_USER_ID,
  TEST_CASE_ID,
  MY_CASES_KEYWORDS,
  MSG_NO_CASES,
  MSG_ERROR,
} from '../constants/my-cases';

// ============================================================================
// Test Data - 使用共用常數
// ============================================================================

const sampleCases = [
  {
    id: TEST_CASE_ID,
    propertyTitle: '信義區三房',
    agentName: '王小明',
    currentStep: 3,
    status: 'active' as const,
  },
];

function createMessageEvent(text: string, userId = TEST_LINE_USER_ID) {
  return {
    type: 'message',
    source: { type: 'user', userId },
    timestamp: Date.now(),
    replyToken: 'test-reply-token',
    message: { type: 'text', text },
  };
}

// ============================================================================
// Mock Setup
// ============================================================================

function createMockRes() {
  const res: Partial<VercelResponse> = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this as VercelResponse;
    },
    json(payload: unknown) {
      (this as { body?: unknown }).body = payload;
      return this as VercelResponse;
    },
    send(data: unknown) {
      (this as { body?: unknown }).body = data;
      return this as VercelResponse;
    },
  };
  return res as VercelResponse & { body?: unknown };
}

interface MockOptions {
  queryResult?: {
    success: boolean;
    data?: { cases: typeof sampleCases; total: number };
    error?: string;
    code?: string;
  };
}

function mockModules(options: MockOptions = {}) {
  const queryResult = options.queryResult ?? {
    success: true,
    data: { cases: sampleCases, total: 1 },
  };

  const replyMessage = vi.fn().mockResolvedValue({});

  vi.doMock('../../trust/services/case-query', () => ({
    queryMyCases: vi.fn().mockResolvedValue(queryResult),
  }));

  // 3.4: Mock 使用共用常數 MY_CASES_KEYWORDS
  vi.doMock('../formatters/my-cases-formatter', () => ({
    formatMyCasesReply: vi.fn((cases: unknown[]) =>
      cases.length === 0
        ? { type: 'text', text: MSG_NO_CASES }
        : {
            type: 'flex',
            altText: `您目前有 ${cases.length} 筆進行中的交易`,
            contents: {
              type: 'carousel',
              contents: [
                {
                  type: 'bubble',
                  body: { type: 'box', layout: 'vertical', contents: [] },
                },
              ],
            },
          }
    ),
    formatErrorReply: vi.fn(() => ({ type: 'text', text: MSG_ERROR })),
    // 使用共用常數，確保與實作同步
    isMyTransactionQuery: vi.fn((text: string | null) => {
      if (!text) return false;
      return MY_CASES_KEYWORDS.includes(text.trim() as (typeof MY_CASES_KEYWORDS)[number]);
    }),
  }));

  vi.doMock('@line/bot-sdk', () => ({
    messagingApi: {
      MessagingApiClient: class {
        replyMessage = replyMessage;
      },
    },
  }));

  vi.doMock('../../lib/sentry', () => ({
    withSentryHandler: (fn: Function) => fn,
    captureError: vi.fn(),
    addBreadcrumb: vi.fn(),
  }));

  vi.doMock('../../lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  }));

  return { replyMessage };
}

// ============================================================================
// Tests
// ============================================================================

describe('BE-4 LINE webhook「我的交易」', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test-token';
  });

  // 3.5: 測試全部 5 個關鍵字
  describe('關鍵字觸發測試', () => {
    it.each(MY_CASES_KEYWORDS)('「%s」觸發查詢並回覆', async (keyword) => {
      const { replyMessage } = mockModules();
      const { default: handler } = await import('../webhook');

      const req = {
        method: 'POST',
        headers: {},
        body: {
          events: [createMessageEvent(keyword)],
        },
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);

      expect(res.statusCode).toBe(200);
      expect(replyMessage).toHaveBeenCalledTimes(1);
      // 驗證回覆包含 Flex Message 或純文字
      expect(replyMessage).toHaveBeenCalledWith({
        replyToken: 'test-reply-token',
        messages: [expect.objectContaining({ type: expect.stringMatching(/^(flex|text)$/) })],
      });
    });
  });

  it('查詢失敗時回覆錯誤訊息', async () => {
    const { replyMessage } = mockModules({
      queryResult: { success: false, error: 'DB error', code: 'DB_ERROR' },
    });
    const { default: handler } = await import('../webhook');

    const req = {
      method: 'POST',
      headers: {},
      body: {
        events: [createMessageEvent('我的交易')],
      },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(replyMessage).toHaveBeenCalledWith({
      replyToken: 'test-reply-token',
      messages: [{ type: 'text', text: MSG_ERROR }],
    });
  });

  it('無案件時回覆空訊息', async () => {
    const { replyMessage } = mockModules({
      queryResult: { success: true, data: { cases: [], total: 0 } },
    });
    const { default: handler } = await import('../webhook');

    const req = {
      method: 'POST',
      headers: {},
      body: {
        events: [createMessageEvent('我的交易')],
      },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(replyMessage).toHaveBeenCalledWith({
      replyToken: 'test-reply-token',
      messages: [{ type: 'text', text: MSG_NO_CASES }],
    });
  });

  it('其他訊息不觸發查詢（回覆 User ID）', async () => {
    const { replyMessage } = mockModules();
    const { default: handler } = await import('../webhook');

    const req = {
      method: 'POST',
      headers: {},
      body: {
        events: [createMessageEvent('你好')],
      },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(replyMessage).toHaveBeenCalledWith({
      replyToken: 'test-reply-token',
      messages: [{ type: 'text', text: expect.stringContaining('LINE User ID') }],
    });
  });

  it('無 userId 時不處理訊息', async () => {
    const { replyMessage } = mockModules();
    const { default: handler } = await import('../webhook');

    const eventWithoutUserId = {
      type: 'message',
      source: { type: 'user' },
      timestamp: Date.now(),
      replyToken: 'test-reply-token',
      message: { type: 'text', text: '我的交易' },
    };

    const req = {
      method: 'POST',
      headers: {},
      body: {
        events: [eventWithoutUserId],
      },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(replyMessage).not.toHaveBeenCalled();
  });
});
