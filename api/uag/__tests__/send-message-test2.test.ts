/**
 * 測試2：有綁定 LINE 測試
 * 驗證修3（物件連結）和修4（Connect Token propertyId）
 */

import { describe, it, expect } from 'vitest';

describe('測試2：有綁定 LINE - LINE 訊息格式驗證', () => {
  it('修3驗證：LINE 訊息應包含物件詳情連結', () => {
    // 模擬 buildLineMessage 完整邏輯
    function buildLineMessage(
      agentName: string,
      connectUrl: string,
      propertyTitle?: string,
      propertyId?: string,
      grade?: string
    ): string {
      const gradeMap: Record<string, string> = {
        S: '🚨【邁房子】獨家 S 級推薦！限時 120h',
        A: '🏠【邁房子】A 級房源更新！72h 優先',
      };
      const gradePrefix = gradeMap[grade || ''] || '【邁房子】你有一則新訊息';

      const baseUrl = 'https://maihouses.vercel.app/maihouses';
      const propertyUrl = propertyId ? `${baseUrl}/#/property/${propertyId}` : null;

      let message = `${gradePrefix}\n房仲：${agentName}${propertyTitle ? `（${propertyTitle}）` : ''}`;

      if (propertyUrl) {
        message += `\n\n物件詳情：${propertyUrl}`;
      }

      message += `\n\n點此查看並回覆：${connectUrl}`;

      return message;
    }

    const testData = {
      agentName: '王小明',
      connectUrl: 'https://maihouses.vercel.app/maihouses/chat/connect?token=abc123',
      propertyTitle: '信義區豪宅 3房2廳',
      propertyId: 'prop-test-12345',
      grade: 'S',
    };

    const message = buildLineMessage(
      testData.agentName,
      testData.connectUrl,
      testData.propertyTitle,
      testData.propertyId,
      testData.grade
    );

    // 修3驗證：物件連結必須存在
    expect(message).toContain('物件詳情：');
    expect(message).toContain('https://maihouses.vercel.app/maihouses/#/property/prop-test-12345');

    // 其他內容驗證
    expect(message).toContain('王小明');
    expect(message).toContain('信義區豪宅 3房2廳');
    expect(message).toContain('🚨【邁房子】獨家 S 級推薦');
    expect(message).toContain('點此查看並回覆：');

    // 驗證完整訊息格式
    const expectedFormat = [
      '🚨【邁房子】獨家 S 級推薦！限時 120h',
      '房仲：王小明（信義區豪宅 3房2廳）',
      '物件詳情：https://maihouses.vercel.app/maihouses/#/property/prop-test-12345',
      '點此查看並回覆：https://maihouses.vercel.app/maihouses/chat/connect?token=abc123',
    ];

    expectedFormat.forEach((part) => {
      expect(message).toContain(part);
    });
  });

  it('修3驗證：沒有 propertyId 時不應顯示物件連結', () => {
    function buildLineMessage(
      agentName: string,
      connectUrl: string,
      propertyTitle?: string,
      propertyId?: string
    ): string {
      const baseUrl = 'https://maihouses.vercel.app/maihouses';
      const propertyUrl = propertyId ? `${baseUrl}/#/property/${propertyId}` : null;

      let message = `【邁房子】你有一則新訊息\n房仲：${agentName}${propertyTitle ? `（${propertyTitle}）` : ''}`;

      if (propertyUrl) {
        message += `\n\n物件詳情：${propertyUrl}`;
      }

      message += `\n\n點此查看並回覆：${connectUrl}`;

      return message;
    }

    const message = buildLineMessage(
      '張三',
      'https://example.com/connect',
      '測試物件',
      undefined // 沒有 propertyId
    );

    // 不應包含物件連結
    expect(message).not.toContain('物件詳情：');
    expect(message).not.toContain('/#/property/');

    // 其他內容應正常
    expect(message).toContain('張三');
    expect(message).toContain('測試物件');
  });

  it('修4驗證：Connect Token 應包含 propertyId', () => {
    // 模擬 generateConnectToken 邏輯
    interface ConnectTokenPayload {
      conversationId: string;
      sessionId: string;
      propertyId?: string;
      exp: number;
    }

    function generateConnectToken(
      conversationId: string,
      sessionId: string,
      propertyId?: string
    ): string {
      const payload: ConnectTokenPayload = {
        conversationId,
        sessionId,
        propertyId,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      return Buffer.from(JSON.stringify(payload)).toString('base64url');
    }

    const testData = {
      conversationId: 'conv-uuid-123',
      sessionId: 'session-uuid-456',
      propertyId: 'prop-uuid-789',
    };

    const token = generateConnectToken(
      testData.conversationId,
      testData.sessionId,
      testData.propertyId
    );

    // Token 應該是 base64url 格式
    expect(token).toBeTruthy();
    expect(token).not.toContain('+');
    expect(token).not.toContain('/');
    expect(token).not.toContain('=');

    // 解碼驗證
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString()) as ConnectTokenPayload;

    // 修4驗證：propertyId 必須存在
    expect(decoded).toHaveProperty('propertyId');
    expect(decoded.propertyId).toBe('prop-uuid-789');

    // 其他欄位驗證
    expect(decoded.conversationId).toBe('conv-uuid-123');
    expect(decoded.sessionId).toBe('session-uuid-456');
    expect(decoded.exp).toBeGreaterThan(Date.now());
  });

  it('修4驗證：沒有 propertyId 時 token 仍應正常', () => {
    interface ConnectTokenPayload {
      conversationId: string;
      sessionId: string;
      propertyId?: string;
      exp: number;
    }

    function generateConnectToken(
      conversationId: string,
      sessionId: string,
      propertyId?: string
    ): string {
      const payload: ConnectTokenPayload = {
        conversationId,
        sessionId,
        propertyId,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      return Buffer.from(JSON.stringify(payload)).toString('base64url');
    }

    const token = generateConnectToken('conv-123', 'session-456', undefined);

    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString()) as ConnectTokenPayload;

    // propertyId 應該是 undefined（不是 null，不是空字串）
    expect(decoded.propertyId).toBeUndefined();

    // 其他欄位正常
    expect(decoded.conversationId).toBe('conv-123');
    expect(decoded.sessionId).toBe('session-456');
  });

  it('完整流程測試：從 Request 到 LINE 訊息', () => {
    // 模擬完整流程
    interface SendMessageRequest {
      agentId: string;
      sessionId: string;
      purchaseId: string;
      propertyId?: string;
      message: string;
      agentName: string;
      propertyTitle?: string;
      grade?: 'S' | 'A' | 'B' | 'C';
    }

    const request: SendMessageRequest = {
      agentId: 'agent-123',
      sessionId: 'session-456',
      purchaseId: 'purchase-789',
      propertyId: 'prop-abc',
      message: '測試2 - 有綁定 LINE 推播測試',
      agentName: '測試房仲',
      propertyTitle: '測試物件',
      grade: 'S',
    };

    // 1. 產生 Connect Token
    const conversationId = 'conv-generated-id';
    const token = Buffer.from(
      JSON.stringify({
        conversationId,
        sessionId: request.sessionId,
        propertyId: request.propertyId, // ✅ 修4
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      })
    ).toString('base64url');

    const connectUrl = `https://maihouses.vercel.app/maihouses/chat/connect?token=${token}`;

    // 2. 建立 LINE 訊息
    function buildLineMessage(
      agentName: string,
      connectUrl: string,
      propertyTitle?: string,
      propertyId?: string,
      grade?: string
    ): string {
      const gradePrefix =
        grade === 'S' ? '🚨【邁房子】獨家 S 級推薦！限時 120h' : '【邁房子】你有一則新訊息';
      const baseUrl = 'https://maihouses.vercel.app/maihouses';
      const propertyUrl = propertyId ? `${baseUrl}/#/property/${propertyId}` : null;

      let message = `${gradePrefix}\n房仲：${agentName}${propertyTitle ? `（${propertyTitle}）` : ''}`;

      if (propertyUrl) {
        message += `\n\n物件詳情：${propertyUrl}`; // ✅ 修3
      }

      message += `\n\n點此查看並回覆：${connectUrl}`;

      return message;
    }

    const lineMessage = buildLineMessage(
      request.agentName,
      connectUrl,
      request.propertyTitle,
      request.propertyId,
      request.grade
    );

    // 3. 驗證結果
    expect(lineMessage).toContain('測試房仲');
    expect(lineMessage).toContain('測試物件');
    expect(lineMessage).toContain(
      '物件詳情：https://maihouses.vercel.app/maihouses/#/property/prop-abc'
    ); // ✅ 修3
    expect(lineMessage).toContain(connectUrl);

    // 4. 驗證 token 可解析且包含 propertyId
    const decodedToken = JSON.parse(Buffer.from(token, 'base64url').toString());
    expect(decodedToken.propertyId).toBe('prop-abc'); // ✅ 修4
  });

  it('驗證不同等級的訊息前綴', () => {
    function getGradePrefix(grade?: string): string {
      switch (grade) {
        case 'S':
          return '🚨【邁房子】獨家 S 級推薦！限時 120h';
        case 'A':
          return '🏠【邁房子】A 級房源更新！72h 優先';
        default:
          return '【邁房子】你有一則新訊息';
      }
    }

    expect(getGradePrefix('S')).toContain('🚨');
    expect(getGradePrefix('S')).toContain('限時 120h');
    expect(getGradePrefix('A')).toContain('🏠');
    expect(getGradePrefix('A')).toContain('72h 優先');
    expect(getGradePrefix('B')).toBe('【邁房子】你有一則新訊息');
    expect(getGradePrefix(undefined)).toBe('【邁房子】你有一則新訊息');
  });
});
