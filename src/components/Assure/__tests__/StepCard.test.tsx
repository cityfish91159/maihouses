import { render } from '@testing-library/react';
import { StepCard } from '../StepCard';
import type { Step } from '../../../types/trust';

const baseStep: Step = {
  name: '測試步驟',
  agentStatus: 'pending',
  buyerStatus: 'pending',
  locked: false,
  data: {},
};

describe('StepCard', () => {
  it('renders children and future state styles', () => {
    const { container, getByText } = render(
      <StepCard stepKey="1" step={baseStep} isCurrent={false} isPast={false} isFuture={true}>
        <div>內容</div>
      </StepCard>
    );

    expect(getByText('內容')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('opacity-60');
  });

  it('renders line for non-final step', () => {
    const { container } = render(
      <StepCard stepKey="1" step={baseStep} isCurrent={false} isPast={false} isFuture={false}>
        <div />
      </StepCard>
    );

    expect(container.querySelector('.w-\\[2px\\]')).toBeInTheDocument();
  });
});
