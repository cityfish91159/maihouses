import { fireEvent, render, screen } from '@testing-library/react';
import UAGProfilePage from './index';

const mockNavigate = vi.fn();
const mockUseAgentProfile = vi.fn();
const mockUsePageMode = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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

vi.mock('../../../hooks/usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
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
    mockUsePageMode.mockReturnValue('live');
  });

  it('demo 模式正常頁面點返回 UAG 應導向 /uag', () => {
    mockUseAgentProfile.mockReturnValue(makeHookResult());
    mockUsePageMode.mockReturnValue('demo');

    render(<UAGProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: '返回 UAG' }));
    expect(mockNavigate).toHaveBeenCalledWith('/uag', { replace: false });
  });

  it('demo 模式錯誤頁面點返回 UAG 應導向 /uag', () => {
    const hookResult = makeHookResult();
    mockUseAgentProfile.mockReturnValue({
      ...hookResult,
      profile: null,
      error: new Error('load failed'),
    });
    mockUsePageMode.mockReturnValue('demo');

    render(<UAGProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: '返回 UAG' }));
    expect(mockNavigate).toHaveBeenCalledWith('/uag', { replace: false });
  });

  it('visitor 模式點返回 UAG 應導向 /uag 且 replace=true', () => {
    mockUseAgentProfile.mockReturnValue(makeHookResult());
    mockUsePageMode.mockReturnValue('visitor');

    render(<UAGProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: '返回 UAG' }));
    expect(mockNavigate).toHaveBeenCalledWith('/uag', { replace: true });
  });
});
