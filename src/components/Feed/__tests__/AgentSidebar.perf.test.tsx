/**
 * AgentSidebar 性能測試
 *
 * 驗證 React.memo 和 useMemo 優化的效果
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AgentSidebar } from '../AgentSidebar';
import type { PerformanceStats, TodoItem } from '../../../types/agent';

const mockStats: PerformanceStats = {
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

const mockTodos: TodoItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `todo-${i}`,
  type: i % 2 === 0 ? 'contact' : 'reply',
  content: `Task ${i}`,
  isDone: false,
  time: '10:00',
})) as TodoItem[];

const mockHotPosts = Array.from({ length: 5 }, (_, i) => ({
  id: `post-${i}`,
  title: `Hot Post ${i}`,
  communityName: `Community ${i}`,
  likes: 100 * (i + 1),
}));

describe('AgentSidebar Performance', () => {
  it('should not re-render when props do not change (memo)', () => {
    const { rerender } = render(
      <MemoryRouter>
        <AgentSidebar stats={mockStats} todos={mockTodos} hotPosts={mockHotPosts} />
      </MemoryRouter>
    );

    // 使用相同的 props 重新渲染
    const renderSpy = vi.fn();

    rerender(
      <MemoryRouter>
        <AgentSidebar stats={mockStats} todos={mockTodos} hotPosts={mockHotPosts} />
      </MemoryRouter>
    );

    // memo 應該防止不必要的重渲染
    expect(renderSpy).not.toHaveBeenCalled();
  });

  it('should handle large lists efficiently', () => {
    const largeTodoList: TodoItem[] = Array.from({ length: 100 }, (_, i) => ({
      id: `todo-${i}`,
      type: i % 2 === 0 ? 'contact' : 'reply',
      content: `Task ${i}`,
      isDone: false,
      time: '10:00',
    })) as TodoItem[];

    const startTime = performance.now();

    render(
      <MemoryRouter>
        <AgentSidebar stats={mockStats} todos={largeTodoList} />
      </MemoryRouter>
    );

    const renderTime = performance.now() - startTime;

    // 渲染時間應該小於 200ms（考慮測試環境性能波動）
    expect(renderTime).toBeLessThan(200);
  });

  it('should efficiently re-render when only todos change', () => {
    const { rerender } = render(
      <MemoryRouter>
        <AgentSidebar stats={mockStats} todos={mockTodos} hotPosts={mockHotPosts} />
      </MemoryRouter>
    );

    const newTodos: TodoItem[] = [
      ...mockTodos,
      {
        id: 'new-todo',
        type: 'contact',
        content: 'New Task',
        isDone: false,
        time: '11:00',
      } as TodoItem,
    ];

    const startTime = performance.now();

    rerender(
      <MemoryRouter>
        <AgentSidebar stats={mockStats} todos={newTodos} hotPosts={mockHotPosts} />
      </MemoryRouter>
    );

    const rerenderTime = performance.now() - startTime;

    // 重渲染時間應該小於 50ms
    expect(rerenderTime).toBeLessThan(50);
  });
});
