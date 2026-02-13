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

vi.mock('../../hooks/usePageMode', () => ({
  usePageMode: () => 'demo',
}));

vi.mock('../../hooks/useAgentReviews', () => ({
  fetchAgentReviews: vi.fn(),
  agentReviewsQueryKey: (_mode: string, agentId: string, page = 1, limit = 10) => [
    'agent-reviews',
    _mode,
    agentId,
    page,
    limit,
  ],
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
    agentName: '測試房仲',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open=false', () => {
    const { container } = renderWithClient(<AgentReviewListModal {...defaultProps} open={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal title with agent name', async () => {
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('測試房仲 的服務評價')).toBeInTheDocument();
    });
  });

  it('keeps dialog accessibility attributes', () => {
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose when clicking close button', async () => {
    const user = userEvent.setup();
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    await user.click(screen.getByLabelText('返回'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows demo reviews for mock agent id', async () => {
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('4.8')).toBeInTheDocument();
    });
    expect(screen.getByText('(32 則評價)')).toBeInTheDocument();
  });

  it('shows empty state when total is zero', async () => {
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
        agentName="零評價房仲"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('尚無評價')).toBeInTheDocument();
    });
  });

  it('wires useFocusTrap with escape callback', () => {
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    expect(mockedUseFocusTrap).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        onEscape: defaultProps.onClose,
      })
    );
  });
});
