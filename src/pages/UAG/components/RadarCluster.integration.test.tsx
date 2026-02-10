import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RadarCluster from './RadarCluster';
import type { Lead } from '../types/uag.types';
import * as overlapUtils from '../utils/resolveOverlap';

const UAG_STYLES_PATH = resolve(process.cwd(), 'src/pages/UAG/UAG.module.css');
const cssContent = readFileSync(UAG_STYLES_PATH, 'utf-8');
const CLUSTER_HEIGHT_PX = 450;

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
              height: CLUSTER_HEIGHT_PX,
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

function parseBubblePositionPx(bubble: HTMLElement): { x: number; y: number; size: number } {
  const leftPercent = Number.parseFloat(bubble.style.left);
  const topPercent = Number.parseFloat(bubble.style.top);
  const size = Number.parseFloat(bubble.style.getPropertyValue('--w'));

  return {
    x: (leftPercent / 100) * mockContainerWidth,
    y: (topPercent / 100) * CLUSTER_HEIGHT_PX,
    size,
  };
}

describe('RadarCluster integration', () => {
  const grades = ['S', 'A', 'B', 'C', 'F'] as const;
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    setMockContainerWidth(800);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('applies deterministic labels with grade + id tiebreaker', async () => {
    const { container } = render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    await waitFor(() => {
      const sLeadOne = container.querySelector('[aria-label="S Lead 1 - S級"]');
      expect(sLeadOne).toHaveStyle('--w: 120px');
    });

    const sLeadOne = container.querySelector('[aria-label="S Lead 1 - S級"]');
    const sLeadTwo = container.querySelector('[aria-label="S Lead 2 - S級"]');

    expect(sLeadOne?.querySelector('[class*="uag-bubble-id"]')?.textContent).toBe('S-01');
    expect(sLeadTwo?.querySelector('[class*="uag-bubble-id"]')?.textContent).toBe('S-02');
  });

  it('resolves overlap in a 320px mobile container', async () => {
    setMockContainerWidth(320);

    const { container } = render(<RadarCluster leads={denseMobileLeads} onSelectLead={vi.fn()} />);

    await waitFor(() => {
      const sBubble = container.querySelector('[aria-label="Dense Lead 1 - S級"]');
      expect(sBubble).toHaveStyle('--w: 72px');
    });

    const bubbles = Array.from(container.querySelectorAll('[role="button"][data-grade]')) as HTMLElement[];
    expect(bubbles).toHaveLength(12);

    const parsed = bubbles.map(parseBubblePositionPx);

    for (let i = 0; i < parsed.length; i++) {
      for (let j = i + 1; j < parsed.length; j++) {
        const bubbleA = parsed[i];
        const bubbleB = parsed[j];
        if (!bubbleA || !bubbleB) {
          throw new Error('Missing bubble position');
        }

        const dx = bubbleB.x - bubbleA.x;
        const dy = bubbleB.y - bubbleA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = bubbleA.size / 2 + bubbleB.size / 2 + 4;

        expect(distance).toBeGreaterThanOrEqual(minDistance - 4);
      }
    }
  });

  it('calls resolveOverlap with expected geometry arguments', async () => {
    setMockContainerWidth(360);
    const resolveOverlapSpy = vi.spyOn(overlapUtils, 'resolveOverlap');

    render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    await waitFor(() => {
      expect(resolveOverlapSpy).toHaveBeenCalled();
    });

    const latestCall = resolveOverlapSpy.mock.calls.at(-1);
    expect(latestCall).toBeDefined();

    if (!latestCall) {
      throw new Error('resolveOverlap call not found');
    }

    const [bubbles, containerWidth, containerHeight, padding] = latestCall;

    expect(containerWidth).toBe(360);
    expect(containerHeight).toBe(CLUSTER_HEIGHT_PX);
    expect(padding).toBe(4);
    expect(bubbles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ size: 72 }),
        expect.objectContaining({ size: 60 }),
      ])
    );
  });

  it('shows tooltip when selected and auto-hides after 3 seconds', () => {
    const { container } = render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    const bubble = container.querySelector('[aria-label="S Lead 2 - S級"]') as HTMLElement;

    expect(bubble.getAttribute('data-clicked')).toBeNull();

    vi.useFakeTimers();
    fireEvent.click(bubble);
    expect(bubble.getAttribute('data-clicked')).toBe('true');

    act(() => {
      vi.advanceTimersByTime(TOOLTIP_TIMEOUT_MS);
    });

    expect(bubble.getAttribute('data-clicked')).toBeNull();
  });

  it('cleans pending tooltip timeout on unmount', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { container, unmount } = render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    const bubble = container.querySelector('[aria-label="S Lead 2 - S級"]') as HTMLElement;
    fireEvent.click(bubble);
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('keeps touch expansion and reduced-motion safeguards in CSS', () => {
    expect(cssContent).toContain('.uag-bubble::after');
    expect(cssContent).toContain('min-width: 48px');
    expect(cssContent).toContain('min-height: 48px');
    expect(cssContent).toContain('z-index: 1;');
    expect(cssContent).toContain('pointer-events: auto;');

    expect(cssContent).toContain('@keyframes s-pulse');
    expect(cssContent).toContain('@keyframes a-pulse');
    expect(cssContent).toContain(".uag-bubble[data-grade='S']");
    expect(cssContent).toContain(".uag-bubble[data-grade='A']");
    expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
  });
});

const TOOLTIP_TIMEOUT_MS = 3000;
