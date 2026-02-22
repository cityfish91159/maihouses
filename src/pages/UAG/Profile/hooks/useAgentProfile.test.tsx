import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAgentProfile } from './useAgentProfile';
import type { PageMode } from '../../../../hooks/usePageMode';

const mockFetchAgentMe = vi.fn();
const mockUpdateAgentProfile = vi.fn();
const mockUploadAgentAvatar = vi.fn();
const mockNotifySuccess = vi.fn();
const mockNotifyError = vi.fn();
const mockUsePageMode = vi.fn<() => PageMode>();
const mockUseAuth = vi.fn();

vi.mock('../../../../services/agentService', () => ({
  fetchAgentMe: (...args: unknown[]) => mockFetchAgentMe(...args),
  updateAgentProfile: (...args: unknown[]) => mockUpdateAgentProfile(...args),
  uploadAgentAvatar: (...args: unknown[]) => mockUploadAgentAvatar(...args),
}));

vi.mock('../../../../lib/notify', () => ({
  notify: {
    success: (...args: unknown[]) => mockNotifySuccess(...args),
    error: (...args: unknown[]) => mockNotifyError(...args),
  },
}));

vi.mock('../../../../hooks/usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper =
  (queryClient: QueryClient, initialEntry: string) =>
  ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  );

const makeLiveProfile = () => ({
  id: 'live-agent-001',
  internalCode: 10001,
  name: '正式房仲',
  avatarUrl: null,
  company: '邁房子',
  bio: 'live profile',
  specialties: ['捷運宅'],
  certifications: ['不動產經紀人'],
  phone: '0912000000',
  lineId: 'live_line',
  trustScore: 90,
  encouragementCount: 10,
  serviceRating: 4.9,
  reviewCount: 20,
  completedCases: 18,
  activeListings: 6,
  serviceYears: 3,
  joinedAt: '2023-01-01',
  visitCount: 200,
  dealCount: 18,
  email: 'live@maihouses.com',
  points: 900,
  quotaS: 3,
  quotaA: 8,
  createdAt: '2023-01-01T00:00:00Z',
});

describe('useAgentProfile (#7 mock mode + var(--mh-color-2211bb)-P8 feedback)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePageMode.mockReturnValue('live');
    mockUseAuth.mockReturnValue({
      user: { id: 'live-user-001' },
      session: null,
      role: 'guest',
      isAuthenticated: true,
      loading: false,
      error: null,
      signOut: vi.fn(),
    });
    mockFetchAgentMe.mockResolvedValue(makeLiveProfile());
    mockUpdateAgentProfile.mockResolvedValue(undefined);
    mockUploadAgentAvatar.mockResolvedValue('https://example.com/avatar.png');
  });

  it('demo 模式時應回傳 mock 資料且不呼叫 fetchAgentMe', async () => {
    mockUsePageMode.mockReturnValue('demo');
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      role: 'guest',
      isAuthenticated: false,
      loading: false,
      error: null,
      signOut: vi.fn(),
    });

    const queryClient = createQueryClient();
    const { result } = renderHook(() => useAgentProfile(), {
      wrapper: createWrapper(queryClient, '/uag/profile'),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.profile?.id).toBe('mock-agent-001');
    expect(mockFetchAgentMe).not.toHaveBeenCalled();
  });

  it('demo 模式時 updateProfile 應更新本地快取，不呼叫 update API', async () => {
    mockUsePageMode.mockReturnValue('demo');
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      role: 'guest',
      isAuthenticated: false,
      loading: false,
      error: null,
      signOut: vi.fn(),
    });

    const queryClient = createQueryClient();
    const { result } = renderHook(() => useAgentProfile(), {
      wrapper: createWrapper(queryClient, '/uag/profile'),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateProfile({
        name: '游杰倫-更新',
        company: '邁房子中山店',
        phone: '0987654321',
      });
    });

    await waitFor(() => expect(result.current.profile?.name).toBe('游杰倫-更新'));
    expect(result.current.profile?.company).toBe('邁房子中山店');
    expect(result.current.profile?.phone).toBe('0987654321');
    expect(mockUpdateAgentProfile).not.toHaveBeenCalled();
    expect(mockNotifySuccess).toHaveBeenCalledWith('個人資料已儲存', 'Mock 模式：資料未實際儲存');
  });

  it('demo 模式時 company=null 應保留為 null（不強制回填）', async () => {
    mockUsePageMode.mockReturnValue('demo');
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      role: 'guest',
      isAuthenticated: false,
      loading: false,
      error: null,
      signOut: vi.fn(),
    });

    const queryClient = createQueryClient();
    const { result } = renderHook(() => useAgentProfile(), {
      wrapper: createWrapper(queryClient, '/uag/profile'),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateProfile({
        company: null,
      });
    });

    expect(result.current.profile?.company).toBeNull();
    expect(mockUpdateAgentProfile).not.toHaveBeenCalled();
  });

  it('同一 QueryClient 由 demo 切到 live 時，不應復用 mock 快取', async () => {
    const queryClient = createQueryClient();

    mockUsePageMode.mockReturnValue('demo');
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      role: 'guest',
      isAuthenticated: false,
      loading: false,
      error: null,
      signOut: vi.fn(),
    });

    const mockRender = renderHook(() => useAgentProfile(), {
      wrapper: createWrapper(queryClient, '/uag/profile'),
    });
    await waitFor(() => expect(mockRender.result.current.isLoading).toBe(false));
    expect(mockRender.result.current.profile?.id).toBe('mock-agent-001');
    mockRender.unmount();

    mockUsePageMode.mockReturnValue('live');
    mockUseAuth.mockReturnValue({
      user: { id: 'live-user-001' },
      session: null,
      role: 'agent',
      isAuthenticated: true,
      loading: false,
      error: null,
      signOut: vi.fn(),
    });

    const liveRender = renderHook(() => useAgentProfile(), {
      wrapper: createWrapper(queryClient, '/uag/profile'),
    });
    await waitFor(() => expect(liveRender.result.current.isLoading).toBe(false));

    expect(mockFetchAgentMe).toHaveBeenCalledTimes(1);
    expect(liveRender.result.current.profile?.id).toBe('live-agent-001');
  });

  it('live mode updateProfile 成功時應顯示成功通知', async () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useAgentProfile(), {
      wrapper: createWrapper(queryClient, '/uag/profile'),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateProfile({
        name: '正式房仲-更新',
      });
    });

    expect(mockUpdateAgentProfile).toHaveBeenCalledWith({
      name: '正式房仲-更新',
    });
    expect(mockNotifySuccess).toHaveBeenCalledWith('個人資料已儲存');
  });

  it('live mode updateProfile 失敗時應顯示後端錯誤訊息', async () => {
    mockUpdateAgentProfile.mockRejectedValueOnce(new Error('service down'));

    const queryClient = createQueryClient();
    const { result } = renderHook(() => useAgentProfile(), {
      wrapper: createWrapper(queryClient, '/uag/profile'),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(
        result.current.updateProfile({
          name: '正式房仲-失敗',
        })
      ).rejects.toThrow('service down');
    });

    expect(mockNotifyError).toHaveBeenCalledWith('儲存失敗', 'service down');
  });
});
