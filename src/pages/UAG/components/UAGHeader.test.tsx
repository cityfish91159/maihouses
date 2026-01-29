import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UAGHeader } from './UAGHeader';
import { User } from '@supabase/supabase-js';

// Mock Lucide icons to avoid issues
vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down" />,
  LogOut: () => <span data-testid="log-out" />,
}));

// Mock Logo component
// Mock Logo removed to test real component integration
// vi.mock('../../../components/Logo/Logo', ...);

describe('UAGHeader', () => {
  const mockUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: { name: 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
  } as User;

  const renderHeader = (props: React.ComponentProps<typeof UAGHeader>) => {
    return render(
      <MemoryRouter>
        <UAGHeader {...props} />
      </MemoryRouter>
    );
  };

  it('顯示返回首頁連結', () => {
    renderHeader({});
    // Using real Logo component - check for "邁房子" text or aria-label
    // The Logo component renders "邁房子" text
    const logoText = screen.getByText('邁房子');
    expect(logoText).toBeInTheDocument();

    // Check if it's wrapped in a link with correct href
    const link = logoText.closest('a');
    expect(link).toHaveAttribute('href', '/maihouses/');
  });

  it('已登入時顯示用戶資訊', () => {
    renderHeader({ user: mockUser });
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    // Avatar should display first letter
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('未登入時不顯示用戶資訊', () => {
    renderHeader({ user: null });
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/用戶頭像/)).not.toBeInTheDocument();
  });

  it('點擊頭像打開選單', () => {
    renderHeader({ user: mockUser });
    const menuButton = screen.getByRole('button', { name: /用戶選單/i });

    // Initially closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(menuButton);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /登出/i })).toBeInTheDocument();

    // Click again to close (optional but good behavior check)
    fireEvent.click(menuButton);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('點擊登出執行登出動作', async () => {
    const onSignOut = vi.fn();
    renderHeader({ user: mockUser, onSignOut });

    // Open menu
    fireEvent.click(screen.getByRole('button', { name: /用戶選單/i }));

    // Click sign out
    const signOutBtn = screen.getByRole('menuitem', { name: /登出/i });
    fireEvent.click(signOutBtn);

    expect(onSignOut).toHaveBeenCalled();
  });

  it('響應式設計：行動版隱藏 email', () => {
    // Note: detailed style checks like "display: none" on media queries are hard in jsdom.
    // We verify the class names are applied correctly which carry the RWD logic.
    renderHeader({ user: mockUser });

    const emailEl = screen.getByText('test@example.com');
    // Expect it to have the class responsible for hiding it on mobile (from UAG.module.css)
    expect(emailEl.className).toContain('uag-user-email');
  });
});
