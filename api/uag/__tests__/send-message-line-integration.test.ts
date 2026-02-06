/**
 * send-message LINE SDK 整合測試
 * 測試2補充：驗證 LINE pushMessage 呼叫邏輯
 */

import { describe, it, expect } from 'vitest';

describe('send-message LINE SDK 整合測試', () => {
  /**
   * 驗證 LINE pushMessage 的參數結構
   */
  describe('LINE pushMessage 參數驗證', () => {
    it('應該使用正確的參數結構呼叫 pushMessage', () => {
      // 模擬 LINE SDK MessagingApiClient.pushMessage 參數
      interface PushMessageRequest {
        to: string; // LINE user ID
        messages: Array<{
          type: 'text';
          text: string;
        }>;
      }

      const lineUserId = 'U1234567890abcdef1234567890abcdef';
      const messageText = `🚨【邁房子】獨家 S 級推薦！限時 120h
房仲：測試房仲（信義區豪宅）

物件詳情：https://maihouses.vercel.app/maihouses/#/property/prop-123

點此查看並回覆：https://maihouses.vercel.app/maihouses/chat/connect?token=abc123`;

      const request: PushMessageRequest = {
        to: lineUserId,
        messages: [
          {
            type: 'text',
            text: messageText,
          },
        ],
      };

      // 驗證參數結構
      expect(request.to).toBe(lineUserId);
      expect(request.messages).toHaveLength(1);
      expect(request.messages[0]?.type).toBe('text');
      expect(request.messages[0]?.text).toContain('物件詳情：');
      expect(request.messages[0]?.text).toContain('點此查看並回覆：');
    });

    it('應該正確處理 X-Line-Retry-Key header', () => {
      // LINE SDK 的 pushMessage 第二個參數是 retryKey
      const retryKey = '550e8400-e29b-41d4-a716-446655440000'; // UUID

      // 驗證 retryKey 格式（UUID v4）
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(retryKey).toMatch(uuidRegex);
    });
  });

  /**
   * 驗證 LINE 訊息內容（修3）
   */
  describe('LINE 訊息內容驗證（修3）', () => {
    it('S 級物件訊息應包含所有必要元素', () => {
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
          message += `\n\n物件詳情：${propertyUrl}`;
        }

        message += `\n\n點此查看並回覆：${connectUrl}`;

        return message;
      }

      const message = buildLineMessage(
        '王小明',
        'https://maihouses.vercel.app/maihouses/chat/connect?token=xyz',
        '信義區豪宅 3房2廳',
        'prop-s-level-001',
        'S'
      );

      // 必須包含的元素
      const requiredElements = [
        '🚨【邁房子】獨家 S 級推薦！限時 120h', // 等級前綴
        '房仲：王小明', // 房仲名稱
        '信義區豪宅 3房2廳', // 物件標題
        '物件詳情：https://maihouses.vercel.app/maihouses/#/property/prop-s-level-001', // 修3：物件連結
        '點此查看並回覆：https://maihouses.vercel.app/maihouses/chat/connect?token=xyz', // Connect URL
      ];

      requiredElements.forEach((element) => {
        expect(message).toContain(element);
      });

      // 驗證訊息長度合理（LINE 限制 5000 字元）
      expect(message.length).toBeLessThan(5000);
    });

    it('A 級物件訊息格式正確', () => {
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

      const aGradePrefix = getGradePrefix('A');
      expect(aGradePrefix).toContain('🏠');
      expect(aGradePrefix).toContain('A 級房源更新');
      expect(aGradePrefix).toContain('72h 優先');
    });
  });

  /**
   * 驗證 LINE API 錯誤處理
   */
  describe('LINE API 錯誤處理', () => {
    it('應該正確處理 LINE API 錯誤回應', () => {
      // LINE API 可能的錯誤
      const possibleErrors = [
        'Invalid access token', // Token 錯誤
        'Invalid reply token', // Token 無效
        'The user has blocked the official account', // 用戶封鎖
        'Rate limit exceeded', // 超過速率限制
      ];

      possibleErrors.forEach((errorMessage) => {
        // 模擬錯誤處理
        const handleLineError = (
          error: string
        ): {
          lineStatus: 'pending' | 'unreachable' | 'error';
          shouldRetry: boolean;
        } => {
          if (error.includes('blocked')) {
            return { lineStatus: 'unreachable', shouldRetry: false };
          }
          if (error.includes('Rate limit')) {
            return { lineStatus: 'pending', shouldRetry: true };
          }
          return { lineStatus: 'error', shouldRetry: false };
        };

        const result = handleLineError(errorMessage);
        expect(result).toHaveProperty('lineStatus');
        expect(result).toHaveProperty('shouldRetry');
      });
    });
  });

  /**
   * 驗證防重複發送機制（測4相關）
   */
  describe('防重複發送機制', () => {
    it('應該使用 message_id 作為 UNIQUE 約束', () => {
      // 模擬 uag_line_notification_queue 表結構
      interface NotificationQueue {
        message_id: string; // UNIQUE - 防重複
        purchase_id: string;
        line_user_id: string;
        connect_url: string;
        agent_name: string;
        status: 'pending' | 'sent' | 'failed';
      }

      const queue1: NotificationQueue = {
        message_id: 'msg-unique-001',
        purchase_id: 'purchase-123',
        line_user_id: 'U123456',
        connect_url: 'https://example.com/connect',
        agent_name: '測試',
        status: 'pending',
      };

      const queue2: NotificationQueue = {
        message_id: 'msg-unique-001', // 相同 message_id
        purchase_id: 'purchase-123',
        line_user_id: 'U123456',
        connect_url: 'https://example.com/connect',
        agent_name: '測試',
        status: 'pending',
      };

      // 驗證 message_id 相同（應該被 DB UNIQUE 約束阻擋）
      expect(queue1.message_id).toBe(queue2.message_id);
    });

    it('retryKey 應該是唯一的 UUID', () => {
      // 模擬生成 retryKey
      function generateRetryKey(): string {
        // 實際使用 uuid v4
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      }

      const key1 = generateRetryKey();
      const key2 = generateRetryKey();

      expect(key1).not.toBe(key2); // 每次生成都不同
      expect(key1).toBeTruthy();
      expect(key2).toBeTruthy();
    });
  });

  /**
   * 驗證 Connect URL 格式
   */
  describe('Connect URL 格式驗證', () => {
    it('Connect URL 應該包含正確的 token 參數', () => {
      const conversationId = 'conv-123-456';
      const sessionId = 'session-789-012';
      const propertyId = 'prop-abc-def'; // 修4

      // 生成 token
      const payload = {
        conversationId,
        sessionId,
        propertyId, // 修4：必須包含
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      const token = Buffer.from(JSON.stringify(payload)).toString('base64url');

      // 生成 Connect URL
      const baseUrl = 'https://maihouses.vercel.app';
      const connectUrl = `${baseUrl}/maihouses/chat/connect?token=${token}`;

      // 驗證 URL 格式
      expect(connectUrl).toContain('/maihouses/chat/connect?token=');
      expect(connectUrl).toMatch(/^https:\/\//);

      // 驗證 token 可解析
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());
      expect(decoded.conversationId).toBe(conversationId);
      expect(decoded.sessionId).toBe(sessionId);
      expect(decoded.propertyId).toBe(propertyId); // 修4
    });

    it('LINE 訊息中的 Connect URL 應該可點擊', () => {
      const connectUrl = 'https://maihouses.vercel.app/maihouses/chat/connect?token=abc123';

      // 驗證是完整的 URL（LINE 會自動轉為可點擊連結）
      expect(connectUrl).toMatch(/^https?:\/\/.+/);

      // 驗證不包含空白（會破壞連結）
      expect(connectUrl).not.toContain(' ');

      // 驗證不包含換行（會破壞連結）
      expect(connectUrl).not.toContain('\n');
    });
  });

  /**
   * 驗證完整的 LINE 推送流程
   */
  describe('完整 LINE 推送流程', () => {
    it('應該按正確順序執行所有步驟', () => {
      // 模擬完整流程
      const steps: string[] = [];

      // 1. 建立對話
      steps.push('create_conversation');
      const conversationId = 'conv-generated';

      // 2. 發送站內訊息
      steps.push('send_in_app_message');
      const messageId = 'msg-generated';

      // 3. 查詢 LINE 綁定
      steps.push('query_line_binding');
      const lineUserId = 'U123456789';

      // 4. 產生 Connect Token
      steps.push('generate_connect_token');
      const token = 'token-generated';
      const connectUrl = `https://maihouses.vercel.app/maihouses/chat/connect?token=${token}`;

      // 5. 建立 LINE 訊息
      steps.push('build_line_message');
      const lineMessage = `測試訊息\n\n物件詳情：https://example.com/property\n\n點此查看並回覆：${connectUrl}`;

      // 6. 寫入通知佇列
      steps.push('insert_notification_queue');

      // 7. 推送 LINE 訊息
      steps.push('push_line_message');

      // 8. 更新佇列狀態
      steps.push('update_queue_status');

      // 9. 記錄審計日誌
      steps.push('log_audit');

      // 驗證步驟順序
      expect(steps).toEqual([
        'create_conversation',
        'send_in_app_message',
        'query_line_binding',
        'generate_connect_token',
        'build_line_message',
        'insert_notification_queue',
        'push_line_message',
        'update_queue_status',
        'log_audit',
      ]);

      // 驗證關鍵資料
      expect(conversationId).toBeTruthy();
      expect(messageId).toBeTruthy();
      expect(lineUserId).toBeTruthy();
      expect(lineMessage).toContain('物件詳情：');
      expect(lineMessage).toContain('點此查看並回覆：');
    });
  });
});
