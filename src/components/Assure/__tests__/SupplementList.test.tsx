import { render, screen } from '@testing-library/react';
import { SupplementList } from '../SupplementList';

describe('SupplementList', () => {
  it('renders supplement items', () => {
    render(
      <SupplementList supplements={[{ role: 'agent', content: '補充內容', timestamp: 0 }]} />
    );

    expect(screen.getByText('補充內容')).toBeInTheDocument();
    expect(screen.getByText('房仲')).toBeInTheDocument();
  });

  it('renders nothing when list is empty', () => {
    const { container } = render(<SupplementList supplements={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
