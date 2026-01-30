import { render } from '@testing-library/react';
import { StepIcon } from '../StepIcon';

describe('StepIcon', () => {
  it('renders icon for known step', () => {
    const { container } = render(<StepIcon stepKey="1" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders fallback icon for unknown step', () => {
    const { container } = render(<StepIcon stepKey="99" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
