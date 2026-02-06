import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Feed from '../index';
import { ROUTES } from '../../../constants/routes';
import { STRINGS } from '../../../constants/strings';

// Mock child components to focus on routing and role logic
// Mock child components to focus on routing and role logic
vi.mock('../Agent', () => ({
  default: ({ userId }: { userId: string }) => (
    <div data-testid="agent-page">
      <h1>Agent Page: {userId}</h1>
      <a href="/maihouses/community/test-uuid/wall" data-testid="link-wall">
        Community Wall
      </a>
      <a href="/maihouses/uag" data-testid="link-uag">
        UAG
      </a>
    </div>
  ),
}));

// Mock Env
vi.mock('../../../config/env', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://mock.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'mock-key',
    APP_VERSION: 'test',
    DEV: true,
    SITE_URL: 'http://localhost',
  },
}));

vi.mock('../Consumer', () => ({
  default: ({ userId }: { userId: string }) => (
    <div data-testid="consumer-page">
      <h1>Consumer Page: {userId}</h1>
    </div>
  ),
}));

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();

// Helper to create a chainable mock object
const createMockQueryBuilder = (mockData = []) => {
  const builder = {
    select: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => Promise.resolve({ data: mockData, error: null }),
    eq: (col: string, val: string) => {
      mockEq(col, val);
      // Special case for role check
      if (col === 'id') {
        return {
          single: () => {
            if (val === 'real-agent')
              return Promise.resolve({ data: { role: 'agent' }, error: null });
            if (val === 'real-consumer')
              return Promise.resolve({ data: { role: 'member' }, error: null });
            return Promise.resolve({ data: null, error: 'Not found' });
          },
        };
      }
      return builder;
    },
    single: () => Promise.resolve({ data: null, error: 'not found' }),
  };
  return builder;
};

// Fix path: ../../../lib/supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      mockFrom(table);
      return createMockQueryBuilder();
    },
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  },
}));

describe('Feed Integration & Routing Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Flow 1: Agent Identification (Real User)', async () => {
    render(
      <MemoryRouter initialEntries={['/maihouses/feed/real-agent']}>
        <Routes>
          <Route path="/maihouses/feed/:userId" element={<Feed />} />
        </Routes>
      </MemoryRouter>
    );

    // Should fetch from DB
    await waitFor(() => {
      expect(mockEq).toHaveBeenCalledWith('id', 'real-agent');
    });

    // Should render Agent Page
    expect(await screen.findByTestId('agent-page')).toBeInTheDocument();
    expect(screen.queryByTestId('consumer-page')).not.toBeInTheDocument();

    // Toggle button should NOT be present for real users
    expect(screen.queryByText('切換至消費者視角')).not.toBeInTheDocument();
  });

  it('Flow 2: Consumer Identification (Real User)', async () => {
    render(
      <MemoryRouter initialEntries={['/maihouses/feed/real-consumer']}>
        <Routes>
          <Route path="/maihouses/feed/:userId" element={<Feed />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.findByTestId('consumer-page')).resolves.toBeInTheDocument());
    expect(screen.queryByTestId('agent-page')).not.toBeInTheDocument();
  });

  it('Flow 3: Demo Mode with Toggle Button', async () => {
    render(
      // use demo-agent to ensure default is Agent
      <MemoryRouter initialEntries={['/maihouses/feed/demo-agent?mock=true']}>
        <Routes>
          <Route path="/maihouses/feed/:userId" element={<Feed />} />
        </Routes>
      </MemoryRouter>
    );

    // Default to Agent for demo-agent
    expect(await screen.findByTestId('agent-page')).toBeInTheDocument();

    // Verify Toggle Button Exists
    const toggleBtn = await screen.findByTitle('切換至消費者視角');
    expect(toggleBtn).toBeInTheDocument();

    // Click to Toggle -> Consumer
    fireEvent.click(toggleBtn);
    expect(await screen.findByTestId('consumer-page')).toBeInTheDocument();
    expect(screen.queryByTestId('agent-page')).not.toBeInTheDocument();

    // Click to Toggle back -> Agent
    const toggleBtnBack = await screen.findByTitle('切換至房仲視角');
    fireEvent.click(toggleBtnBack);
    expect(await screen.findByTestId('agent-page')).toBeInTheDocument();
  });

  it('Flow 4: Mock Param Bypasses Role Lookup', async () => {
    render(
      <MemoryRouter initialEntries={['/maihouses/feed/real-agent?mock=true']}>
        <Routes>
          <Route path="/maihouses/feed/:userId" element={<Feed />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('consumer-page')).toBeInTheDocument();
    expect(mockFrom).not.toHaveBeenCalled();

    const toggleBtn = await screen.findByTitle(STRINGS.AGENT.OOS.SWITCH_TO_AGENT);
    fireEvent.click(toggleBtn);
    expect(await screen.findByTestId('agent-page')).toBeInTheDocument();
  });
});
