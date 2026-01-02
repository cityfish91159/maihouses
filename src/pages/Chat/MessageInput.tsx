import { useState } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (content: string) => Promise<void> | void;
  disabled?: boolean;
  isSending?: boolean;
}

export function MessageInput({ onSend, disabled, isSending }: MessageInputProps) {
  const [value, setValue] = useState('');

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    try {
      await onSend(trimmed);
      setValue('');
    } catch {
      // Keep input content when send fails.
    }
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        className="min-h-[44px] flex-1 resize-none rounded-2xl border border-brand-100 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-300 focus:outline-none"
        placeholder="輸入訊息..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="inline-flex items-center gap-2 rounded-2xl bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSending ? '傳送中' : '發送'}
        <Send size={16} />
      </button>
    </div>
  );
}
