import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import UAGProfilePage from './index';

const mockUseAgentProfile = vi.fn();
const mockUsePageMode = vi.fn();

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

const UAGLocationProbe = () => {
  const location = useLocation();
  return <div data-testid="uag-location">{`${location.pathname}${location.search}`}</div>;
};

describe('UAGProfilePage basename navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePageMode.mockReturnValue('live');
  });

  it('basename=/maihouses 且 demo 模式時，返回應落在 /uag', () => {
    mockUseAgentProfile.mockReturnValue(makeHookResult());
    mockUsePageMode.mockReturnValue('demo');

    render(
      <MemoryRouter basename="/maihouses" initialEntries={['/maihouses/uag/profile']}>
        <Routes>
          <Route path="/uag/profile" element={<UAGProfilePage />} />
          <Route path="/uag" element={<UAGLocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '返回 UAG' }));

    expect(screen.getByTestId('uag-location')).toHaveTextContent('/uag');
  });

  it('basename=/maihouses 且 live 模式時，返回應落在 /uag', () => {
    mockUseAgentProfile.mockReturnValue(makeHookResult());
    mockUsePageMode.mockReturnValue('live');

    render(
      <MemoryRouter basename="/maihouses" initialEntries={['/maihouses/uag/profile']}>
        <Routes>
          <Route path="/uag/profile" element={<UAGProfilePage />} />
          <Route path="/uag" element={<UAGLocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '返回 UAG' }));

    expect(screen.getByTestId('uag-location')).toHaveTextContent('/uag');
  });

  it('錯誤頁在 basename=/maihouses + demo 模式下返回仍正確', () => {
    const hookResult = makeHookResult();
    mockUseAgentProfile.mockReturnValue({
      ...hookResult,
      profile: null,
      error: new Error('load failed'),
    });
    mockUsePageMode.mockReturnValue('demo');

    render(
      <MemoryRouter basename="/maihouses" initialEntries={['/maihouses/uag/profile']}>
        <Routes>
          <Route path="/uag/profile" element={<UAGProfilePage />} />
          <Route path="/uag" element={<UAGLocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '返回 UAG' }));

    expect(screen.getByTestId('uag-location')).toHaveTextContent('/uag');
  });
});
