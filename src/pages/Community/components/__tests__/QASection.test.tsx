import type { ComponentProps } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QASection } from '../QASection';
import type { Question } from '../../types';

const questions: Question[] = [
  {
    id: 'q1',
    question: '晚上會不會很吵？',
    time: '1 天前',
    answersCount: 1,
    answers: [
      { author: '12F 住戶', type: 'resident', content: '晚上車流不多，很安靜。' },
    ],
  },
  {
    id: 'q2',
    question: '社區停車位好停嗎？',
    time: '剛剛',
    answersCount: 0,
    answers: [],
  },
];

describe('QASection accessibility modals', () => {
  const noop = vi.fn();

  beforeEach(() => {
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  const renderComponent = (overrides: Partial<ComponentProps<typeof QASection>> = {}) =>
    render(
      <QASection
        role="resident"
        questions={questions}
        onAskQuestion={noop}
        onAnswerQuestion={noop}
        {...overrides}
      />
    );

  it('focuses textarea, locks scroll, and closes on Escape', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('我想問問題'));
    const textarea = screen.getByLabelText('問題內容');
    await waitFor(() => expect(textarea).toHaveFocus());
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByText('提出你的問題')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');
  });

  it('auto clears feedback after submit success', async () => {
    const askSpy = vi.fn().mockResolvedValue(undefined);
    renderComponent({ onAskQuestion: askSpy, feedbackDurationMs: 100 });

    fireEvent.click(screen.getByText('我想問問題'));
    const textarea = screen.getByLabelText('問題內容');
    fireEvent.change(textarea, { target: { value: '這是一個超過十個字的測試內容' } });
    fireEvent.click(screen.getByRole('button', { name: '送出問題' }));

    await waitFor(() => expect(askSpy).toHaveBeenCalledTimes(1));
    await screen.findByText('✅ 問題已送出，住戶將收到通知。');
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 120));
    });
    await waitFor(() => expect(screen.queryByText(/問題已送出/)).not.toBeInTheDocument());
  });

  it('traps focus within ask modal when using Shift+Tab', () => {
    renderComponent();

    fireEvent.click(screen.getByText('我想問問題'));
    const closeButton = screen.getByLabelText('關閉發問視窗');
    const submitButton = screen.getByRole('button', { name: '送出問題' });

    closeButton.focus();
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(submitButton).toHaveFocus();
  });
});
