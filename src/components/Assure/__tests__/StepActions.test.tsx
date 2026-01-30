import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { StepActions } from '../StepActions';
import type { Step } from '../../../types/trust';

const agentRole = 'agent' as const;
const buyerRole = 'buyer' as const;

const baseStep: Step = {
  name: '測試步驟',
  agentStatus: 'pending',
  buyerStatus: 'pending',
  locked: false,
  data: { note: '測試內容' },
};

describe('StepActions', () => {
  it('renders agent submit action on current step', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <StepActions
        stepKey="1"
        step={baseStep}
        role={agentRole}
        isBusy={false}
        isCurrent={true}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={onSubmit}
        onConfirm={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: '送出' }));
    expect(onSubmit).toHaveBeenCalledWith('1');
  });

  it('renders buyer confirm action when agent submitted', () => {
    render(
      <StepActions
        stepKey="2"
        step={{ ...baseStep, agentStatus: 'submitted' }}
        role={buyerRole}
        isBusy={false}
        isCurrent={true}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={() => {}}
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText('確認送出')).toBeInTheDocument();
  });
});
