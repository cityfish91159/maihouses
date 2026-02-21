/**
 * AgentProfileCard 性能測試
 * 驗證 P2 優化：useMemo 快取和樣式常數提取
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AgentProfileCard } from '../AgentProfileCard';

const mockProfile = {
  id: 'agent-1',
  name: 'Test Agent',
  role: 'agent' as const,
  communityId: 'comm-1',
  communityName: 'Test Comm',
  email: 'test@example.com',
  stats: { days: 10, liked: 5, contributions: 2 },
};

const mockStats = {
  score: 1000,
  days: 10,
  liked: 5,
  replies: 2,
  views: 100,
  contacts: 1,
  deals: 2,
  amount: 3280,
  clients: 18,
};

describe('AgentProfileCard Performance', () => {
  it('相同 props 重渲染時不應重算格式化分數', () => {
    const toLocaleStringSpy = vi.spyOn(Number.prototype, 'toLocaleString');
    const { rerender } = render(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={mockStats} />
      </MemoryRouter>
    );

    const callsAfterFirstRender = toLocaleStringSpy.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThan(0);

    // 使用相同 props 重新渲染
    rerender(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={mockStats} />
      </MemoryRouter>
    );

    const callsAfterSecondRender = toLocaleStringSpy.mock.calls.length;
    expect(callsAfterSecondRender).toBe(callsAfterFirstRender);
    toLocaleStringSpy.mockRestore();
  });

  it('應該在 stats 變化時正確更新', () => {
    const { rerender, getByText } = render(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={mockStats} />
      </MemoryRouter>
    );

    // 驗證初始數據
    expect(getByText(/1,000/)).toBeInTheDocument();

    // 更新 stats
    const newStats = { ...mockStats, score: 2000 };
    rerender(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={newStats} />
      </MemoryRouter>
    );

    // 驗證數據已更新
    expect(getByText(/2,000/)).toBeInTheDocument();
  });

  it('應該正確格式化大數字', () => {
    const largeStats = { ...mockStats, score: 123456 };
    const { getByText } = render(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={largeStats} />
      </MemoryRouter>
    );

    // 驗證千分位格式化
    expect(getByText(/123,456/)).toBeInTheDocument();
  });

  it('應該渲染兩個 badge 使用共用樣式', () => {
    render(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={mockStats} />
      </MemoryRouter>
    );

    const goldBadge = screen.getByText('黃金住戶');
    const verifiedBadge = screen.getByText('認證房仲');

    expect(goldBadge).toBeInTheDocument();
    expect(verifiedBadge).toBeInTheDocument();
  });

  it('應該渲染三個統計標籤使用共用樣式', () => {
    const { container } = render(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={mockStats} />
      </MemoryRouter>
    );

    // 檢查統計標籤樣式
    const statBadges = container.querySelectorAll('.border-green-200');
    expect(statBadges.length).toBe(3);
  });
});
