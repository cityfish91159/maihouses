import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

vi.mock('../../../../components/Logo/Logo', () => ({
  Logo: ({ href }: { href?: string }) => <a href={href ?? '/maihouses/'}>MaiHouses</a>,
}));

const UAG_STYLES_PATH = resolve(process.cwd(), 'src/pages/UAG/UAG.module.css');

const mockUser: User = {
  id: 'user-123',
  app_metadata: {},
  user_metadata: { name: 'Test User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'test@example.com',
} as User;

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

describe('UAGHeader responsive behavior (M6)', () => {
  it('renders mobile-collapse class hooks for breadcrumb and user area', () => {
    const { container } = renderHeader();

    const breadcrumb = screen.getByText('UAG 客戶雷達').closest('div');
    const company = container.querySelector('[class*="uag-company"]');
    const userInfo = container.querySelector('[class*="uag-user-info"]');
    const userButton = screen.getByRole('button', { name: /用戶選單/i });
    const kpiGrid = screen.getByRole('list', { name: '房仲關鍵指標' });

    expect(breadcrumb?.className).toContain('uag-breadcrumb');
    expect(company?.className).toContain('uag-company');
    expect(userInfo?.className).toContain('uag-user-info');
    expect(userButton.className).toContain('uag-user-button');
    expect(kpiGrid.className).toContain('agent-kpi-grid');
    expect(screen.getByText('#6600').className).toContain('agent-kpi-code');
  });

  it('defines mobile hide rules and 44px user touch target in CSS', () => {
    const css = readFileSync(UAG_STYLES_PATH, 'utf8');

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

  it('defines mobile KPI grid and desktop inline KPI rules', () => {
    const css = readFileSync(UAG_STYLES_PATH, 'utf8');

    expect(css).toMatch(/\.agent-kpi-grid\s*{[\s\S]*?display:\s*none;/);
    expect(css).toMatch(/\.agent-kpi-inline\s*{[\s\S]*?display:\s*flex;/);
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.agent-kpi-inline\s*{[\s\S]*?display:\s*none;/
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.agent-kpi-grid\s*{[\s\S]*?display:\s*grid;/
    );
    expect(css).toMatch(/\.agent-kpi-value\s*{[\s\S]*?font-size:\s*26px;/);
  });
});
