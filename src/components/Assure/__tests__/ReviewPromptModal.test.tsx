import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { ReviewPromptModal } from '../ReviewPromptModal';

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('../../../hooks/useAgentReviews', () => ({
  postAgentReview: vi.fn().mockResolvedValue({ reviewId: 'mock-review-1' }),
}));

describe('ReviewPromptModal', () => {
  const renderWithClient = (ui: ReactElement) => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  };

  const defaultProps = {
    open: true,
    agentId: 'agent-001',
    agentName: '測試經紀人',
    trustCaseId: 'case-001',
    onClose: vi.fn(),
    onSubmitted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('open=false 時不渲染', () => {
    const { container } = renderWithClient(
      <ReviewPromptModal {...defaultProps} open={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('顯示標題和星級按鈕', () => {
    renderWithClient(<ReviewPromptModal {...defaultProps} />);
    expect(screen.getByText('覺得這次帶看服務如何？')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /給 \d 顆星/ })).toHaveLength(5);
  });

  it('有 dialog role 和 aria-modal', () => {
    renderWithClient(<ReviewPromptModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('送出按鈕初始為 disabled（rating=0）', () => {
    renderWithClient(<ReviewPromptModal {...defaultProps} />);
    expect(screen.getByText('送出評價').closest('button')).toBeDisabled();
  });

  it('rating=0 時顯示提示文字', () => {
    renderWithClient(<ReviewPromptModal {...defaultProps} />);
    expect(screen.getByText('請選擇星級評價後才能送出')).toBeInTheDocument();
  });

  it('選擇星級後送出按鈕啟用且提示消失', async () => {
    const user = userEvent.setup();
    renderWithClient(<ReviewPromptModal {...defaultProps} />);

    await user.click(screen.getByLabelText('給 4 顆星'));

    expect(screen.getByText('送出評價').closest('button')).toBeEnabled();
    expect(screen.queryByText('請選擇星級評價後才能送出')).not.toBeInTheDocument();
  });

  it('點擊「稍後再說」呼叫 onClose', async () => {
    const user = userEvent.setup();
    renderWithClient(<ReviewPromptModal {...defaultProps} />);

    await user.click(screen.getByText('稍後再說'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('字數計數器在 >450 時變紅色', () => {
    renderWithClient(<ReviewPromptModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText('分享您的感受...');
    fireEvent.change(textarea, { target: { value: 'a'.repeat(451) } });

    const counter = screen.getByText(/\/500$/);
    expect(counter).toHaveClass('text-red-600');
  });

  it('字數計數器在 >400 時變琥珀色', () => {
    renderWithClient(<ReviewPromptModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText('分享您的感受...');
    fireEvent.change(textarea, { target: { value: 'a'.repeat(401) } });

    const counter = screen.getByText(/\/500$/);
    expect(counter).toHaveClass('text-amber-600');
  });

  it('選星級後送出呼叫 onSubmitted 和 onClose', async () => {
    const user = userEvent.setup();
    renderWithClient(<ReviewPromptModal {...defaultProps} />);

    await user.click(screen.getByLabelText('給 5 顆星'));
    await user.click(screen.getByText('送出評價'));

    await waitFor(() => {
      expect(defaultProps.onSubmitted).toHaveBeenCalledTimes(1);
    });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
