import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AssetMonitor from '../AssetMonitor';
import type { Lead } from '../../types/uag.types';

// 測9/測10/測11: AssetMonitor 動態按鈕測試

const createMockLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: 'test-lead-001',
  name: '測試客戶',
  grade: 'A' as const,
  intent: 85,
  prop: '測試物件',
  visit: 3,
  price: 100,
  status: 'purchased' as const,
  ai: '高意向客戶',
  session_id: 'session-123',
  property_id: 'MH-100001',
  remainingHours: 24,
  ...overrides,
});

describe('AssetMonitor 動態按鈕', () => {
  describe('測9: 購買後立即發送流程', () => {
    it('已發送且有 conversation_id 時顯示「查看對話」按鈕', () => {
      const lead = createMockLead({
        notification_status: 'sent',
        conversation_id: 'conv-123',
      });

      render(<AssetMonitor leads={[lead]} />);

      expect(screen.getByText('查看對話')).toBeInTheDocument();
      expect(screen.queryByText('發送訊息')).not.toBeInTheDocument();
    });

    it('點擊「查看對話」觸發 onViewChat 回調', () => {
      const onViewChat = vi.fn();
      const lead = createMockLead({
        notification_status: 'sent',
        conversation_id: 'conv-123',
      });

      render(<AssetMonitor leads={[lead]} onViewChat={onViewChat} />);

      fireEvent.click(screen.getByText('查看對話'));
      expect(onViewChat).toHaveBeenCalledWith('conv-123');
    });

    it('notification_status 為 sent 時顯示正確的狀態徽章', () => {
      const lead = createMockLead({
        notification_status: 'sent',
        conversation_id: 'conv-123',
      });

      render(<AssetMonitor leads={[lead]} />);

      expect(screen.getByText('LINE + 站內信')).toBeInTheDocument();
    });

    it('notification_status 為 no_line 時顯示「僅站內信」', () => {
      const lead = createMockLead({
        notification_status: 'no_line',
        conversation_id: 'conv-123',
      });

      render(<AssetMonitor leads={[lead]} />);

      expect(screen.getByText('僅站內信')).toBeInTheDocument();
    });
  });

  describe('測10: 購買後稍後發送流程', () => {
    it('無 conversation_id 時顯示「發送訊息」按鈕', () => {
      const lead = createMockLead({
        notification_status: undefined,
        conversation_id: undefined,
      });

      render(<AssetMonitor leads={[lead]} />);

      expect(screen.getByText('發送訊息')).toBeInTheDocument();
      expect(screen.queryByText('查看對話')).not.toBeInTheDocument();
    });

    it('點擊「發送訊息」觸發 onSendMessage 回調', () => {
      const onSendMessage = vi.fn();
      const lead = createMockLead({
        notification_status: undefined,
        conversation_id: undefined,
      });

      render(<AssetMonitor leads={[lead]} onSendMessage={onSendMessage} />);

      fireEvent.click(screen.getByText('發送訊息'));
      expect(onSendMessage).toHaveBeenCalledWith(lead);
    });

    it('notification_status 為 undefined 時顯示「站內信已發送」', () => {
      const lead = createMockLead({
        notification_status: undefined,
      });

      render(<AssetMonitor leads={[lead]} />);

      expect(screen.getByText('站內信已發送')).toBeInTheDocument();
    });
  });

  describe('測11: 查看已發送對話流程', () => {
    it('多個 leads 正確渲染各自的按鈕狀態', () => {
      const sentLead = createMockLead({
        id: 'lead-sent',
        name: '已發送客戶',
        notification_status: 'sent',
        conversation_id: 'conv-sent',
      });

      const unsentLead = createMockLead({
        id: 'lead-unsent',
        name: '未發送客戶',
        notification_status: undefined,
        conversation_id: undefined,
      });

      render(<AssetMonitor leads={[sentLead, unsentLead]} />);

      expect(screen.getByText('查看對話')).toBeInTheDocument();
      expect(screen.getByText('發送訊息')).toBeInTheDocument();
    });

    it('onViewChat 未傳入時點擊不報錯', () => {
      const lead = createMockLead({
        notification_status: 'sent',
        conversation_id: 'conv-123',
      });

      render(<AssetMonitor leads={[lead]} />);

      expect(() => {
        fireEvent.click(screen.getByText('查看對話'));
      }).not.toThrow();
    });

    it('onSendMessage 未傳入時點擊不報錯', () => {
      const lead = createMockLead({
        notification_status: undefined,
        conversation_id: undefined,
      });

      render(<AssetMonitor leads={[lead]} />);

      expect(() => {
        fireEvent.click(screen.getByText('發送訊息'));
      }).not.toThrow();
    });
  });

  describe('通知狀態徽章', () => {
    const statusTests: Array<{
      status: Lead['notification_status'];
      expected: string;
    }> = [
      { status: 'sent', expected: 'LINE + 站內信' },
      { status: 'no_line', expected: '僅站內信' },
      { status: 'unreachable', expected: 'LINE 無法送達' },
      { status: 'pending', expected: '待發送' },
      { status: 'failed', expected: 'LINE 發送失敗' },
      { status: 'skipped', expected: '僅站內信' },
    ];

    statusTests.forEach(({ status, expected }) => {
      it(`notification_status="${status}" 顯示「${expected}」`, () => {
        const lead = createMockLead({
          notification_status: status,
          conversation_id: 'conv-123',
        });

        render(<AssetMonitor leads={[lead]} />);

        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });
  });

  describe('空資料處理', () => {
    it('leads 為空陣列時顯示空狀態提示', () => {
      render(<AssetMonitor leads={[]} />);

      expect(screen.getByText('尚無已購資產，請從上方雷達進攻。')).toBeInTheDocument();
    });

    it('只有 status=new 的 leads 時顯示空狀態提示', () => {
      const newLead = createMockLead({ status: 'new' as const });

      render(<AssetMonitor leads={[newLead]} />);

      expect(screen.getByText('尚無已購資產，請從上方雷達進攻。')).toBeInTheDocument();
    });
  });
});
