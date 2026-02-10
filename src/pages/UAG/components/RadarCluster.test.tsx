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

const mobileDenseLeads: Lead[] = Array.from({ length: 9 }, (_, index) => ({
  id: `dense-${index + 1}`,
  name: `Dense ${index + 1}`,
  grade: (['S', 'A', 'B', 'C', 'F'][index % 5] ?? 'F') as Lead['grade'],
  intent: 70 + index,
  prop: `Property ${index + 1}`,
  visit: 10 + index,
  price: 1200 + index * 20,
  status: 'new',
  ai: 'Dense data',
  session_id: `sess-dense-${index + 1}`,
  x: 48 + index * 0.4,
  y: 49 + index * 0.3,
}));

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

  it('updates selection markers and cluster state after selection', () => {
    const { container } = render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    const bubble = screen.getByRole('button', { name: 'Buyer Alpha - F級' });
    const cluster = container.querySelector('#radar-container');
    expect(cluster).not.toHaveAttribute('data-has-selection');
    expect(bubble).not.toHaveAttribute('data-clicked');
    expect(bubble).not.toHaveAttribute('data-selected');

    fireEvent.click(bubble);
    expect(bubble).toHaveAttribute('data-clicked', 'true');
    expect(bubble).toHaveAttribute('data-selected', 'true');
    expect(cluster).toHaveAttribute('data-has-selection', 'true');
  });

  it('renders grade chips with counts and filters bubbles by selected grade', () => {
    const { container } = render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    expect(screen.getByRole('button', { name: /全部\s*2/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /S\s*1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /F\s*1/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /S\s*1/ }));

    expect(container.querySelector('[aria-label="Buyer Beta - S級"]')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Buyer Alpha - F級"]')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /S\s*1/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses dynamic mobile container height from visible bubble count', () => {
    setMockContainerWidth(375);
    const { container, rerender } = render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    const radarSection = container.querySelector('#radar-section');
    expect(radarSection).toHaveStyle('min-height: 240px');

    rerender(<RadarCluster leads={mobileDenseLeads} onSelectLead={vi.fn()} />);
    expect(radarSection).toHaveStyle('min-height: 380px');
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
    expect(cssContent).toMatch(/\.uag-bubble\s*{[\s\S]*?min-width:\s*40px;[\s\S]*?min-height:\s*40px;/);
    expect(cssContent).toContain('.uag-bubble:focus-visible');
    expect(cssContent).toContain('outline: 3px solid var(--uag-brand);');
    expect(cssContent).toContain(".uag-bubble[data-selected='true']");
    expect(cssContent).toContain(".uag-cluster[data-has-selection='true'] .uag-bubble:not([data-selected='true'])");
    expect(cssContent).toContain('.uag-grade-chip');
    expect(cssContent).toContain('.uag-bubble::after');
    expect(cssContent).toContain('min-width: 48px');
    expect(cssContent).toContain('min-height: 48px');
    expect(cssContent).toContain('z-index: 1;');
    expect(cssContent).toContain('pointer-events: auto;');
    expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
    expect(cssContent).toContain(".uag-bubble[data-grade='S']");
    expect(cssContent).toContain(".uag-bubble[data-grade='A']");
  });
});
