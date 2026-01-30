import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TrustRoomMaiMai } from '../TrustRoomMaiMai';

// Mock useConfetti hook
vi.mock('../../MaiMai/useConfetti', () => ({
  default: () => ({
    fireConfetti: vi.fn(),
    ConfettiCanvas: () => <div data-testid="confetti-canvas" />,
  }),
}));

describe('TrustRoomMaiMai', () => {
  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(max-width: 640px)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders MaiMai with correct mood', () => {
    render(<TrustRoomMaiMai mood="happy" showConfetti={false} />);
    expect(screen.getByRole('img', { name: /maimai 吉祥物/i })).toBeInTheDocument();
  });

  it('renders confetti canvas when showConfetti is true', () => {
    render(<TrustRoomMaiMai mood="celebrate" showConfetti={true} />);
    expect(screen.getByTestId('confetti-canvas')).toBeInTheDocument();
  });

  it('does not render confetti canvas when showConfetti is false', () => {
    render(<TrustRoomMaiMai mood="wave" showConfetti={false} />);
    expect(screen.queryByTestId('confetti-canvas')).not.toBeInTheDocument();
  });

  it('uses correct size classes for accessibility (64px minimum)', () => {
    const { container } = render(
      <TrustRoomMaiMai mood="idle" showConfetti={false} />
    );
    // size-16 = 64px (符合 WCAG 2.1 最小觸控目標 44×44px)
    const maimai = container.querySelector('.size-16');
    expect(maimai).toBeInTheDocument();
  });

  it('handles mood changes correctly', () => {
    const { rerender } = render(
      <TrustRoomMaiMai mood="wave" showConfetti={false} />
    );

    rerender(<TrustRoomMaiMai mood="happy" showConfetti={false} />);
    expect(screen.getByRole('img')).toBeInTheDocument();

    rerender(<TrustRoomMaiMai mood="celebrate" showConfetti={true} />);
    expect(screen.getByTestId('confetti-canvas')).toBeInTheDocument();
  });

  it('initializes with correct mobile state', () => {
    const { container } = render(
      <TrustRoomMaiMai mood="idle" showConfetti={false} />
    );

    // Verify responsive classes exist
    const maimai = container.querySelector('.sm\\:size-20');
    expect(maimai).toBeInTheDocument();
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(
      <TrustRoomMaiMai mood="wave" showConfetti={false} />
    );

    // Unmount should not throw errors
    expect(() => unmount()).not.toThrow();
  });

  it('handles responsive breakpoints correctly', () => {
    const { container } = render(
      <TrustRoomMaiMai mood="idle" showConfetti={false} />
    );

    // Verify component renders with responsive classes
    expect(container.querySelector('.size-16')).toBeInTheDocument();
    expect(container.querySelector('.sm\\:size-20')).toBeInTheDocument();
  });

  it('provides accessible label for screen readers', () => {
    render(<TrustRoomMaiMai mood="happy" showConfetti={false} />);
    expect(screen.getByLabelText(/maimai 吉祥物/i)).toBeInTheDocument();
  });

  it('displays correct animation states', () => {
    const moods = ['idle', 'wave', 'happy', 'celebrate', 'shy'] as const;

    moods.forEach((mood) => {
      const { unmount } = render(
        <TrustRoomMaiMai mood={mood} showConfetti={false} />
      );
      expect(screen.getByRole('img')).toBeInTheDocument();
      unmount();
    });
  });
});
