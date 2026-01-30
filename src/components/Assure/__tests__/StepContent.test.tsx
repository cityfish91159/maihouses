import { render, screen } from '@testing-library/react';
import { StepContent } from '../StepContent';
import type { Step } from '../../../types/trust';

const agentRole = 'agent' as const;

const baseStep: Step = {
  name: '看屋',
  agentStatus: 'pending',
  buyerStatus: 'pending',
  locked: false,
  data: { note: '帶看內容' },
};

describe('StepContent', () => {
  it('renders step title and viewing note', () => {
    render(
      <StepContent
        stepKey="2"
        step={baseStep}
        state={{
          isCurrent: true,
          role: agentRole,
          isBusy: false,
          inputValue: '',
          timeLeft: '--:--:--',
          isPaid: false,
          supplements: [],
          agentPaymentAmount: 2000,
        }}
        handlers={{
          onInputChange: () => {},
          onSubmit: () => {},
          onConfirm: () => {},
          onPay: () => {},
          onToggleCheck: () => {},
        }}
      />
    );

    expect(screen.getByText('看屋')).toBeInTheDocument();
    expect(screen.getByText('房仲帶看紀錄')).toBeInTheDocument();
    expect(screen.getByText('帶看內容')).toBeInTheDocument();
  });
});
