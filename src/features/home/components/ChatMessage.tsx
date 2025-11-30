import React from 'react';
import CommunityWallCard from './CommunityWallCard';
import ChatPropertyCard from './ChatPropertyCard';

type ChatMessageProps = {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
};

/**
 * 解析訊息中的社區牆標記
 * 格式：[[社區牆:社區名稱:討論話題]]
 */
function parseCommunityWallTags(content: string): { name: string; topic: string }[] {
    const regex = /\[\[社區牆:([^:]+):([^\]]+)\]\]/g;
    const cards: { name: string; topic: string }[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const name = match[1];
        const topic = match[2];
        if (name && topic) {
            cards.push({
                name: name.trim(),
                topic: topic.trim()
            });
        }
    }
    
    return cards;
}

/**
 * 解析訊息中的物件標記
 * 格式：[[物件:社區名稱:物件ID]]
 */
function parsePropertyTags(content: string): { community: string; propertyId: string }[] {
    const regex = /\[\[物件:([^:]+):([^\]]+)\]\]/g;
    const properties: { community: string; propertyId: string }[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const community = match[1];
        const propertyId = match[2];
        if (community && propertyId) {
            properties.push({
                community: community.trim(),
                propertyId: propertyId.trim()
            });
        }
    }
    
    return properties;
}

/**
 * 移除所有標記，保留純文字
 */
function stripAllTags(content: string): string {
    return content
        .replace(/\[\[社區牆:[^:]+:[^\]]+\]\]/g, '')
        .replace(/\[\[物件:[^:]+:[^\]]+\]\]/g, '')
        .trim();
}

export default function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
    // 只有 assistant 訊息才解析標記
    const communityCards = role === 'assistant' ? parseCommunityWallTags(content) : [];
    const propertyCards = role === 'assistant' ? parsePropertyTags(content) : [];
    const text = role === 'assistant' ? stripAllTags(content) : content;

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
                {communityCards.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {communityCards.map((card, i) => (
                            <CommunityWallCard 
                                key={`community-${i}`}
                                name={card.name}
                                topic={card.topic}
                            />
                        ))}
                    </div>
                )}

                {/* 物件卡片 */}
                {propertyCards.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {propertyCards.map((prop, i) => (
                            <ChatPropertyCard 
                                key={`property-${i}`}
                                community={prop.community}
                                propertyId={prop.propertyId}
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
