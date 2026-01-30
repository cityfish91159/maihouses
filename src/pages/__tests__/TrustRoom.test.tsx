import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TrustRoom from '../TrustRoom';

// Mock dependencies
vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  },
}));

vi.mock('../../hooks/useTrustRoomMaiMai', () => ({
  useTrustRoomMaiMai: () => ({
    maiMaiState: { visible: false, mood: 'idle', showConfetti: false },
    triggerWave: vi.fn(),
    triggerHappy: vi.fn(),
    triggerCelebrate: vi.fn(),
    triggerShyOnce: vi.fn(),
    triggerError: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('../../lib/logger');
vi.mock('../../lib/haptic');

const mockTrustRoomData = {
  id: 'test-id-12345678',
  case_name: '測試案件',
  agent_name: '測試房仲',
  token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  current_step: 2,
  steps: [
    { step: 1, name: '電聯', done: true, confirmed: true, confirmedAt: '2024-01-01' },
    { step: 2, name: '帶看', done: true, confirmed: false, confirmedAt: null },
    { step: 3, name: '出價', done: false, confirmed: false, confirmedAt: null },
  ],
};

describe('TrustRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('渲染成功不拋出錯誤', () => {
    expect(() => renderWithRouter(<TrustRoom />)).not.toThrow();
  });

  it('元件基本結構正確', () => {
    const { container } = renderWithRouter(<TrustRoom />);
    expect(container).toBeTruthy();
    expect(container.querySelector('.min-h-screen')).toBeTruthy();
  });
});
