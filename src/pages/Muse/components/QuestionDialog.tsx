import type { MuseQuestion } from '../types';

export interface QuestionDialogProps {
  question: MuseQuestion | null;
  onAnswer: (questionType: string, answer: string) => void;
  onClose: () => void;
}

export function QuestionDialog({ question, onAnswer, onClose }: QuestionDialogProps) {
  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-md mx-4 p-6 bg-gradient-to-br from-purple-950/90 to-pink-950/90 border border-purple-500/30 rounded-2xl shadow-2xl">
        {/* 問題文字 */}
        <div className="mb-6 text-center">
          <p className="text-lg text-purple-100 leading-relaxed whitespace-pre-line">
            {question.text}
          </p>
        </div>

        {/* 按鈕選項 */}
        <div className="flex flex-col gap-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                onAnswer(question.type, option.value);
                onClose();
              }}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                option.value === 'yes'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-500 hover:to-purple-500 hover:scale-105'
                  : 'bg-white/10 text-purple-200 hover:bg-white/20'
              }`}
            >
              {option.emoji && <span className="mr-2">{option.emoji}</span>}
              {option.label}
            </button>
          ))}
        </div>

        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-purple-300 hover:text-purple-100 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
