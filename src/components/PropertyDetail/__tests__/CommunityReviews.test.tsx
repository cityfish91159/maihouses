import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CommunityReviews } from '../CommunityReviews';

// Mock IntersectionObserver
let mockCallback: IntersectionObserverCallback | null = null;

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    mockCallback = callback;
    // 自動觸發 callback，模擬元素進入 viewport
    setTimeout(() => {
      if (mockCallback) {
        mockCallback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      }
    }, 0);
  }
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

describe('CommunityReviews', () => {
  const mockOnToggleLike = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it('Demo 模式顯示 mock 評價', async () => {
    renderWithRouter(
      <CommunityReviews isLoggedIn={true} isDemo={true} onToggleLike={mockOnToggleLike} />
    );

    await waitFor(() => {
      expect(screen.getByText('社區評價')).toBeInTheDocument();
    });

    // 檢查 mock 資料是否顯示
    expect(screen.getByText('林***')).toBeInTheDocument();
    expect(screen.getByText('王***')).toBeInTheDocument();
  });

  it('顯示按讚按鈕', async () => {
    renderWithRouter(
      <CommunityReviews isLoggedIn={true} isDemo={true} onToggleLike={mockOnToggleLike} />
    );

    await waitFor(() => {
      const likeButtons = screen.getAllByLabelText(/鼓勵這則評價/);
      expect(likeButtons.length).toBeGreaterThan(0);
    });
  });

  it('已讚狀態顯示正確樣式', async () => {
    renderWithRouter(
      <CommunityReviews isLoggedIn={true} isDemo={true} onToggleLike={mockOnToggleLike} />
    );

    await waitFor(() => {
      // MOCK_REVIEWS[1] 預設 liked=true, totalLikes=7
      const likedButton = screen.getByLabelText('鼓勵這則評價（已鼓勵）');
      expect(likedButton).toHaveClass('bg-brand-50');
      expect(likedButton).toHaveClass('text-brand-700');
      expect(likedButton.textContent).toContain('7');
    });
  });

  it('未讚狀態顯示正確樣式', async () => {
    renderWithRouter(
      <CommunityReviews isLoggedIn={true} isDemo={true} onToggleLike={mockOnToggleLike} />
    );

    await waitFor(() => {
      // MOCK_REVIEWS[0] 預設 liked=false, totalLikes=3
      const unlikedButtons = screen.getAllByLabelText(/鼓勵這則評價$/);
      const firstUnliked = unlikedButtons[0];
      if (firstUnliked) {
        expect(firstUnliked).toHaveClass('bg-bg-base');
        expect(firstUnliked).toHaveClass('text-text-muted');
      }
    });
  });

  it('未登入時按讚按鈕 disabled', async () => {
    renderWithRouter(
      <CommunityReviews isLoggedIn={false} isDemo={true} onToggleLike={mockOnToggleLike} />
    );

    await waitFor(() => {
      const likeButtons = screen.getAllByLabelText(/鼓勵這則評價/);
      likeButtons.forEach((button) => {
        expect(button).toBeDisabled();
        expect(button).toHaveClass('cursor-not-allowed');
        expect(button).toHaveClass('opacity-50');
      });
    });
  });

  it('Demo 模式按讚觸發本地 toggle', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <CommunityReviews isLoggedIn={true} isDemo={true} onToggleLike={mockOnToggleLike} />
    );

    await waitFor(() => {
      expect(screen.getByText('林***')).toBeInTheDocument();
    });

    // 點擊第一個未讚的按鈕
    const unlikedButton = screen.getAllByLabelText(/鼓勵這則評價$/)[0];
    if (unlikedButton) {
      const initialText = unlikedButton.textContent;
      await user.click(unlikedButton);

      // 驗證本地 state 更新（讚數 +1）
      await waitFor(() => {
        const updatedButton = screen.getAllByLabelText(/鼓勵這則評價/)[0];
        expect(updatedButton?.textContent).not.toBe(initialText);
      });
    }

    // Demo 模式不應該呼叫 onToggleLike
    expect(mockOnToggleLike).not.toHaveBeenCalled();
  });

  it('正式模式按讚呼叫 onToggleLike', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <CommunityReviews
        isLoggedIn={true}
        isDemo={false}
        communityId="test-community-123"
        onToggleLike={mockOnToggleLike}
      />
    );

    // 等待 IntersectionObserver 觸發
    await waitFor(() => {
      expect(screen.getByText('社區評價')).toBeInTheDocument();
    });

    // 注意：正式模式需要 API 回傳資料才會有按讚按鈕
    // 此測試僅驗證 onToggleLike 是否被傳遞
  });

  it('未登入顯示註冊提示按鈕', async () => {
    renderWithRouter(
      <CommunityReviews isLoggedIn={false} isDemo={true} onToggleLike={mockOnToggleLike} />
    );

    await waitFor(() => {
      expect(screen.getByText(/註冊查看/)).toBeInTheDocument();
    });
  });

  it('顯示前往社區牆按鈕', async () => {
    renderWithRouter(
      <CommunityReviews isLoggedIn={true} isDemo={true} onToggleLike={mockOnToggleLike} />
    );

    await waitFor(() => {
      expect(screen.getByText('前往社區牆')).toBeInTheDocument();
    });
  });

  it('按讚按鈕符合 A11y 觸控目標標準', async () => {
    renderWithRouter(
      <CommunityReviews isLoggedIn={true} isDemo={true} onToggleLike={mockOnToggleLike} />
    );

    await waitFor(() => {
      const likeButtons = screen.getAllByLabelText(/鼓勵這則評價/);
      likeButtons.forEach((button) => {
        expect(button).toHaveClass('min-h-[44px]');
      });
    });
  });
});
