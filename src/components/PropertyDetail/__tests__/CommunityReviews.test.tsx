import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CommunityReviews } from '../CommunityReviews';
import type { PageMode } from '../../../hooks/usePageMode';

const mockUsePageMode = vi.fn<() => PageMode>();
const mockNotifyInfo = vi.fn();
const mockNotifyError = vi.fn();

vi.mock('../../../hooks/usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

vi.mock('../../../lib/notify', () => ({
  notify: {
    info: (...args: unknown[]) => mockNotifyInfo(...args),
    error: (...args: unknown[]) => mockNotifyError(...args),
  },
}));

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe = () => {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  };

  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
}

global.IntersectionObserver = MockIntersectionObserver;

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('CommunityReviews', () => {
  const onToggleLike = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePageMode.mockReturnValue('demo');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders mock reviews in demo mode', async () => {
    renderWithRouter(<CommunityReviews isLoggedIn={true} onToggleLike={onToggleLike} />);

    await waitFor(() => {
      expect(screen.getByText('社區評價')).toBeInTheDocument();
      expect(screen.getByText('林***')).toBeInTheDocument();
      expect(screen.getByText('王***')).toBeInTheDocument();
    });
  });

  it('renders SVG star ratings instead of plain text stars', async () => {
    renderWithRouter(<CommunityReviews isLoggedIn={true} onToggleLike={onToggleLike} />);

    await waitFor(() => {
      const ratings = screen.getAllByLabelText('4 星評價');
      expect(ratings.length).toBeGreaterThanOrEqual(2);
    });

    expect(screen.queryByText('★★★★★')).not.toBeInTheDocument();
  });

  it('applies card motion classes and gradient avatar', async () => {
    renderWithRouter(<CommunityReviews isLoggedIn={true} onToggleLike={onToggleLike} />);

    const nameNode = await screen.findByText('林***');
    const card = nameNode.closest('.rounded-2xl');
    expect(card).not.toBeNull();
    expect(card?.className).toContain('hover:shadow-md');
    expect(card?.className).toContain('active:scale-[0.98]');

    const avatar = nameNode.closest('.min-w-0')?.previousElementSibling;
    expect(avatar?.className).toContain('bg-gradient-to-br');
  });

  it('renders community wall button as pill style', async () => {
    renderWithRouter(<CommunityReviews isLoggedIn={true} onToggleLike={onToggleLike} />);

    const button = await waitFor(() =>
      screen
        .getAllByRole('button')
        .find(
          (candidate) =>
            candidate.className.includes('bg-brand-50') &&
            candidate.className.includes('px-4') &&
            candidate.className.includes('py-2')
        )
    );
    expect(button).toBeDefined();
    if (!button) throw new Error('community wall button not found');
    expect(button.className).toContain('rounded-full');
    expect(button.className).toContain('bg-brand-50');
    expect(button.className).toContain('px-4');
    expect(button.className).toContain('py-2');
  });

  it('shows notice when live mode has no communityId for wall navigation', async () => {
    mockUsePageMode.mockReturnValue('live');
    const user = userEvent.setup();

    renderWithRouter(<CommunityReviews isLoggedIn={true} onToggleLike={onToggleLike} />);

    const wallButton = await waitFor(() =>
      screen
        .getAllByRole('button')
        .find(
          (candidate) =>
            candidate.className.includes('bg-brand-50') &&
            candidate.className.includes('px-4') &&
            candidate.className.includes('py-2')
        )
    );
    expect(wallButton).toBeDefined();
    if (!wallButton) throw new Error('community wall button not found');
    await user.click(wallButton);

    expect(mockNotifyInfo).toHaveBeenCalledTimes(1);
    expect(mockNotifyInfo).toHaveBeenCalledWith(expect.any(String), expect.any(String));
  });

  it('keeps like buttons enabled in demo mode for logged-out users', async () => {
    renderWithRouter(<CommunityReviews isLoggedIn={false} onToggleLike={onToggleLike} />);

    await waitFor(() => {
      const likeButtons = screen.getAllByLabelText(/鼓勵這則評價/);
      likeButtons.forEach((button) => {
        expect(button).toBeEnabled();
      });
    });
  });

  it('toggles likes locally in demo mode', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CommunityReviews isLoggedIn={true} onToggleLike={onToggleLike} />);

    const firstLikeButton = await screen.findByLabelText('鼓勵這則評價');
    expect(firstLikeButton).toHaveTextContent('3');

    await user.click(firstLikeButton);

    const updatedLikeButtons = screen.getAllByLabelText(/鼓勵這則評價/);
    const updatedFirst = updatedLikeButtons[0];
    expect(updatedFirst).toHaveTextContent('4');
    expect(onToggleLike).not.toHaveBeenCalled();
  });

  it('calls onToggleLike in live mode', async () => {
    mockUsePageMode.mockReturnValue('live');
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          data: [
            {
              id: 'review-1',
              content: { pros: ['採光好'] },
              agent: { name: '測試房仲' },
            },
          ],
          total: 1,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithRouter(
      <CommunityReviews
        isLoggedIn={true}
        communityId="community-1"
        onToggleLike={onToggleLike}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('測***')).toBeInTheDocument();
    });

    const likeButton = screen.getByLabelText('鼓勵這則評價');
    await user.click(likeButton);

    expect(onToggleLike).toHaveBeenCalledWith('review-1');
  });

  it('prioritizes mode guard before auth guard in visitor mode', async () => {
    mockUsePageMode.mockReturnValue('visitor');
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          data: [
            {
              id: 'review-visitor-1',
              content: { pros: ['安靜'] },
              agent: { name: '訪客測試房仲' },
            },
          ],
          total: 1,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithRouter(
      <CommunityReviews isLoggedIn={true} communityId="community-visitor" onToggleLike={onToggleLike} />
    );

    const likeButton = await screen.findByLabelText('鼓勵這則評價');
    await user.click(likeButton);

    expect(onToggleLike).not.toHaveBeenCalled();
    expect(mockNotifyInfo).toHaveBeenCalled();
  });

  it('keeps like button touch target >=44px', async () => {
    renderWithRouter(<CommunityReviews isLoggedIn={true} onToggleLike={onToggleLike} />);

    await waitFor(() => {
      const likeButtons = screen.getAllByLabelText(/鼓勵這則評價/);
      likeButtons.forEach((button) => {
        expect(button.className).toContain('min-h-[44px]');
      });
    });
  });

  it('shows locked CTA for logged-out users', async () => {
    mockUsePageMode.mockReturnValue('visitor');
    renderWithRouter(<CommunityReviews isLoggedIn={false} onToggleLike={onToggleLike} />);

    const cta = await screen.findByRole('button', { name: /註冊查看全部|註冊查看更多評價/ });
    expect(within(cta).getByText(/註冊/)).toBeInTheDocument();
  });

  it('restores like count after two rapid demo toggles', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CommunityReviews isLoggedIn={true} onToggleLike={onToggleLike} />);

    const likeButton = await screen.findByLabelText('鼓勵這則評價');
    expect(likeButton).toHaveTextContent('3');

    await user.click(likeButton);
    await user.click(likeButton);

    expect(likeButton).toHaveTextContent('3');
    expect(onToggleLike).not.toHaveBeenCalled();
  });

  it('keeps UI stable when live onToggleLike throws', async () => {
    mockUsePageMode.mockReturnValue('live');
    const user = userEvent.setup();
    const throwingToggleLike = vi.fn(() => {
      throw new Error('toggle like failed');
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          data: [
            {
              id: 'review-live-throw',
              content: { pros: ['採光好'] },
              agent: { name: '錯誤路徑測試房仲' },
            },
          ],
          total: 1,
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithRouter(
      <CommunityReviews
        isLoggedIn={true}
        communityId="community-live-throw"
        onToggleLike={throwingToggleLike}
      />
    );

    const likeButton = await screen.findByLabelText('鼓勵這則評價');
    await user.click(likeButton);

    expect(throwingToggleLike).toHaveBeenCalledWith('review-live-throw');
    expect(mockNotifyError).toHaveBeenCalledWith('鼓勵失敗', 'toggle like failed');
  });
});
