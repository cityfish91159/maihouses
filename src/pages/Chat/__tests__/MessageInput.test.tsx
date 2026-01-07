import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../MessageInput';

const notifyError = vi.fn();

vi.mock('../../../lib/notify', () => ({
  notify: {
    error: (title: string, description?: string) => notifyError(title, description),
  },
}));

describe('MessageInput', () => {
  beforeEach(() => {
    notifyError.mockReset();
  });

  it('renders textarea with aria-label', () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByLabelText('輸入訊息')).toBeInTheDocument();
  });

  it('limits message length', () => {
    render(<MessageInput onSend={vi.fn()} />);
    const textarea = screen.getByLabelText('輸入訊息');
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  it('sends message on button click', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByLabelText('輸入訊息');
    await userEvent.type(textarea, 'hello');
    await userEvent.click(screen.getByRole('button', { name: /發送/i }));
    expect(onSend).toHaveBeenCalledWith('hello');
  });

  it('sends message on Enter', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByLabelText('輸入訊息');
    await userEvent.type(textarea, 'hi{enter}');
    expect(onSend).toHaveBeenCalledWith('hi');
  });

  it('does not send on Shift+Enter', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByLabelText('輸入訊息');
    await userEvent.type(textarea, 'hi{shift>}{enter}{/shift}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send when input is empty', async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<MessageInput onSend={onSend} />);
    await userEvent.click(screen.getByRole('button', { name: /發送/i }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('shows toast on send failure', async () => {
    const onSend = vi.fn().mockRejectedValue(new Error('fail'));
    render(<MessageInput onSend={onSend} />);
    const textarea = screen.getByLabelText('輸入訊息');
    await userEvent.type(textarea, 'oops');
    await userEvent.click(screen.getByRole('button', { name: /發送/i }));
    expect(notifyError).toHaveBeenCalled();
  });
});
