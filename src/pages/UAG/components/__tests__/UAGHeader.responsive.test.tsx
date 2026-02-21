import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { UAGHeader } from '../UAGHeader';

vi.mock('lucide-react', () => ({
  ChevronDown: ({ className }: { className?: string }) => (
    <span data-testid="chevron-down" className={className} />
  ),
  LogOut: ({ className }: { className?: string }) => (
    <span data-testid="log-out" className={className} />
  ),
  User: ({ className }: { className?: string }) => (
    <span data-testid="user-icon" className={className} />
  ),
}));

vi.mock('../../../../components/Logo/Logo', () => ({
  Logo: ({ href }: { href?: string }) => <a href={href ?? '/maihouses/'}>MaiHouses</a>,
}));

const mockUser: User = {
  id: 'user-123',
  app_metadata: {},
  user_metadata: { name: 'Test User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'test@example.com',
};

const mockAgentProfile = {
  id: 'agent-1',
  name: 'Test User',
  company: 'Mai Houses',
  internalCode: 6600,
  trustScore: 88,
  encouragementCount: 12,
  visitCount: 15,
  dealCount: 7,
};

function renderHeader() {
  return render(
    <MemoryRouter>
      <UAGHeader user={mockUser} agentProfile={mockAgentProfile} />
    </MemoryRouter>
  );
}

describe('UAGHeader responsive behavior (U3)', () => {
  it('renders mobile-collapse class hooks for breadcrumb and user area', () => {
    const { container } = renderHeader();

    const breadcrumb = screen.getByText('UAG 客戶雷達').closest('div');
    const company = container.querySelector('[class*="uag-company"]');
    const proBadge = container.querySelector('[class*="uag-badge--pro"]');
    const userInfo = container.querySelector('[class*="uag-user-info"]');
    const userButton = screen.getByRole('button', { name: /用戶選單/i });

    expect(breadcrumb?.className).toContain('uag-breadcrumb');
    expect(company?.className).toContain('uag-company');
    expect(proBadge?.className).toContain('uag-badge--pro');
    expect(userInfo?.className).toContain('uag-user-info');
    expect(userButton.className).toContain('uag-user-button');

    const stats = screen.getByText('信任分').closest('div');
    expect(stats?.className).toContain('agent-bar-stats');
    expect(screen.getByText('#6600').className).toContain('agent-bar-code');
  });

  it('provides responsive class hooks for mobile collapse and touch target', () => {
    const { container } = renderHeader();

    const breadcrumb = screen.getByText('UAG 客戶雷達').closest('div');
    const company = container.querySelector('[class*="uag-company"]');
    const proBadge = container.querySelector('[class*="uag-badge--pro"]');
    const userInfo = container.querySelector('[class*="uag-user-info"]');
    const userButton = screen.getByRole('button', { name: /用戶選單/i });

    expect(breadcrumb?.className).toContain('uag-breadcrumb');
    expect(company?.className).toContain('uag-company');
    expect(proBadge?.className).toContain('uag-badge--pro');
    expect(userInfo?.className).toContain('uag-user-info');
    expect(userButton.className).toContain('uag-user-button');
  });

  it('renders narrow-layout semantic hooks for agent bar content', () => {
    renderHeader();

    expect(screen.getByText('#6600').className).toContain('agent-bar-code');
    expect(screen.getByText('信任分').closest('div')?.className).toContain('agent-bar-stats');
  });
});
