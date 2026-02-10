import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { StrictMode } from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RadarCluster, {
  BUBBLE_MIN_PADDING_PX,
  RADAR_CONTAINER_HEIGHT_PX,
  TOOLTIP_AUTO_HIDE_MS,
  getRadarContainerHeightPx,
} from './RadarCluster';
import type { Lead } from '../types/uag.types';
import * as overlapUtils from '../utils/resolveOverlap';

const UAG_STYLES_PATH = resolve(process.cwd(), 'src/pages/UAG/UAG.module.css');
const cssContent = readFileSync(UAG_STYLES_PATH, 'utf8');

let mockContainerWidth = 800;

function setMockContainerWidth(width: number): void {
  mockContainerWidth = width;
}

class ResizeObserverMock {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe = (target: Element): void => {
    Object.defineProperty(target, 'offsetWidth', {
      configurable: true,
      get: () => mockContainerWidth,
    });

    act(() => {
      this.callback(
        [
          {
            target,
            contentRect: {
              width: mockContainerWidth,
              height: RADAR_CONTAINER_HEIGHT_PX,
            } as DOMRectReadOnly,
          } as ResizeObserverEntry,
        ],
        this as unknown as ResizeObserver
      );
    });
  };

  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

function parseBubblePositionPx(
  bubble: HTMLElement,
  containerHeightPx: number
): { x: number; y: number; size: number } {
  const leftPercent = Number.parseFloat(bubble.style.left);
  const topPercent = Number.parseFloat(bubble.style.top);
  const size = Number.parseFloat(bubble.style.getPropertyValue('--w'));

  return {
    x: (leftPercent / 100) * mockContainerWidth,
    y: (topPercent / 100) * containerHeightPx,
    size,
  };
}

function getRenderedRadarContainerHeightPx(container: HTMLElement): number {
  const radarContainer = container.querySelector('#radar-container') as HTMLElement | null;
  if (!radarContainer) throw new Error('radar-container not found');
  const parsed = Number.parseFloat(radarContainer.style.minHeight);
  if (!Number.isFinite(parsed)) throw new Error('radar-container min-height is invalid');
  return parsed;
}

const sampleLeads: Lead[] = [
  {
    id: 'lead-s-02',
    name: 'S Lead 2',
    grade: 'S',
    intent: 95,
    prop: 'Xinyi 3BR',
    visit: 5,
    price: 3200,
    status: 'new',
    ai: 'High intent',
    session_id: 'sess-s-02',
    x: 50,
    y: 50,
  },
  {
    id: 'lead-s-01',
    name: 'S Lead 1',
    grade: 'S',
    intent: 93,
    prop: 'Daan 2BR',
    visit: 4,
    price: 2900,
    status: 'new',
    ai: 'High intent',
    session_id: 'sess-s-01',
    x: 50.6,
    y: 50.4,
  },
  {
    id: 'lead-a-01',
    name: 'A Lead 1',
    grade: 'A',
    intent: 85,
    prop: 'Songshan Studio',
    visit: 3,
    price: 2400,
    status: 'new',
    ai: 'Good intent',
    session_id: 'sess-a-01',
    x: 49.8,
    y: 50.1,
  },
];

const grades = ['S', 'A', 'B', 'C', 'F'] as const;
const denseMobileLeads: Lead[] = [
  [50, 50],
  [50.6, 50.4],
  [49.8, 49.9],
  [51.1, 50.7],
  [48.9, 50.5],
  [50.3, 49.2],
  [49.4, 51.2],
  [51.6, 49.8],
  [48.4, 49.6],
  [52, 50.1],
  [47.9, 50.8],
  [50.8, 48.7],
].map(([x, y], index) => ({
  id: `dense-${index + 1}`,
  name: `Dense Lead ${index + 1}`,
  grade: grades[index % grades.length] ?? 'F',
  intent: 90 - index,
  prop: `Property ${index + 1}`,
  visit: 1 + index,
  price: 1800 + index * 10,
  status: 'new',
  ai: 'Dense cluster',
  session_id: `sess-dense-${index + 1}`,
  x,
  y,
}));

describe('RadarCluster integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    setMockContainerWidth(800);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('applies deterministic labels with grade + id tiebreaker', () => {
    const { container } = render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    const sLeadOne = container.querySelector('[aria-label="S Lead 1 - S級"]');
    const sLeadTwo = container.querySelector('[aria-label="S Lead 2 - S級"]');

    expect(sLeadOne).toHaveStyle('--w: 120px');
    expect(sLeadOne?.querySelector('[class*="uag-bubble-id"]')?.textContent).toBe('S-01');
    expect(sLeadTwo?.querySelector('[class*="uag-bubble-id"]')?.textContent).toBe('S-02');
  });

  it('resolves overlap in a 320px mobile container', () => {
    setMockContainerWidth(320);
    // Allow 1px tolerance for floating-point precision
    const overlapTolerancePx = 1;

    const { container } = render(<RadarCluster leads={denseMobileLeads} onSelectLead={vi.fn()} />);
    const containerHeightPx = getRenderedRadarContainerHeightPx(container);
    const sBubble = container.querySelector('[aria-label="Dense Lead 1 - S級"]');
    const fBubble = container.querySelector('[aria-label="Dense Lead 5 - F級"]');
    expect(sBubble).toHaveStyle('--w: 72px');
    expect(fBubble).toHaveStyle('--w: 40px');
    expect(containerHeightPx).toBe(380);

    const bubbles = Array.from(container.querySelectorAll('[role="button"][data-grade]')) as HTMLElement[];
    expect(bubbles).toHaveLength(12);

    const parsed = bubbles.map((bubble) => parseBubblePositionPx(bubble, containerHeightPx));

    for (let i = 0; i < parsed.length; i++) {
      for (let j = i + 1; j < parsed.length; j++) {
        const bubbleA = parsed[i];
        const bubbleB = parsed[j];
        if (!bubbleA || !bubbleB) throw new Error('Missing bubble position');

        const distance = Math.hypot(bubbleB.x - bubbleA.x, bubbleB.y - bubbleA.y);
        const minDistance = bubbleA.size / 2 + bubbleB.size / 2 + BUBBLE_MIN_PADDING_PX;

        expect(distance).toBeGreaterThanOrEqual(minDistance - overlapTolerancePx);
      }
    }
  });

  it('calls resolveOverlap with expected geometry arguments', () => {
    setMockContainerWidth(360);
    const resolveOverlapSpy = vi.spyOn(overlapUtils, 'resolveOverlap');

    render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    expect(resolveOverlapSpy).toHaveBeenCalled();

    const latestCall = resolveOverlapSpy.mock.calls.at(-1);
    expect(latestCall).toBeDefined();
    if (!latestCall) throw new Error('resolveOverlap call not found');

    const [bubbles, containerWidth, containerHeight, padding] = latestCall;
    const expectedHeight = getRadarContainerHeightPx(sampleLeads.length, true);

    expect(containerWidth).toBe(360);
    expect(containerHeight).toBe(expectedHeight);
    expect(padding).toBe(BUBBLE_MIN_PADDING_PX);
    expect(bubbles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ size: 72 }),
        expect.objectContaining({ size: 60 }),
      ])
    );
  });

  it('shows tooltip on click and auto-hides after timeout', () => {
    vi.useFakeTimers();

    const { container } = render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);
    const bubble = container.querySelector('[aria-label="S Lead 2 - S級"]') as HTMLElement;

    expect(bubble).not.toHaveAttribute('data-clicked');
    fireEvent.click(bubble);
    expect(bubble).toHaveAttribute('data-clicked', 'true');

    act(() => {
      vi.advanceTimersByTime(TOOLTIP_AUTO_HIDE_MS);
    });

    expect(bubble).not.toHaveAttribute('data-clicked');
  });

  it('auto-hides tooltip in React.StrictMode', async () => {
    vi.useFakeTimers();

    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(
        <StrictMode>
          <RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />
        </StrictMode>
      ));
    });

    const bubble = container.querySelector('[aria-label="S Lead 2 - S級"]') as HTMLElement;
    act(() => {
      fireEvent.click(bubble);
    });
    expect(bubble).toHaveAttribute('data-clicked', 'true');

    act(() => {
      vi.advanceTimersByTime(TOOLTIP_AUTO_HIDE_MS);
    });

    expect(bubble).not.toHaveAttribute('data-clicked');
  });

  it('clears previous tooltip timeout on rapid reselection and unmount', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { container, unmount } = render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);
    const firstBubble = container.querySelector('[aria-label="S Lead 2 - S級"]') as HTMLElement;
    const secondBubble = container.querySelector('[aria-label="S Lead 1 - S級"]') as HTMLElement;

    fireEvent.click(firstBubble);
    fireEvent.click(secondBubble);
    expect(clearTimeoutSpy).toHaveBeenCalled();

    unmount();
    expect(() => {
      act(() => {
        vi.runOnlyPendingTimers();
      });
    }).not.toThrow();
  });

  it('clears tooltip when switching grade filter', () => {
    vi.useFakeTimers();

    const { container } = render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);
    const bubble = container.querySelector('[aria-label="S Lead 2 - S級"]') as HTMLElement;

    fireEvent.click(bubble);
    expect(bubble).toHaveAttribute('data-clicked', 'true');

    // Switch to A grade filter (sampleLeads has 1 A lead)
    const aGradeChip = container.querySelector('[data-grade="a"][aria-pressed="false"]') as HTMLElement;
    fireEvent.click(aGradeChip);

    // Tooltip should be cleared immediately
    expect(bubble).not.toBeInTheDocument();
  });

  it('keeps touch-layer and reduced-motion CSS safeguards', () => {
    expect(cssContent).toContain('.uag-bubble::after');
    expect(cssContent).toContain('min-width: 48px');
    expect(cssContent).toContain('min-height: 48px');
    expect(cssContent).toContain('z-index: 1;');
    expect(cssContent).toContain('pointer-events: auto;');
    expect(cssContent).toContain('@keyframes s-pulse');
    expect(cssContent).toContain('@keyframes a-pulse');
    expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
