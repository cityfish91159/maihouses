import React, { memo } from 'react';
import { cn } from '../../../lib/utils';
import type { AiMessage } from '../../../types';

interface ChatBubbleProps {
  message: AiMessage;
}

export const ChatBubble = memo(({ message }: ChatBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex animate-[fadeIn_0.3s_ease-out]',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'min-w-0 max-w-[85%] rounded-2xl px-4 py-3 text-[15px] shadow-sm md:max-w-[75%]',
          isUser
            ? 'rounded-tr-sm bg-brand text-white'
            : 'rounded-tl-sm border border-border-light bg-white text-text-primary'
        )}
      >
        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        {message.timestamp && (
          <div className={cn('mt-1.5 text-xs', isUser ? 'text-white/70' : 'text-text-tertiary')}>
            {new Date(message.timestamp).toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
});

ChatBubble.displayName = 'ChatBubble';
