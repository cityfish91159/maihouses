import { useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Question } from '../types';

export interface UseQAModalStateReturn {
  askModalOpen: boolean;
  setAskModalOpen: (value: boolean) => void;
  askInput: string;
  setAskInput: (value: string) => void;
  answerModalOpen: boolean;
  setAnswerModalOpen: (value: boolean) => void;
  answerInput: string;
  setAnswerInput: (value: string) => void;
  activeQuestion: Question | null;
  setActiveQuestion: (value: Question | null) => void;
  submitting: 'ask' | 'answer' | null;
  setSubmitting: (value: 'ask' | 'answer' | null) => void;
  askError: string;
  setAskError: (value: string) => void;
  answerError: string;
  setAnswerError: (value: string) => void;
  askDialogRef: MutableRefObject<HTMLDivElement | null>;
  answerDialogRef: MutableRefObject<HTMLDivElement | null>;
  askTextareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  answerTextareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  feedbackTimeoutRef: MutableRefObject<number | null>;
  restoreFocusRef: MutableRefObject<HTMLElement | null>;
  resetAskModal: () => void;
  resetAnswerModal: () => void;
}

export function useQAModalState(): UseQAModalStateReturn {
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [askInput, setAskInput] = useState('');
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [answerInput, setAnswerInput] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [submitting, setSubmitting] = useState<'ask' | 'answer' | null>(null);
  const [askError, setAskError] = useState('');
  const [answerError, setAnswerError] = useState('');
  const askDialogRef = useRef<HTMLDivElement>(null);
  const answerDialogRef = useRef<HTMLDivElement>(null);
  const askTextareaRef = useRef<HTMLTextAreaElement>(null);
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null);
  const feedbackTimeoutRef = useRef<number>(null);
  const restoreFocusRef = useRef<HTMLElement>(null);

  const resetAskModal = () => {
    setAskInput('');
    setAskError('');
  };

  const resetAnswerModal = () => {
    setAnswerInput('');
    setAnswerError('');
    setActiveQuestion(null);
  };

  return {
    askModalOpen,
    setAskModalOpen,
    askInput,
    setAskInput,
    answerModalOpen,
    setAnswerModalOpen,
    answerInput,
    setAnswerInput,
    activeQuestion,
    setActiveQuestion,
    submitting,
    setSubmitting,
    askError,
    setAskError,
    answerError,
    setAnswerError,
    askDialogRef,
    answerDialogRef,
    askTextareaRef,
    answerTextareaRef,
    feedbackTimeoutRef,
    restoreFocusRef,
    resetAskModal,
    resetAnswerModal,
  };
}
