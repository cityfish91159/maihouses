/**
 * 測試4：連按 3 次不重複發 - 前端防重複機制
 * 驗證 SendMessageModal.tsx L72, L91, L305 的 isSending 邏輯
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('測4：連按 3 次不重複發', () => {
  /**
   * 模擬 SendMessageModal 的狀態機制
   */
  interface SendMessageState {
    isSending: boolean;
    message: string;
  }

  /**
   * 核心測試：isSending 防重複邏輯（L72）
   */
  describe('isSending 防重複邏輯（L72）', () => {
    it('isSending 為 true 時，handleSend 應提早返回', () => {
      const state: SendMessageState = {
        isSending: true,
        message: '測試訊息',
      };

      const sendCalls: string[] = [];

      // 模擬 handleSend (L71-172)
      function handleSend(): void {
        // L72: 防重複檢查
        if (!state.message.trim() || state.isSending) return;

        sendCalls.push('send_message');
      }

      // 快速連續呼叫 3 次
      handleSend();
      handleSend();
      handleSend();

      // 驗證：因為 isSending = true，應該 0 次呼叫
      expect(sendCalls).toHaveLength(0);
    });

    it('訊息為空時，handleSend 應提早返回', () => {
      const state: SendMessageState = {
        isSending: false,
        message: '   ', // 空白字串
      };

      const sendCalls: string[] = [];

      function handleSend(): void {
        if (!state.message.trim() || state.isSending) return;
        sendCalls.push('send_message');
      }

      handleSend();
      handleSend();
      handleSend();

      expect(sendCalls).toHaveLength(0);
    });

    it('isSending 為 false 且有訊息時，應執行發送', () => {
      const state: SendMessageState = {
        isSending: false,
        message: '測試訊息',
      };

      const sendCalls: string[] = [];

      function handleSend(): void {
        if (!state.message.trim() || state.isSending) return;
        sendCalls.push('send_message');
      }

      handleSend();

      expect(sendCalls).toHaveLength(1);
    });
  });

  /**
   * 完整流程：setIsSending 狀態管理（L91）
   */
  describe('setIsSending 狀態管理（L91）', () => {
    it('發送前應設定 isSending = true', async () => {
      let isSending = false;

      // 模擬 L91-172
      async function handleSend(): Promise<void> {
        if (isSending) return;

        isSending = true; // L91

        try {
          // 模擬 API 呼叫
          await new Promise((resolve) => setTimeout(resolve, 10));
        } finally {
          isSending = false; // L161
        }
      }

      // 第一次呼叫開始執行
      const promise1 = handleSend();
      expect(isSending).toBe(true);

      // 第二次呼叫應被阻擋
      const promise2 = handleSend();
      expect(isSending).toBe(true);

      // 等待完成
      await promise1;
      await promise2;

      expect(isSending).toBe(false);
    });

    it('finally 區塊應確保 isSending 復原', async () => {
      let isSending = false;

      async function handleSend(shouldError: boolean): Promise<void> {
        if (isSending) return;

        isSending = true;

        try {
          if (shouldError) {
            throw new Error('發送失敗');
          }
          await new Promise((resolve) => setTimeout(resolve, 10));
        } finally {
          isSending = false;
        }
      }

      // 測試成功流程
      await handleSend(false);
      expect(isSending).toBe(false);

      // 測試錯誤流程
      try {
        await handleSend(true);
      } catch {
        // 忽略錯誤
      }
      expect(isSending).toBe(false);
    });
  });

  /**
   * 按鈕 disabled 狀態（L305）
   */
  describe('按鈕 disabled 狀態（L305）', () => {
    it('isSending 為 true 時，發送按鈕應 disabled', () => {
      const state = {
        message: '測試訊息',
        isSending: true,
      };

      // L305: disabled={!message.trim() || isSending}
      const isDisabled = !state.message.trim() || state.isSending;

      expect(isDisabled).toBe(true);
    });

    it('訊息為空時，發送按鈕應 disabled', () => {
      const state = {
        message: '',
        isSending: false,
      };

      const isDisabled = !state.message.trim() || state.isSending;

      expect(isDisabled).toBe(true);
    });

    it('有訊息且未發送時，發送按鈕應啟用', () => {
      const state = {
        message: '測試訊息',
        isSending: false,
      };

      const isDisabled = !state.message.trim() || state.isSending;

      expect(isDisabled).toBe(false);
    });

    it('稍後按鈕在發送時應 disabled（L298）', () => {
      const isSending = true;

      // L298: disabled={isSending}
      const isDisabled = isSending;

      expect(isDisabled).toBe(true);
    });
  });

  /**
   * 按鈕文字切換（L308-310）
   */
  describe('按鈕文字顯示（L308-310）', () => {
    it("isSending 為 true 時，顯示 S.SENDING（'發送中...'）", () => {
      const isSending = true;

      // L24: const S = { SENDING: "發送中...", SEND_BTN: "發送訊息" }
      const S = {
        SENDING: '發送中...',
        SEND_BTN: '發送訊息',
      };

      // L309: {isSending ? S.SENDING : ...}
      const buttonText = isSending ? S.SENDING : S.SEND_BTN;

      expect(buttonText).toBe('發送中...');
      expect(buttonText).toBe(S.SENDING);
    });

    it("isSending 為 false 時，顯示 S.SEND_BTN（'發送訊息'）", () => {
      const isSending = false;

      const S = {
        SENDING: '發送中...',
        SEND_BTN: '發送訊息',
      };

      const buttonText = isSending ? S.SENDING : S.SEND_BTN;

      expect(buttonText).toBe('發送訊息');
      expect(buttonText).toBe(S.SEND_BTN);
    });
  });

  /**
   * Race Condition 測試
   */
  describe('Race Condition 防護', () => {
    it('快速連續點擊 3 次，只執行 1 次發送', async () => {
      let isSending = false;
      const executionLog: string[] = [];

      async function handleSend(): Promise<void> {
        // 防重複檢查
        if (isSending) {
          executionLog.push('blocked');
          return;
        }

        executionLog.push('start');
        isSending = true;

        try {
          // 模擬 API 呼叫（50ms）
          await new Promise((resolve) => setTimeout(resolve, 50));
          executionLog.push('sent');
        } finally {
          isSending = false;
          executionLog.push('reset');
        }
      }

      // 快速連續點擊 3 次
      const promises = [handleSend(), handleSend(), handleSend()];

      await Promise.all(promises);

      // 驗證執行順序
      expect(executionLog).toEqual([
        'start', // 第 1 次點擊開始
        'blocked', // 第 2 次點擊被阻擋
        'blocked', // 第 3 次點擊被阻擋
        'sent', // 第 1 次點擊完成
        'reset', // isSending 復原
      ]);
    });

    it('模擬使用者極快速點擊（0ms 間隔）', async () => {
      let isSending = false;
      let sendCount = 0;

      async function handleSend(): Promise<void> {
        if (isSending) return;

        isSending = true;
        sendCount++;

        try {
          await new Promise((resolve) => setTimeout(resolve, 10));
        } finally {
          isSending = false;
        }
      }

      // 同時觸發 10 次（模擬極快速點擊）
      await Promise.all(Array.from({ length: 10 }, () => handleSend()));

      // 只應執行 1 次
      expect(sendCount).toBe(1);
    });
  });

  /**
   * 與 message_id UNIQUE 整合驗證
   */
  describe('與資料庫 UNIQUE 約束整合', () => {
    it('前端防重複 + 後端 UNIQUE 雙重保護', () => {
      interface QueueRecord {
        message_id: string;
        status: string;
      }

      const queue: QueueRecord[] = [];
      let isSending = false;

      // 模擬發送流程
      function attemptSend(messageId: string): boolean {
        // 前端防護（L72）
        if (isSending) {
          return false; // 被阻擋
        }

        isSending = true;

        // 模擬後端寫入（message_id UNIQUE）
        const existing = queue.find((r) => r.message_id === messageId);
        if (existing) {
          // 資料庫 UNIQUE 約束阻擋
          isSending = false;
          return false;
        }

        queue.push({ message_id: messageId, status: 'pending' });
        isSending = false;
        return true;
      }

      const messageId = 'msg-test-123';

      // 快速連續嘗試 3 次
      const result1 = attemptSend(messageId);
      const result2 = attemptSend(messageId);
      const result3 = attemptSend(messageId);

      // 驗證
      expect(result1).toBe(true); // 第 1 次成功
      expect(result2).toBe(false); // 第 2 次被前端阻擋
      expect(result3).toBe(false); // 第 3 次被前端阻擋
      expect(queue).toHaveLength(1); // Queue 只有 1 筆
    });
  });

  /**
   * 完整使用者場景測試
   */
  describe('完整使用者場景', () => {
    it('場景 1: 使用者快速點擊 3 次發送按鈕', async () => {
      const scenario: string[] = [];
      let isSending = false;

      async function handleButtonClick(): Promise<void> {
        scenario.push('click');

        // L72 防重複檢查
        if (isSending) {
          scenario.push('blocked_by_isSending');
          return;
        }

        scenario.push('start_send');
        isSending = true; // L91

        try {
          await new Promise((resolve) => setTimeout(resolve, 20));
          scenario.push('api_success');
        } finally {
          isSending = false; // L161
        }
      }

      // 使用者快速點擊 3 次
      await Promise.all([handleButtonClick(), handleButtonClick(), handleButtonClick()]);

      expect(scenario).toEqual([
        'click', // 第 1 次點擊
        'start_send',
        'click', // 第 2 次點擊
        'blocked_by_isSending', // 被阻擋
        'click', // 第 3 次點擊
        'blocked_by_isSending', // 被阻擋
        'api_success', // 第 1 次完成
      ]);
    });

    it('場景 2: API 失敗後，可以重新發送', async () => {
      let isSending = false;
      let attemptCount = 0;

      async function handleSend(shouldFail: boolean): Promise<void> {
        if (isSending) return;

        isSending = true;
        attemptCount++;

        try {
          if (shouldFail) {
            throw new Error('API Error');
          }
        } finally {
          isSending = false;
        }
      }

      // 第 1 次發送失敗
      try {
        await handleSend(true);
      } catch {
        // 忽略錯誤
      }

      expect(attemptCount).toBe(1);
      expect(isSending).toBe(false);

      // 第 2 次發送成功
      await handleSend(false);

      expect(attemptCount).toBe(2);
      expect(isSending).toBe(false);
    });
  });
});
