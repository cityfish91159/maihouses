import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { MaiMaiProvider } from '../../../context/MaiMaiContext';
import { TUTORIAL_CONFIG } from '../../../constants/tutorial';

// Mock dependencies with data-mood for cleaner assertions
vi.mock('../../MaiMai/MaiMaiBase', () => ({
  MaiMaiBase: ({ mood }: { mood: string }) => <div data-testid="maimai-base" data-mood={mood}>{mood}</div>
}));
vi.mock('../../MaiMai/MaiMaiSpeech', () => ({
  MaiMaiSpeech: () => <div data-testid="maimai-speech">Speech</div>
}));
vi.mock('../../Logo/Logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>
}));

describe('Header Component - Tutorial Interactions', () => {
  const mockDispatch = vi.fn();
  window.dispatchEvent = mockDispatch;

  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('MaiMai Click: Should cycle through tips (Happy Mood)', () => {
    render(
      <MaiMaiProvider>
        <Header />
      </MaiMaiProvider>
    );

    const mascot = screen.getByRole('button', { name: /邁邁小助手/i });

    // Click 1 -> Happy
    fireEvent.click(mascot);
    const base = screen.getByTestId('maimai-base');
    expect(base.getAttribute('data-mood')).toBe('happy');
  });

  it('MaiMai Celebration: Should trigger on 5th click', () => {
    render(
      <MaiMaiProvider>
        <Header />
      </MaiMaiProvider>
    );

    const mascot = screen.getByRole('button', { name: /邁邁小助手/i });

    // Click 1-4 (Tips)
    for (let i = 0; i < 4; i++) {
      fireEvent.click(mascot);
    }
    // Should NOT celebrate yet
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'mascot:celebrate' }));

    // Click 5 -> Celebrate
    fireEvent.click(mascot);
    expect(mockDispatch).toHaveBeenCalled();
    const event = mockDispatch.mock.calls[0]?.[0] as CustomEvent;
    expect(event?.type).toBe('mascot:celebrate');
  });

  it('Search Focus: Should show search hint (Thinking Mood)', () => {
    render(
      <MaiMaiProvider>
        <Header />
      </MaiMaiProvider>
    );

    const input = screen.getByPlaceholderText(/找評價最高的社區/i);
    fireEvent.focus(input);

    const base = screen.getByTestId('maimai-base');
    expect(base.getAttribute('data-mood')).toBe('thinking');
  });
});
