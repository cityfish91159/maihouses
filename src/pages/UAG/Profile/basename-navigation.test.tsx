import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import UAGProfilePage from './index';

const mockUseAgentProfile = vi.fn();

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

const UAGLocationProbe = () => {
  const location = useLocation();
  return <div data-testid="uag-location">{`${location.pathname}${location.search}`}</div>;
};

describe('UAGProfilePage basename navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('basename=/maihouses 且 mock=true 時，返回應落在 /uag?mock=true', () => {
    mockUseAgentProfile.mockReturnValue(makeHookResult());

    render(
      <MemoryRouter basename="/maihouses" initialEntries={['/maihouses/uag/profile?mock=true']}>
        <Routes>
          <Route path="/uag/profile" element={<UAGProfilePage />} />
          <Route path="/uag" element={<UAGLocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '返回 UAG' }));

    expect(screen.getByTestId('uag-location')).toHaveTextContent('/uag?mock=true');
  });

  it('basename=/maihouses 且非 mock 時，返回應落在 /uag', () => {
    mockUseAgentProfile.mockReturnValue(makeHookResult());

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

  it('錯誤頁在 basename=/maihouses + mock=true 下返回仍正確', () => {
    const hookResult = makeHookResult();
    mockUseAgentProfile.mockReturnValue({
      ...hookResult,
      profile: null,
      error: new Error('load failed'),
    });

    render(
      <MemoryRouter basename="/maihouses" initialEntries={['/maihouses/uag/profile?mock=true']}>
        <Routes>
          <Route path="/uag/profile" element={<UAGProfilePage />} />
          <Route path="/uag" element={<UAGLocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: '返回 UAG' }));

    expect(screen.getByTestId('uag-location')).toHaveTextContent('/uag?mock=true');
  });
});
