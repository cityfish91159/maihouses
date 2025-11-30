import React from 'react';
import CommunityWallCard from './CommunityWallCard';

type ChatMessageProps = {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
};

/**
 * 解析訊息中的社區牆標記
 * 格式：[[社區牆:社區名稱:討論話題]]
 */
function parseCommunityWallTags(content: string): { text: string; cards: { name: string; topic: string }[] } {
    const regex = /\[\[社區牆:([^:]+):([^\]]+)\]\]/g;
    const cards: { name: string; topic: string }[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        cards.push({
            name: match[1].trim(),
            topic: match[2].trim()
        });
    }
    
    // 移除標記，保留純文字
    const text = content.replace(regex, '').trim();
    
    return { text, cards };
}

export default function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
    // 只有 assistant 訊息才解析社區牆標記
    const { text, cards } = role === 'assistant' 
        ? parseCommunityWallTags(content)
        : { text: content, cards: [] };

    return (
        <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] font-medium leading-relaxed shadow-sm ${role === 'user'
                        ? 'bg-brand-700 text-white rounded-br-sm'
                        : 'bg-white text-ink-900 border border-brand-100 rounded-bl-sm'
                    }`}
            >
                <div className="whitespace-pre-wrap">{text}</div>
                
                {/* 社區牆卡片 */}
                {cards.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {cards.map((card, i) => (
                            <CommunityWallCard 
                                key={i}
                                name={card.name}
                                topic={card.topic}
                            />
                        ))}
                    </div>
                )}
                
                {timestamp && (
                    <div className={`mt-1.5 text-[11px] font-bold ${role === 'user' ? 'text-brand-300' : 'text-brand-600/60'} text-right`}>
                        {new Date(timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>
        </div>
    );
}
