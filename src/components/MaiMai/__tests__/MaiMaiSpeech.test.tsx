import { render, screen } from '@testing-library/react';
import { MaiMaiSpeech } from '../MaiMaiSpeech';

describe('MaiMaiSpeech', () => {
  it('shows only the last three messages with correct styles and accessibility', () => {
    const messages = ['oldest', 'older', 'previous', 'latest'];

    render(<MaiMaiSpeech messages={messages} />);

    const bubble = screen.getByRole('status', { name: 'MaiMai 最新對話' });
    expect(bubble).toHaveAttribute('aria-live', 'polite');
    expect(bubble).toHaveAttribute('aria-atomic', 'true');

    const renderedMessages = screen.getAllByText(/old|previous|latest/);
    expect(renderedMessages).toHaveLength(3);
    expect(renderedMessages.map((el) => el.textContent)).toEqual(['older', 'previous', 'latest']);
    expect(renderedMessages[0]).toHaveClass('line-through');
    expect(renderedMessages[2]).toHaveClass('font-bold');
  });
});
