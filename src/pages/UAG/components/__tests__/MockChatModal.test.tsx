import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Lead } from '../../types/uag.types';
import { MockChatModal } from '../MockChatModal';

const createLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: 'lead-001',
  name: '買家 S-5566',
  grade: 'S',
  intent: 98,
  prop: '捷運宅',
  visit: 15,
  price: 20,
  status: 'purchased',
  ai: 'S 級熱度拉滿，請優先處理。',
  session_id: 'sess-S5566-abc123',
  property_id: 'MH-100001',
  conversation_id: 'mock-conv-S5566-001',
  ...overrides,
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('MockChatModal', () => {
  it('帶入既有 conversation_id 時顯示歷史訊息', () => {
    render(
      <MockChatModal
        isOpen={true}
        onClose={vi.fn()}
        lead={createLead()}
        conversationId="mock-conv-S5566-001"
      />
    );

    expect(screen.getByRole('dialog', { name: 'Mock 客戶對話' })).toBeInTheDocument();
    expect(
      screen.getByText('你好，我確實在看捷運站附近的房子，有什麼推薦嗎？')
    ).toBeInTheDocument();
  });

  it('找不到對話資料時顯示空狀態，不會崩潰', () => {
    render(
      <MockChatModal
        isOpen={true}
        onClose={vi.fn()}
        lead={createLead({ conversation_id: 'mock-conv-missing-001' })}
        conversationId="mock-conv-missing-001"
      />
    );

    expect(screen.getByText('尚無歷史訊息，現在就開始第一句對話吧。')).toBeInTheDocument();
  });

  it('發送訊息後顯示 typing，延遲後收到自動回覆', () => {
    vi.useFakeTimers();

    render(
      <MockChatModal
        isOpen={true}
        onClose={vi.fn()}
        lead={createLead({ conversation_id: 'mock-conv-missing-001' })}
        conversationId="mock-conv-missing-001"
      />
    );

    const input = screen.getByLabelText('輸入訊息');
    fireEvent.change(input, { target: { value: '請問這週末可以安排看屋嗎？' } });
    fireEvent.click(screen.getByRole('button', { name: '發送' }));

    expect(screen.getByText('請問這週末可以安排看屋嗎？')).toBeInTheDocument();
    expect(screen.getByText('對方輸入中…')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(screen.queryByText('對方輸入中…')).not.toBeInTheDocument();
    expect(screen.getByText('好的，我了解了，謝謝你的說明！')).toBeInTheDocument();
  });

  it('支援 Ctrl+Enter 快捷發送', () => {
    vi.useFakeTimers();

    render(
      <MockChatModal
        isOpen={true}
        onClose={vi.fn()}
        lead={createLead({ conversation_id: 'mock-conv-missing-001' })}
        conversationId="mock-conv-missing-001"
      />
    );

    const input = screen.getByLabelText('輸入訊息');
    fireEvent.change(input, { target: { value: 'Ctrl+Enter 測試訊息' } });
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });

    expect(screen.getByText('Ctrl+Enter 測試訊息')).toBeInTheDocument();
  });

  it('按下 Escape 只觸發一次關閉', () => {
    const onClose = vi.fn();
    render(
      <MockChatModal
        isOpen={true}
        onClose={onClose}
        lead={createLead()}
        conversationId="mock-conv-S5566-001"
      />
    );

    const dialog = screen.getByRole('dialog', { name: 'Mock 客戶對話' });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Tab / Shift+Tab 會在 modal 內循環焦點', () => {
    render(
      <MockChatModal
        isOpen={true}
        onClose={vi.fn()}
        lead={createLead()}
        conversationId="mock-conv-S5566-001"
      />
    );

    const closeButton = screen.getByRole('button', { name: '關閉對話' });
    const input = screen.getByLabelText('輸入訊息');

    input.focus();
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);

    closeButton.focus();
    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(input);
  });

  it('關閉後焦點會回到觸發元素', async () => {
    function FocusHarness(): React.ReactElement {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            開啟對話
          </button>
          <MockChatModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            lead={createLead()}
            conversationId="mock-conv-S5566-001"
          />
        </>
      );
    }

    render(<FocusHarness />);

    const trigger = screen.getByRole('button', { name: '開啟對話' });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Mock 客戶對話' });
    fireEvent.keyDown(dialog, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Mock 客戶對話' })).not.toBeInTheDocument();
    });
    expect(document.activeElement).toBe(trigger);
  });
});
