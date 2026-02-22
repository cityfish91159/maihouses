import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UAGEmptyState } from '../UAGEmptyState';

const useMaiMaiA11yPropsMock = vi.fn(() => ({ animated: true, showEffects: true }));
const useMediaQueryMock = vi.fn(() => false);

vi.mock('../../../../hooks/useMaiMaiA11yProps', () => ({
  useMaiMaiA11yProps: () => useMaiMaiA11yPropsMock(),
}));

vi.mock('../../../../hooks/useMediaQuery', () => ({
  useMediaQuery: () => useMediaQueryMock(),
}));

vi.mock('../../../../components/MaiMai', () => ({
  MaiMaiBase: ({
    mood,
    size,
    animated,
    showEffects,
  }: {
    mood: string;
    size: string;
    animated: boolean;
    showEffects: boolean;
  }) => (
    <div
      data-testid="maimai-base"
      data-mood={mood}
      data-size={size}
      data-animated={String(animated)}
      data-effects={String(showEffects)}
    />
  ),
}));

describe('UAGEmptyState', () => {
  beforeEach(() => {
    useMaiMaiA11yPropsMock.mockReturnValue({ animated: true, showEffects: true });
    useMediaQueryMock.mockReturnValue(false);
  });

  const renderEmptyState = (onDismiss = vi.fn()) =>
    render(
      <MemoryRouter>
        <UAGEmptyState onDismiss={onDismiss} />
      </MemoryRouter>
    );

  it('renders welcome copy and upload link', () => {
    renderEmptyState();

    expect(screen.getByRole('region', { name: '新手引導' })).toBeInTheDocument();
    expect(screen.getByText('嗨！歡迎加入 MaiHouses！')).toBeInTheDocument();
    expect(screen.getByText('現在先去上架你的第一筆物件吧！')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '上架物件' })).toHaveAttribute(
      'href',
      '/property/upload'
    );
    expect(screen.getByRole('button', { name: '知道了' })).toBeInTheDocument();
  });

  it('calls onDismiss when user clicks close button', () => {
    const onDismiss = vi.fn();
    renderEmptyState(onDismiss);

    fireEvent.click(screen.getByRole('button', { name: '關閉歡迎引導' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when user clicks secondary action', () => {
    const onDismiss = vi.fn();
    renderEmptyState(onDismiss);

    fireEvent.click(screen.getByRole('button', { name: '知道了' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('uses MaiMaiBase molecule with required props', () => {
    renderEmptyState();

    const maimai = screen.getByTestId('maimai-base');
    expect(maimai).toHaveAttribute('data-mood', 'wave');
    expect(maimai).toHaveAttribute('data-size', 'md');
    expect(maimai).toHaveAttribute('data-animated', 'true');
    expect(maimai).toHaveAttribute('data-effects', 'true');
  });

  it('passes reduced-motion flags to MaiMaiBase', () => {
    useMaiMaiA11yPropsMock.mockReturnValue({ animated: false, showEffects: false });
    renderEmptyState();

    const maimai = screen.getByTestId('maimai-base');
    expect(maimai).toHaveAttribute('data-animated', 'false');
    expect(maimai).toHaveAttribute('data-effects', 'false');
  });

  it('uses size="sm" on mobile viewport', () => {
    useMediaQueryMock.mockReturnValue(true);
    renderEmptyState();

    const maimai = screen.getByTestId('maimai-base');
    expect(maimai).toHaveAttribute('data-size', 'sm');
  });

  it('resolves upload link with basename prefix in production routing', () => {
    render(
      <MemoryRouter basename="/maihouses" initialEntries={['/maihouses/uag']}>
        <UAGEmptyState onDismiss={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: '上架物件' })).toHaveAttribute(
      'href',
      '/maihouses/property/upload'
    );
  });
});
