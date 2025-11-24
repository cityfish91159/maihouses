import React from 'react';

type ChatMessageProps = {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
};

export default function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
    return (
        <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] font-medium leading-relaxed shadow-sm ${role === 'user'
                        ? 'bg-brand-700 text-white rounded-br-sm'
                        : 'bg-white text-ink-900 border border-brand-100 rounded-bl-sm'
                    }`}
            >
                <div className="whitespace-pre-wrap">{content}</div>
                {timestamp && (
                    <div className={`mt-1.5 text-[11px] font-bold ${role === 'user' ? 'text-brand-300' : 'text-brand-600/60'} text-right`}>
                        {new Date(timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>
        </div>
    );
}
