import { fireEvent, render, screen } from '@testing-library/react';
import UAGProfilePage from './index';

const mockNavigate = vi.fn();
const mockUseAgentProfile = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => mockUseSearchParams(),
  };
});

vi.mock('./hooks/useAgentProfile', () => ({
  useAgentProfile: () => mockUseAgentProfile(),
}));

vi.mock('./AvatarUploader', () => ({
  AvatarUploader: () => <div data-testid="avatar-uploader" />,
}));

vi.mock('./MetricsDisplay', () => ({
  MetricsDisplay: () => <div data-testid="metrics-display" />,
}));

vi.mock('./BasicInfoSection', () => ({
  BasicInfoSection: () => <div data-testid="basic-info-section" />,
}));

const makeHookResult = () => ({
  profile: {
    id: 'mock-agent-001',
    name: '游杰倫',
    avatarUrl: null,
  },
  isLoading: false,
  error: null,
  updateProfile: vi.fn(),
  isUpdating: false,
  uploadAvatar: vi.fn(),
  isUploadingAvatar: false,
});

describe('UAGProfilePage return navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);
  });

  it('正常頁面（mock=true）點返回 UAG 應導向 /uag?mock=true', () => {
    mockUseAgentProfile.mockReturnValue(makeHookResult());
    mockUseSearchParams.mockReturnValue([new URLSearchParams('mock=true'), vi.fn()]);

    render(<UAGProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: '返回 UAG' }));
    expect(mockNavigate).toHaveBeenCalledWith('/uag?mock=true');
  });

  it('錯誤頁面（mock=true）點返回 UAG 應導向 /uag?mock=true', () => {
    const hookResult = makeHookResult();
    mockUseAgentProfile.mockReturnValue({
      ...hookResult,
      profile: null,
      error: new Error('load failed'),
    });
    mockUseSearchParams.mockReturnValue([new URLSearchParams('mock=true'), vi.fn()]);

    render(<UAGProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: '返回 UAG' }));
    expect(mockNavigate).toHaveBeenCalledWith('/uag?mock=true');
  });

  it('正常頁面（非 mock）點返回 UAG 應導向 /uag', () => {
    mockUseAgentProfile.mockReturnValue(makeHookResult());
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);

    render(<UAGProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: '返回 UAG' }));
    expect(mockNavigate).toHaveBeenCalledWith('/uag');
  });
});
