import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import UAGPage from './index';

// Mock Supabase client to avoid environment variable issues
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: {}, error: null })),
        or: vi.fn(() => ({ data: [], error: null })),
        order: vi.fn(() => ({ limit: vi.fn(() => ({ data: [], error: null })) })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

beforeAll(() => {
  // jsdom does not implement scrollIntoView by default
  Element.prototype.scrollIntoView = vi.fn();
  
  // Mock matchMedia for react-hot-toast
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('UAGPage', () => {
  it('renders radar layout and default action panel', async () => {
    render(<UAGPage />);

    expect(await screen.findByText('UAG 精準導客雷達')).toBeInTheDocument();
    expect(screen.getByText(/請點擊上方雷達泡泡/)).toBeInTheDocument();
    expect(screen.getByText('點數')).toBeInTheDocument();
  });

  it('allows selecting and purchasing a lead', async () => {
    // Mock toast instead of alert since we switched to react-hot-toast
    // But wait, the component uses toast.success/error. We can mock the module.
    
    try {
      render(<UAGPage />);

      // Wait for data to load (mock mode is default)
      const leadBubble = await screen.findByText('B218');
      fireEvent.click(leadBubble);
      
      expect(screen.getByText('S級｜買家 B218')).toBeInTheDocument();

      await act(async () => {
        vi.useFakeTimers();
        // Updated button text regex
        fireEvent.click(screen.getByRole('button', { name: /獲取聯絡權限/ }));
        await vi.runAllTimersAsync();
        vi.useRealTimers();
      });

      // Initial points 1280, price 20 -> 1260
      expect(await screen.findByText('1260')).toBeInTheDocument();
      // B218 should be removed from radar (status changed to purchased)
      expect(screen.queryByText('B218')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
