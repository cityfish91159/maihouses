import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { UAGHeader } from './UAGHeader';

const UAG_STYLES_PATH = resolve(process.cwd(), 'src/pages/UAG/UAG.module.css');

vi.mock('lucide-react', () => ({
  BadgeCheck: ({ className }: { className?: string }) => (
    <span data-testid="badge-check" className={className} />
  ),
  ChevronDown: ({ className }: { className?: string }) => (
    <span data-testid="chevron-down" className={className} />
  ),
  Footprints: ({ className }: { className?: string }) => (
    <span data-testid="footprints" className={className} />
  ),
  LogOut: ({ className }: { className?: string }) => (
    <span data-testid="log-out" className={className} />
  ),
  ShieldCheck: ({ className }: { className?: string }) => (
    <span data-testid="shield-check" className={className} />
  ),
  ThumbsUp: ({ className }: { className?: string }) => (
    <span data-testid="thumbs-up" className={className} />
  ),
  User: ({ className }: { className?: string }) => (
    <span data-testid="user-icon" className={className} />
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

  it('renders header elements with mobile-collapse classes', () => {
    renderHeader({ user: mockUser });

    const logoWrap = screen.getByRole('link', { name: '邁房子' }).closest('div');
    expect(logoWrap?.className).toContain('uag-logo-wrap');

    const breadcrumb = screen.getByText('UAG 客戶雷達').closest('div');
    expect(breadcrumb?.className).toContain('uag-breadcrumb');

    const proBadge = screen.getByText('專業版 PRO');
    expect(proBadge.className).toContain('uag-badge--pro');

    const userInfo = screen.getByText('Test User').closest('div');
    expect(userInfo?.className).toContain('uag-user-info');

    expect(screen.getByTestId('chevron-down').className).toContain('uag-user-chevron');
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
      /@media \(max-width: 767px\)[\s\S]*?\.uag-badge--pro\s*{[\s\S]*?display:\s*none;/
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.uag-user-info\s*{[\s\S]*?display:\s*none;/
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.uag-user-button\s*{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/
    );
  });

  it('keeps agent bar stats readable on very narrow screens', () => {
    const css = readFileSync(UAG_STYLES_PATH, 'utf8');

    expect(css).toContain('@media (max-width: 380px)');
    expect(css).toMatch(
      /@media \(max-width: 380px\)[\s\S]*?\.uag-header-inner\s*{[\s\S]*?padding:\s*10px 8px;/
    );
    expect(css).toMatch(
      /@media \(max-width: 380px\)[\s\S]*?\.uag-header-inner\s*{[\s\S]*?padding:\s*10px 8px;/
    );
  });

  it('renders agent bar stats when agent profile exists', () => {
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

    // 現在有桌面版 inline 和手機版 grid 兩組 KPI
    const kpiLabels = screen.getAllByText('信任分');
    expect(kpiLabels.length).toBeGreaterThanOrEqual(1);
    const gridLabel = kpiLabels.find((el) => el.className.includes('agent-kpi-label'));
    expect(gridLabel).toBeDefined();
  });
});
