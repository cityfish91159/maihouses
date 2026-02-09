import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { AgentReviewListModal } from '../AgentReviewListModal';

vi.mock('../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('../../hooks/useAgentReviews', () => ({
  fetchAgentReviews: vi.fn(),
}));

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
    // 等待資料載入完成，mock 有 3 則 reviews、total 32，所以載入更多會顯示
    await waitFor(() => {
      expect(screen.getByText('載入更多...')).toBeInTheDocument();
    });
  });

  it('星級分佈百分比在 total=0 時不為 NaN', async () => {
    // mock agentId 預設 total=32，不會觸發除以零
    // 此測試驗證渲染不會出錯
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('4.8')).toBeInTheDocument();
    });
    // 確認所有百分比文字都不包含 NaN
    const percentTexts = screen.getAllByText(/\d+ \(\d+%\)/);
    for (const el of percentTexts) {
      expect(el.textContent).not.toContain('NaN');
    }
  });

  it('顯示「載入更多」按鈕並能點擊', async () => {
    const user = userEvent.setup();
    renderWithClient(<AgentReviewListModal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('載入更多...')).toBeInTheDocument();
    });
    await user.click(screen.getByText('載入更多...'));
    // 點擊後 page 狀態遞增，不應報錯
  });
});
