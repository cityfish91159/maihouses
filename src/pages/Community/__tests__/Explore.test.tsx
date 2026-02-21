import { fireEvent, render, screen } from '@testing-library/react';
import type { CommunityListItem } from '../hooks/useCommunityList';
import Explore from '../Explore';

const mockNavigate = vi.fn();
const mockUsePageMode = vi.fn(() => 'visitor');
const mockUseMediaQuery = vi.fn(() => false);
const mockUseCommunityList = vi.fn();
const mockRefetch = vi.fn();

const MOCK_COMMUNITIES: CommunityListItem[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: '捷運文心花園',
    address: '台中市西屯區捷運路 100 號',
    image: null,
    post_count: 24,
    review_count: 12,
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: '青山學苑',
    address: '台中市南屯區學區街 88 號',
    image: null,
    post_count: 8,
    review_count: 5,
  },
  {
    id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    name: '中央公園苑',
    address: '台中市北屯區中平路 66 號',
    image: null,
    post_count: 31,
    review_count: 9,
  },
];

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../components/layout/GlobalHeader', () => ({
  GlobalHeader: ({ mode }: { mode: string }) => (
    <div data-testid="global-header">header-{mode}</div>
  ),
}));

vi.mock('../../../components/MaiMai/MaiMaiBase', () => ({
  MaiMaiBase: () => <div data-testid="maimai-base" />,
}));

vi.mock('../../../components/MaiMai/MaiMaiSpeech', () => ({
  MaiMaiSpeech: ({ messages }: { messages: string[] }) => (
    <div data-testid="maimai-speech">{messages[messages.length - 1] ?? ''}</div>
  ),
}));

vi.mock('../../../hooks/usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

vi.mock('../../../hooks/useMaiMaiA11yProps', () => ({
  useMaiMaiA11yProps: () => ({ animated: false, showEffects: false }),
}));

vi.mock('../../../hooks/useMediaQuery', () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

vi.mock('../hooks/useCommunityList', () => ({
  useCommunityList: () => mockUseCommunityList(),
}));

describe('Explore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePageMode.mockReturnValue('visitor');
    mockUseMediaQuery.mockReturnValue(false);
    mockUseCommunityList.mockReturnValue({
      data: MOCK_COMMUNITIES,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });
  });

  it('載入中顯示三張骨架屏', () => {
    mockUseCommunityList.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mockRefetch,
    });

    const { container } = render(<Explore />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('錯誤狀態可重試，且重試按鈕有 focus-visible class', () => {
    mockUseCommunityList.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    render(<Explore />);

    const retryButton = screen.getByRole('button', { name: '重試' });
    expect(retryButton.className).toContain('focus-visible:ring-brand-400');

    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('MaiMai 按鈕有 focus-visible class', () => {
    render(<Explore />);

    const maimaiButton = screen.getByRole('button', { name: '點擊邁邁' });
    expect(maimaiButton.className).toContain('focus-visible:ring-brand-400');
  });

  it('可依搜尋字串過濾社區', () => {
    render(<Explore />);

    const input = screen.getByRole('textbox', { name: '搜尋社區' });
    fireEvent.change(input, { target: { value: '學區' } });

    expect(screen.getByText('青山學苑')).toBeInTheDocument();
    expect(screen.queryByText('捷運文心花園')).not.toBeInTheDocument();
    expect(screen.queryByText('中央公園苑')).not.toBeInTheDocument();
  });

  it('快速篩選可切換，結果列顯示對應篩選名稱', () => {
    render(<Explore />);

    fireEvent.click(screen.getByRole('button', { name: '評價高' }));

    expect(screen.getByText(/篩選：評價高/)).toBeInTheDocument();
    expect(screen.getByText('捷運文心花園')).toBeInTheDocument();
    expect(screen.queryByText('青山學苑')).not.toBeInTheDocument();
    expect(screen.queryByText('中央公園苑')).not.toBeInTheDocument();
  });

  it('可依貼文數排序（高到低）', () => {
    render(<Explore />);

    fireEvent.change(screen.getByRole('combobox', { name: '排序方式' }), {
      target: { value: 'postDesc' },
    });

    const cards = screen.getAllByRole('button', { name: /查看 .* 社區牆/ });
    expect(cards[0]).toHaveAccessibleName('查看 中央公園苑 社區牆');
  });

  it('visitor 顯示底部 CTA，live 隱藏 CTA', () => {
    const { rerender } = render(<Explore />);
    expect(screen.getByRole('button', { name: '免費註冊' })).toBeInTheDocument();

    mockUsePageMode.mockReturnValue('live');
    rerender(<Explore />);
    expect(screen.queryByRole('button', { name: '免費註冊' })).not.toBeInTheDocument();
  });
});
