import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CommunityWallCard from '../CommunityWallCard';
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

describe('CommunityWallCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('navigates to provided communityId when present', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <CommunityWallCard communityId="community-live-42" name="快樂花園" topic="住戶交流討論" />
    );

    await user.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith(
      RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL('community-live-42'))
    );
  });

  it('falls back to seed community when communityId is missing', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CommunityWallCard name="快樂花園" topic="住戶交流討論" />);

    await user.click(screen.getByRole('button'));

    expect(mockNavigate).toHaveBeenCalledWith(
      RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID))
    );
  });
});
