import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AgentProfileCard } from '../AgentProfileCard';
import { STRINGS } from '../../../constants/strings';
import { ROUTES } from '../../../constants/routes';

const mockProfile = {
  id: 'agent-1',
  name: 'Test Agent',
  role: 'agent' as const,
  communityId: 'comm-1',
  communityName: 'Test Comm',
  email: 'test@example.com',
  stats: { days: 10, liked: 5, contributions: 2 },
};

const mockStats = {
  score: 1000,
  days: 10,
  liked: 5,
  replies: 2,
  views: 100,
  contacts: 1,
  deals: 2,
  amount: 3280,
  clients: 18,
};

describe('AgentProfileCard', () => {
  it('renders profile info and stats', () => {
    render(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={mockStats} />
      </MemoryRouter>
    );

    // Name
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    // Badges
    expect(screen.getByText(STRINGS.AGENT.PROFILE.BADGE_GOLD)).toBeInTheDocument();
    // Stats
    expect(screen.getByText(new RegExp(STRINGS.AGENT.PROFILE.STATS_SCORE))).toBeInTheDocument();
  });

  it('renders links correctly with ROUTES', () => {
    render(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={mockStats} />
      </MemoryRouter>
    );

    const uagLink = screen.getByRole('link', {
      name: STRINGS.AGENT.PROFILE.LINK_WORKBENCH,
    });
    expect(uagLink).toHaveAttribute('href', ROUTES.UAG);

    const wallLink = screen.getByRole('link', {
      name: STRINGS.AGENT.PROFILE.LINK_WALL,
    });
    // Should resolve to /community/comm-1/wall
    expect(wallLink).toHaveAttribute('href', '/community/comm-1/wall');
  });
});
