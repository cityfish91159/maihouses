import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RadarCluster, { seededRandom } from './RadarCluster';
import type { Lead } from '../types/uag.types';

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
              height: 450,
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

const sampleLeads: Lead[] = [
  {
    id: 'lead-f-1',
    name: 'Buyer Alpha',
    grade: 'F',
    intent: 42,
    prop: 'Songshan 2BR',
    visit: 12,
    price: 1380,
    status: 'new',
    ai: 'Normal intent',
    session_id: 'sess-f-1',
    x: 35,
    y: 45,
  },
  {
    id: 'lead-s-1',
    name: 'Buyer Beta',
    grade: 'S',
    intent: 95,
    prop: 'Xinyi 3BR',
    visit: 20,
    price: 2980,
    status: 'new',
    ai: 'High intent',
    session_id: 'sess-s-1',
    x: 58,
    y: 54,
  },
];

describe('RadarCluster', () => {
  beforeEach(() => {
    setMockContainerWidth(800);
    vi.clearAllMocks();
  });

  it('renders bubbles with expected desktop sizes', () => {
    render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    const fBubble = screen.getByRole('button', { name: 'Buyer Alpha - F級' });
    const sBubble = screen.getByRole('button', { name: 'Buyer Beta - S級' });

    expect(fBubble).toHaveStyle('--w: 60px');
    expect(sBubble).toHaveStyle('--w: 120px');
    expect(screen.getByText('42%').className).toContain('uag-bubble-intent');
  });

  it('uses lead id as aria-label fallback when name is missing', () => {
    const leadWithoutName: Lead = { ...sampleLeads[0]!, name: '' };

    render(<RadarCluster leads={[leadWithoutName]} onSelectLead={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'lead-f-1 - F級' })).toBeInTheDocument();
  });

  it('updates data-clicked after selection', () => {
    render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    const bubble = screen.getByRole('button', { name: 'Buyer Alpha - F級' });
    expect(bubble).not.toHaveAttribute('data-clicked');

    fireEvent.click(bubble);
    expect(bubble).toHaveAttribute('data-clicked', 'true');
  });

  it('supports click and keyboard selection', () => {
    const onSelectLead = vi.fn();
    render(<RadarCluster leads={sampleLeads} onSelectLead={onSelectLead} />);

    const bubble = screen.getByRole('button', { name: 'Buyer Alpha - F級' });
    fireEvent.click(bubble);
    fireEvent.keyDown(bubble, { key: 'Enter' });
    fireEvent.keyDown(bubble, { key: ' ' });

    expect(onSelectLead).toHaveBeenCalledTimes(3);
    expect(onSelectLead).toHaveBeenNthCalledWith(1, sampleLeads[0]);
    expect(onSelectLead).toHaveBeenNthCalledWith(2, sampleLeads[0]);
    expect(onSelectLead).toHaveBeenNthCalledWith(3, sampleLeads[0]);
  });

  it('seededRandom is deterministic and handles empty seed', () => {
    const seeded = seededRandom('lead-123');
    const repeated = seededRandom('lead-123');
    const emptySeed = seededRandom('');

    expect(seeded).toBe(repeated);
    expect(emptySeed).toBeGreaterThanOrEqual(0);
    expect(emptySeed).toBeLessThan(1);
    expect(Number.isFinite(emptySeed)).toBe(true);
  });

  it('keeps focus and reduced-motion safeguards in CSS', () => {
    expect(cssContent).toMatch(/\.uag-bubble\s*{[\s\S]*?min-width:\s*48px;[\s\S]*?min-height:\s*48px;/);
    expect(cssContent).toContain('.uag-bubble:focus-visible');
    expect(cssContent).toContain('outline: 3px solid var(--uag-brand);');
    expect(cssContent).toContain('.uag-bubble::after');
    expect(cssContent).toContain('z-index: -1;');
    expect(cssContent).toContain('pointer-events: none;');
    expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
    expect(cssContent).toContain(".uag-bubble[data-grade='S']");
    expect(cssContent).toContain(".uag-bubble[data-grade='A']");
  });
});
