/**
 * DataCollectionModal - UI Snapshot Tests
 * 確保 UI 變更有追蹤，防止意外的視覺回歸
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DataCollectionModal } from '../DataCollectionModal';

describe('DataCollectionModal - UI Snapshots', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSkip = vi.fn();

  it('matches snapshot when closed', () => {
    const { container } = render(
      <DataCollectionModal isOpen={false} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when open with empty form', () => {
    const { container } = render(
      <DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot when submitting', () => {
    const { container } = render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isSubmitting={true}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot of modal structure', () => {
    const { getByRole } = render(
      <DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );

    const dialog = getByRole('dialog');
    expect(dialog).toMatchSnapshot();
  });
});
