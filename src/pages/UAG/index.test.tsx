import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import UAGPage from './index';

beforeAll(() => {
  // jsdom does not implement scrollIntoView by default
  Element.prototype.scrollIntoView = vi.fn();
});

describe('UAGPage', () => {
  it('renders radar layout and default action panel', async () => {
    render(<UAGPage />);

    expect(await screen.findByText('UAG 精準導客雷達')).toBeInTheDocument();
    expect(screen.getByText(/請點擊上方雷達泡泡/)).toBeInTheDocument();
    expect(screen.getByText('點數')).toBeInTheDocument();
  });

  it('allows selecting and purchasing a lead', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    try {
      render(<UAGPage />);

      fireEvent.click(await screen.findByText('B218'));
      expect(screen.getByText('S級｜買家 B218')).toBeInTheDocument();

      await act(async () => {
        vi.useFakeTimers();
        fireEvent.click(screen.getByRole('button', { name: /立即購買聯絡/ }));
        await vi.runAllTimersAsync();
        vi.useRealTimers();
      });

      expect(alertMock).toHaveBeenCalled();
      // Initial points 1280, price 20 -> 1260
      expect(await screen.findByText('1260')).toBeInTheDocument();
      // B218 should be removed from radar (status changed to purchased)
      // Note: In the current implementation, purchased leads are removed from the radar list (liveLeads)
      expect(screen.queryByText('B218')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
      alertMock.mockRestore();
    }
  });
});
