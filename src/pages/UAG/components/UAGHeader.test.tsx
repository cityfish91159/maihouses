import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { UAGHeader } from './UAGHeader';

const UAG_STYLES_PATH = resolve(process.cwd(), 'src/pages/UAG/UAG.module.css');

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
  ShieldCheck: ({ className }: { className?: string }) => (
    <span data-testid="shield-check" className={className} />
  ),
  Footprints: ({ className }: { className?: string }) => (
    <span data-testid="footprints" className={className} />
  ),
  BadgeCheck: ({ className }: { className?: string }) => (
    <span data-testid="badge-check" className={className} />
  ),
  ThumbsUp: ({ className }: { className?: string }) => (
    <span data-testid="thumbs-up" className={className} />
  ),
}));

vi.mock('../../../components/Logo/Logo', () => ({
  Logo: ({ href }: { href?: string }) => <a href={href ?? '/maihouses/'}>邁房子</a>,
}));

describe('UAGHeader', () => {
  const mockUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: { name: 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
  } as User;

  const renderHeader = (props: React.ComponentProps<typeof UAGHeader>) =>
    render(
      <MemoryRouter>
        <UAGHeader {...props} />
      </MemoryRouter>
    );

  it('renders logo home link', () => {
    renderHeader({});
    const link = screen.getByRole('link', { name: '邁房子' });
    expect(link).toHaveAttribute('href', '/maihouses/');
  });

  it('shows user block for authenticated user', () => {
    renderHeader({ user: mockUser });
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    const userMenuButton = screen.getByRole('button', { name: /用戶選單/i });
    expect(userMenuButton).toBeInTheDocument();
    expect(userMenuButton).toHaveAttribute('aria-haspopup', 'menu');
    expect(userMenuButton).toHaveAttribute('aria-controls', 'uag-user-menu-dropdown');
  });

  it('hides user block when logged out and not in mock mode', () => {
    renderHeader({ user: null });
    expect(screen.queryByRole('button', { name: /用戶選單/i })).not.toBeInTheDocument();
  });

  it('shows user block in mock mode even without real user', () => {
    renderHeader({ user: null, useMock: true });
    expect(screen.getByRole('button', { name: /用戶選單/i })).toBeInTheDocument();
    expect(screen.getByText('游杰倫')).toBeInTheDocument();
  });

  it('opens menu and displays profile item', () => {
    renderHeader({ user: mockUser });

    fireEvent.click(screen.getByRole('button', { name: /用戶選單/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '個人資料' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /登出/i })).toBeInTheDocument();
  });

  it('mock mode menu does not show sign out item', () => {
    renderHeader({ user: null, useMock: true });

    fireEvent.click(screen.getByRole('button', { name: /用戶選單/i }));
    expect(screen.queryByRole('menuitem', { name: /登出/i })).not.toBeInTheDocument();
  });

  it('navigates to mock profile route from menu in mock mode', () => {
    const originalLocation = window.location;

    try {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { href: '' } as unknown as Location,
      });

      renderHeader({ user: null, useMock: true });
      fireEvent.click(screen.getByRole('button', { name: /用戶選單/i }));
      fireEvent.click(screen.getByRole('menuitem', { name: '個人資料' }));

      expect(window.location.href).toBe('/maihouses/uag/profile?mock=true');
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });

  it('renders KPI grid when agent profile exists', () => {
    renderHeader({
      user: mockUser,
      agentProfile: {
        id: 'agent-1',
        name: '游杰倫',
        company: '邁房子',
        internalCode: 6600,
        trustScore: 88,
        encouragementCount: 12,
        visitCount: 15,
        dealCount: 7,
      },
    });

    expect(screen.getAllByText('信任分').length).toBeGreaterThan(0);
    expect(screen.getAllByText('帶看組數').length).toBeGreaterThan(0);
    expect(screen.getAllByText('成交案件').length).toBeGreaterThan(0);
    expect(screen.getAllByText('獲得鼓勵').length).toBeGreaterThan(0);

    const kpiGrid = screen.getByRole('list', { name: '房仲關鍵指標' });
    expect(kpiGrid.className).toContain('agent-kpi-grid');
  });

  it('defines mobile hide rules and 44px user touch target in CSS', () => {
    const css = readFileSync(UAG_STYLES_PATH, 'utf8');

    expect(css).toContain('overscroll-behavior: contain;');
    expect(css).toContain('overflow-x: clip;');
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.uag-breadcrumb\s*{[\s\S]*?display:\s*none;/
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.uag-company\s*{[\s\S]*?display:\s*none;/
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.uag-user-button\s*{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/
    );
  });

  it('defines mobile KPI 2x2 grid with readable number size', () => {
    const css = readFileSync(UAG_STYLES_PATH, 'utf8');

    expect(css).toMatch(/\.agent-kpi-grid\s*{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/);
    expect(css).toMatch(/\.agent-kpi-value\s*{[\s\S]*?font-size:\s*26px;/);
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.agent-kpi-inline\s*{[\s\S]*?display:\s*none;/
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.agent-kpi-grid\s*{[\s\S]*?display:\s*grid;/
    );
  });
});
