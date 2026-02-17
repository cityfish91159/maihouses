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
    expect(screen.getByText('var(--mh-color-66660000)').className).toContain('agent-bar-code');
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
      /@media \(max-width: 767px\)[\s\S]*?\.uag-badge--pro\s*{[\s\S]*?display:\s*none;/
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.uag-user-info\s*{[\s\S]*?display:\s*none;/
    );
    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.uag-user-button\s*{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/
    );
  });

  it('defines extra 320px safeguards for agent bar overflow', () => {
    const css = readFileSync(UAG_STYLES_PATH, 'utf8');

    expect(css).toContain('@media (max-width: 380px)');
    expect(css).toMatch(
      /@media \(max-width: 380px\)[\s\S]*?\.agent-bar-code\s*{[\s\S]*?display:\s*none;/
    );
    expect(css).toMatch(
      /@media \(max-width: 380px\)[\s\S]*?\.agent-bar-stats\s*{[\s\S]*?gap:\s*6px;[\s\S]*?font-size:\s*12px;/
    );
  });
});
