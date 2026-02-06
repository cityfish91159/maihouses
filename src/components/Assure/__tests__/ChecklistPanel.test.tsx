import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ChecklistPanel } from '../ChecklistPanel';

describe('ChecklistPanel', () => {
  it('toggles checklist item and confirms', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ChecklistPanel
        checklist={[{ id: '1', label: '交屋確認', checked: false }]}
        onToggle={onToggle}
        onConfirm={onConfirm}
      />
    );

    await user.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('1', true);

    await user.click(screen.getByRole('button', { name: '完成交屋' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
