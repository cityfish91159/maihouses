import React from 'react';
import { Sparkles } from 'lucide-react';
import CommunityWallCard from './CommunityWallCard';
import ChatPropertyCard from './ChatPropertyCard';
import {
  parseCommunityWallTags,
  parsePropertyTags,
  parseScenarioTags,
  stripAllTags,
} from './chatMessageParser';

type ChatMessageProps = {
  sender: 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

/**
 * 情境描述卡片組件 - 增加溫度感
 */
function ScenarioCard({ description }: { description: string }) {
  return (
    <div className="my-3 rounded-r-lg border-l-4 border-orange-300 bg-gradient-to-r from-orange-50/80 to-amber-50/50 p-3 italic text-gray-600">
      <Sparkles size={16} className="mr-2 inline-block text-amber-500" aria-hidden="true" />
      <span className="leading-relaxed">{description}</span>
    </div>
  );
}

export default function ChatMessage({ sender, content, timestamp }: ChatMessageProps) {
  // 只有 assistant 訊息才解析標記
  const communityCards = sender === 'assistant' ? parseCommunityWallTags(content) : [];
  const propertyCards = sender === 'assistant' ? parsePropertyTags(content) : [];
  const scenarios = sender === 'assistant' ? parseScenarioTags(content) : [];
  const text = sender === 'assistant' ? stripAllTags(content) : content;
  const communityKeyCountMap = new Map<string, number>();
  const propertyKeyCountMap = new Map<string, number>();

  const communityCardsWithKey = communityCards.map((card) => {
    const baseKey = `${card.communityId ?? 'seed'}-${card.name}-${card.topic}`;
    const count = (communityKeyCountMap.get(baseKey) ?? 0) + 1;
    communityKeyCountMap.set(baseKey, count);
    return { ...card, key: `community-${baseKey}-${count}` };
  });

  const propertyCardsWithKey = propertyCards.map((property) => {
    const baseKey = `${property.community}-${property.propertyId}`;
    const count = (propertyKeyCountMap.get(baseKey) ?? 0) + 1;
    propertyKeyCountMap.set(baseKey, count);
    return { ...property, key: `property-${baseKey}-${count}` };
  });

  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] font-medium leading-relaxed shadow-sm ${
          sender === 'user'
            ? 'rounded-br-sm bg-brand-700 text-white'
            : 'rounded-bl-sm border border-brand-100 bg-white text-ink-900'
        }`}
      >
        <div className="whitespace-pre-wrap">{text}</div>

        {/* 情境描述卡片（在社區牆卡片前顯示）*/}
        {scenarios.length > 0 && (
          <div className="mt-2 space-y-2">
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.key} description={scenario.description} />
            ))}
          </div>
        )}

        {/* 社區牆卡片 */}
        {communityCardsWithKey.length > 0 && (
          <div className="mt-2 space-y-2">
            {communityCardsWithKey.map((card) =>
              card.communityId ? (
                <CommunityWallCard
                  key={card.key}
                  communityId={card.communityId}
                  name={card.name}
                  topic={card.topic}
                />
              ) : (
                <CommunityWallCard key={card.key} name={card.name} topic={card.topic} />
              )
            )}
          </div>
        )}

        {/* 物件卡片 */}
        {propertyCardsWithKey.length > 0 && (
          <div className="mt-2 space-y-2">
            {propertyCardsWithKey.map((prop) => (
              <ChatPropertyCard
                key={prop.key}
                community={prop.community}
                propertyId={prop.propertyId}
              />
            ))}
          </div>
        )}

        {timestamp && (
          <div
            className={`mt-1.5 text-[11px] font-bold ${sender === 'user' ? 'text-brand-300' : 'text-brand-600/60'} text-right`}
          >
            {new Date(timestamp).toLocaleTimeString('zh-TW', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
