import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { AgentReviewListModal } from '../AgentReviewListModal';
import { fetchAgentReviews } from '../../hooks/useAgentReviews';
import { useFocusTrap } from '../../hooks/useFocusTrap';

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('../../hooks/useAgentReviews', () => ({
  fetchAgentReviews: vi.fn(),
}));

const mockedFetchAgentReviews = vi.mocked(fetchAgentReviews);
const mockedUseFocusTrap = vi.mocked(useFocusTrap);

describe('AgentReviewListModal', () => {
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
    agentId: 'mock-agent-1',
    agentName: '測試經紀人',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('open=false 時不渲染任何內容', () => {
    const { container } = renderWithClient(
      <AgentReviewListModal {...defaultProps} open={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('顯示經紀人名稱', async () => {
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('測試經紀人 的服務評價')).toBeInTheDocument();
    });
  });

  it('有 dialog role 和 aria-modal', () => {
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('點擊返回按鈕呼叫 onClose', async () => {
    const user = userEvent.setup();
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    await user.click(screen.getByLabelText('返回'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('mock agentId 使用 demo 資料，顯示評價分佈', async () => {
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('4.8')).toBeInTheDocument();
    });
    expect(screen.getByText('(32 則評價)')).toBeInTheDocument();
  });

  it('mock 資料顯示載入更多按鈕（表示有評論列表）', async () => {
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('載入更多...')).toBeInTheDocument();
    });
  });

  it('total=0 時顯示「尚無評價」而非 NaN', async () => {
    mockedFetchAgentReviews.mockResolvedValueOnce({
      reviews: [],
      total: 0,
      avgRating: 0,
      distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
    });

    renderWithClient(
      <AgentReviewListModal
        open={true}
        agentId="real-agent-zero"
        agentName="零評價經紀人"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('尚無評價')).toBeInTheDocument();
    });
  });

  it('顯示「載入更多」按鈕並能點擊', async () => {
    const user = userEvent.setup();
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('載入更多...')).toBeInTheDocument();
    });
    await user.click(screen.getByText('載入更多...'));
  });

  it('useFocusTrap 被呼叫且傳入 onEscape', () => {
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    expect(mockedUseFocusTrap).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        onEscape: defaultProps.onClose,
      })
    );
  });

  it('aria-labelledby 連結到標題 h2', () => {
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).toBeTruthy();
    const heading = screen.getByText('測試經紀人 的服務評價');
    expect(heading.id).toBe(labelledById);
  });
});
