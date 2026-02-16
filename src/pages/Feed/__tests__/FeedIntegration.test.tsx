import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Feed from '../index';
import { STRINGS } from '../../../constants/strings';

type TestPageMode = 'visitor' | 'demo' | 'live';

const modeState: { value: TestPageMode } = {
  value: 'live',
};

const authState = {
  user: null as { id: string } | null,
  isAuthenticated: false,
  loading: false,
};

vi.mock('../../../hooks/usePageMode', () => ({
  usePageMode: () => modeState.value,
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('../Agent', () => ({
  default: ({ userId }: { userId?: string }) => (
    <div data-testid="agent-page">
      <h1>Agent Page: {userId ?? 'demo'}</h1>
    </div>
  ),
}));

vi.mock('../Consumer', () => ({
  default: ({ userId }: { userId?: string }) => (
    <div data-testid="consumer-page">
      <h1>Consumer Page: {userId ?? 'demo'}</h1>
    </div>
  ),
}));

const mockEq = vi.fn();
const mockFrom = vi.fn();

const createMockQueryBuilder = () => {
  const builder = {
    select: () => builder,
    eq: (col: string, val: string) => {
      mockEq(col, val);
      if (col === 'id') {
        return {
          single: () => {
            if (val === 'real-agent') {
              return Promise.resolve({ data: { role: 'agent' }, error: null });
            }
            if (val === 'real-consumer') {
              return Promise.resolve({ data: { role: 'member' }, error: null });
            }
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
    modeState.value = 'live';
    authState.user = null;
    authState.isAuthenticated = false;
    authState.loading = false;
    window.sessionStorage.clear();
  });

  it('Flow 1: Agent Identification (Real User)', async () => {
    render(
      <MemoryRouter initialEntries={['/feed/real-agent']}>
        <Routes>
          <Route path="/feed/demo" element={<Feed />} />
          <Route path="/feed/:userId" element={<Feed />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockEq).toHaveBeenCalledWith('id', 'real-agent');
    });

    expect(await screen.findByTestId('agent-page')).toBeInTheDocument();
    expect(screen.queryByTestId('consumer-page')).not.toBeInTheDocument();
  });

  it('Flow 2: Consumer Identification (Real User)', async () => {
    render(
      <MemoryRouter initialEntries={['/feed/real-consumer']}>
        <Routes>
          <Route path="/feed/demo" element={<Feed />} />
          <Route path="/feed/:userId" element={<Feed />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.findByTestId('consumer-page')).resolves.toBeInTheDocument());
    expect(screen.queryByTestId('agent-page')).not.toBeInTheDocument();
  });

  it('Flow 3: Demo Entry with Toggle Button', async () => {
    modeState.value = 'demo';
    render(
      <MemoryRouter initialEntries={['/feed/demo']}>
        <Routes>
          <Route path="/feed/demo" element={<Feed />} />
          <Route path="/feed/:userId" element={<Feed />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('consumer-page')).toBeInTheDocument();

    const toggleBtn = await screen.findByTitle(STRINGS.AGENT.OOS.SWITCH_TO_AGENT);
    fireEvent.click(toggleBtn);
    expect(await screen.findByTestId('agent-page')).toBeInTheDocument();
  });

  it('Flow 4: /feed/demo should redirect logged-in user to real feed path', async () => {
    modeState.value = 'live';
    authState.user = { id: 'real-agent' };
    authState.isAuthenticated = true;

    render(
      <MemoryRouter initialEntries={['/feed/demo']}>
        <Routes>
          <Route path="/feed/demo" element={<Feed />} />
          <Route path="/feed/:userId" element={<Feed />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockEq).toHaveBeenCalledWith('id', 'real-agent');
    });
    expect(await screen.findByTestId('agent-page')).toBeInTheDocument();
  });
});
