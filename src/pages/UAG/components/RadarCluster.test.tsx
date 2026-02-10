import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import RadarCluster from './RadarCluster';
import type { Lead } from '../types/uag.types';

const UAG_STYLES_PATH = resolve(process.cwd(), 'src/pages/UAG/UAG.module.css');

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

describe('RadarCluster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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

  it('renders lead bubbles with touch-target-safe sizes and contrast class', () => {
    render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    const fBubble = screen.getByRole('button', { name: 'Buyer Alpha - F級' });
    const sBubble = screen.getByRole('button', { name: 'Buyer Beta - S級' });

    expect(fBubble.className).toContain('uag-bubble');
    expect(sBubble.className).toContain('uag-bubble');
    expect(fBubble).toHaveAttribute('tabindex', '0');
    expect(sBubble).toHaveAttribute('tabindex', '0');
    expect(fBubble).toHaveStyle('--w: 60px');
    expect(sBubble).toHaveStyle('--w: 120px');

    const intentNode = screen.getByText('42%');
    expect(intentNode.className).toContain('uag-bubble-intent');
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

  it('shows live monitor badge using scoped class', () => {
    render(<RadarCluster leads={sampleLeads} onSelectLead={vi.fn()} />);

    const badge = screen.getByText('Live 監控中').closest('div');
    expect(badge?.className).toContain('uag-cluster-live-badge');
  });

  it('includes focus-visible and reduced-motion safeguards in styles', () => {
    const css = readFileSync(UAG_STYLES_PATH, 'utf8');

    expect(css).toMatch(/\.uag-bubble\s*{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px;/);
    expect(css).toContain('.uag-bubble:focus-visible');
    expect(css).toContain('outline: 3px solid var(--uag-brand);');
    expect(css).toContain('.uag-live-dot');
    expect(css).toContain('animation: live-dot-pulse 2s ease-in-out infinite;');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('.uag-live-dot {');
    expect(css).toContain('animation: none;');
  });
});
