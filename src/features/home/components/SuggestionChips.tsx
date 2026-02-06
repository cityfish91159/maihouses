import React, { memo } from 'react';
import { QUICK_QUESTIONS } from '../../../constants/data';

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

export const SuggestionChips = memo(({ onSelect }: SuggestionChipsProps) => {
  return (
    <div className="flex min-w-fit flex-wrap items-center gap-1 md:flex-nowrap">
      {QUICK_QUESTIONS.map((q) => (
        <button
          key={q}
          data-text={q}
          className="border-border-default cursor-pointer whitespace-nowrap rounded-full border bg-white px-2 py-1.5 text-xs font-medium text-text-secondary transition-all duration-200 hover:border-brand hover:shadow-sm"
          onClick={() => onSelect(q)}
          aria-label={`快速輸入 ${q}`}
        >
          {q}
        </button>
      ))}
    </div>
  );
});

SuggestionChips.displayName = 'SuggestionChips';
