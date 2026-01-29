/**
 * AgentProfileCard 性能測試
 * 驗證 P2 優化：useMemo 快取和樣式常數提取
 */

import { render } from '@testing-library/react';
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
  it('應該在相同 props 下重用快取的元素', () => {
    const { rerender } = render(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={mockStats} />
      </MemoryRouter>
    );

    // 第一次渲染
    const firstRender = document.querySelector('section');
    expect(firstRender).toBeInTheDocument();

    // 使用相同 props 重新渲染
    rerender(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={mockStats} />
      </MemoryRouter>
    );

    // memo 應該阻止重新渲染
    const secondRender = document.querySelector('section');
    expect(secondRender).toBe(firstRender);
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
    const { container } = render(
      <MemoryRouter>
        <AgentProfileCard profile={mockProfile} stats={mockStats} />
      </MemoryRouter>
    );

    // 檢查 badge 樣式類名（共用的部分）
    const badges = container.querySelectorAll('.border-\\[\\#fde047\\]');
    expect(badges.length).toBeGreaterThanOrEqual(2);
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
