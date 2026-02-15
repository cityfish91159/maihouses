import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ChatMessage from '../ChatMessage';
import { ROUTES, RouteUtils } from '../../../../constants/routes';
import { SEED_COMMUNITY_ID } from '../../../../constants/seed';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithRouter(ui: JSX.Element) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ChatMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('parses legacy community-wall tag and falls back to seed community route', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ChatMessage
        sender="assistant"
        content="可先看看這個 [[社區牆:快樂花園:住戶正在討論電梯問題]]"
      />
    );

    expect(screen.getByText('快樂花園')).toBeInTheDocument();
    expect(screen.queryByText(/\[\[社區牆:/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /去看看住戶怎麼說/ }));

    expect(mockNavigate).toHaveBeenCalledWith(
      RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID))
    );
  });

  it('parses communityId-aware tag and navigates to target community route', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ChatMessage
        sender="assistant"
        content="可先看看這個 [[社區牆:community-live-99:遠雄二代宅:住戶正在討論停車位]]"
      />
    );

    expect(screen.getByText('遠雄二代宅')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /去看看住戶怎麼說/ }));

    expect(mockNavigate).toHaveBeenCalledWith(
      RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL('community-live-99'))
    );
  });
});
