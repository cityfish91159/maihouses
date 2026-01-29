import { render, screen } from '@testing-library/react';
import { MessageList } from '../MessageList';
import type { Message } from '../../../types/messaging.types';

const baseMessage: Message = {
  id: '11111111-1111-1111-1111-111111111111',
  conversation_id: '22222222-2222-2222-2222-222222222222',
  sender_type: 'agent',
  sender_id: '33333333-3333-3333-3333-333333333333',
  content: 'Hello',
  created_at: new Date('2024-01-01T12:00:00Z').toISOString(),
  read_at: null,
};

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

describe('MessageList', () => {
  it('renders loading skeleton', () => {
    const { container } = render(<MessageList messages={[]} currentSender="agent" isLoading />);
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    render(<MessageList messages={[]} currentSender="agent" error={new Error('boom')} />);
    expect(screen.getByText('對話載入失敗，請稍後再試。')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<MessageList messages={[]} currentSender="agent" />);
    expect(screen.getByText('尚無訊息，先打聲招呼吧。')).toBeInTheDocument();
  });

  it('aligns current sender message to the right', () => {
    const { container } = render(<MessageList messages={[baseMessage]} currentSender="agent" />);
    expect(container.querySelector('.justify-end')).toBeTruthy();
  });

  it('aligns counterpart message to the left', () => {
    const otherMessage: Message = {
      ...baseMessage,
      id: '44444444-4444-4444-4444-444444444444',
      sender_type: 'consumer',
      content: 'Hi',
    };
    const { container } = render(<MessageList messages={[otherMessage]} currentSender="agent" />);
    expect(container.querySelector('.justify-start')).toBeTruthy();
  });
});
